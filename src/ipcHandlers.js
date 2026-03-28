'use strict';

import { ipcMain, shell } from 'electron';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import lodashId from 'lodash-id';
import shortid from 'shortid';
import { DiffPatcher } from 'jsondiffpatch';

const jsDiff = new DiffPatcher({
  objectHash: (obj) => obj.id,
});

// ─── Default data structures ───────────────────────────────────────────────────

const defaultKeyBindings = {
  acceptItemChange: { mac: ['meta', 'enter'], win: ['ctrl', 'enter'] },
  addNewBoard:      { win: ['ctrl', 'shift', 'n'], mac: ['meta', 'shift', 'n'] },
  cancelItemChange: { mac: ['esc'], win: ['esc'] },
  filterItemsFocus: { mac: ['meta', 'f'], win: ['ctrl', 'f'] },
  newItemFocus:     { mac: ['meta', 'n'], win: ['ctrl', 'n'] },
  nextTab:          { win: ['ctrl', 'shift', '}'], mac: ['meta', 'shift', ']'] },
  prevTab:          { win: ['ctrl', 'shift', '{'], mac: ['meta', 'shift', '['] },
  showEmoji:        { readonly: true, mac: ['meta', 'e'], win: ['ctrl', 'e'] },
  showFindItem:     { mac: ['meta', 'shift', 'f'], win: ['ctrl', 'shift', 'f'] },
  showKeymap:       { win: ['ctrl', 'k'], mac: ['meta', 'k'] },
};

function defaultBoard() {
  return {
    id: 'default',
    items: [],
    label: 'Default board',
    prependNewItem: false,
    showDone: false,
    showProgress: false,
  };
}

// ─── Database initialisation (called once from background.js) ──────────────────

let db;

export function initDatabase(userDataPath) {
  const dataAdapter = new FileSync(userDataPath);
  db = low(dataAdapter);
  db._.mixin(lodashId);

  db.defaults({
    activeBoard: 'default',
    boards: [defaultBoard()],
  }).write();

  db.defaults({
    appSettings: {
      itemCreationDate: true,
      keyBindings: defaultKeyBindings,
      prependNewItems: true,
      showUpdates: true,
      token: '',
      username: '',
      wasImported: false,
      language: 'en',
    },
  }).write();

  db.defaults({
    syncQueue: [],
  }).write();
}

// ─── Internal helper: sync queue ───────────────────────────────────────────────

function _isSync() {
  if (!db.get('appSettings.token').value()) return false;
  return !!db.get('appSettings.token').value().length && !!db.get('appSettings.username').value();
}

function _addAllToSyncQueue() {
  if (!_isSync()) return;
  return db.get('syncQueue').push('all').write();
}

function _addToSyncQueue(oldBoardVal, newBoardVal) {
  if (!_isSync()) return;
  const delta = jsDiff.diff(oldBoardVal, newBoardVal);
  if (delta) {
    return db.get('syncQueue').push({
      boardId: oldBoardVal.id,
      updated: new Date(),
      delta,
    }).write();
  }
}

// ─── Boards repository (main-process) ──────────────────────────────────────────

function boardsAddItemToBegin(boardId, text) {
  const board = db.get('boards').find({ id: boardId });
  const newItem = {
    id: shortid.generate(),
    isDone: false,
    created: new Date(),
    updated: new Date(),
    offline: true,
    text,
  };
  board.assign({ updated: new Date() }).write();
  const oldBoardVal = board.cloneDeep().value();
  board.get('items').unshift(newItem).write();
  const newBoardVal = board.cloneDeep().value();
  _addToSyncQueue(oldBoardVal, newBoardVal);
  return newItem;
}

function boardsAddItemToEnd(boardId, text, created, isDone) {
  const board = db.get('boards').find({ id: boardId });
  board.assign({ updated: new Date() }).write();
  const oldBoardVal = board.cloneDeep().value();
  const writeAction = board.get('items').insert({
    isDone: isDone || false,
    created: created || new Date(),
    updated: new Date(),
    offline: true,
    text,
  }).write();
  const newBoardVal = board.cloneDeep().value();
  _addToSyncQueue(oldBoardVal, newBoardVal);
  return writeAction;
}

function boardsAddNewBoard(boardName, defaults) {
  const boards = db.get('boards');
  const oldBoardsVal = boards.cloneDeep().value();
  const res = boards.insert({
    label: boardName,
    showDone: false,
    showProgress: false,
    prependNewItem: defaults.prependNewItems,
    items: [],
    updated: new Date(),
    created: new Date(),
    offline: true,
  }).write();
  const newBoardsVal = boards.cloneDeep().value();
  _addAllToSyncQueue(oldBoardsVal, newBoardsVal);
  return res;
}

function boardsSaveBoardsArray(boardsArray, syncSource) {
  const boards = db.get('boards');
  const oldBoardsVal = boards.cloneDeep().value();
  boardsArray.forEach((board) => { board.updated = new Date(); });
  const res = db.set('boards', boardsArray).write();
  const newBoardsVal = boards.cloneDeep().value();
  if (!syncSource) {
    _addAllToSyncQueue(oldBoardsVal, newBoardsVal);
  }
  return res;
}

function boardsSaveItemsArray(boardId, items) {
  const board = db.get('boards').find({ id: boardId });
  const oldBoardVal = board.cloneDeep().value();
  const res = board.set('items', items).write();
  const newBoardVal = board.cloneDeep().value();
  _addToSyncQueue(oldBoardVal, newBoardVal);
  return res;
}

function boardsChangeBoardsOrder(movedElement) {
  const allBoards = db.get('boards').cloneDeep().value();
  const movedItem = allBoards.splice(movedElement.oldIndex, 1)[0];
  allBoards.splice(movedElement.newIndex, 0, movedItem);
  boardsSaveBoardsArray(allBoards);
}

function boardsChangeItemsOrder(boardId, movedElement) {
  const items = db.get('boards').getById(boardId).get('items').cloneDeep().value();
  const movedItem = items.splice(movedElement.oldIndex, 1)[0];
  items.splice(movedElement.newIndex, 0, movedItem);
  boardsSaveItemsArray(boardId, items);
}

function boardsDuplicateBoard(boardId, newName) {
  const boards = db.get('boards');
  const oldBoardsVal = boards.cloneDeep().value();
  const items = boardsGetBoardItems(boardId);
  const res = boards.insert({
    label: newName,
    showDone: false,
    showProgress: false,
    prependNewItem: false,
    items,
    offline: true,
  }).write();
  const newBoardsVal = boards.cloneDeep().value();
  _addAllToSyncQueue(oldBoardsVal, newBoardsVal);
  return res;
}

function boardsGetActiveBoard() {
  return db.get('activeBoard').cloneDeep().value();
}

function boardsGetBoardById(boardId) {
  const board = db.get('boards').getById(boardId);
  return board ? board.cloneDeep().value() : null;
}

function boardsGetBoardItems(boardId) {
  const board = db.get('boards').getById(boardId).cloneDeep().value();
  return board ? board.items : [];
}

function boardsGetFirstBoard() {
  return db.get('boards').first().cloneDeep().value();
}

function boardsGetItems(boardId) {
  return db.get('boards').getById(boardId).get('items').cloneDeep().value();
}

function boardsGetList() {
  function doneItemsCount(boardItems) {
    return boardItems.filter((item) => item.isDone === true).length;
  }
  function progressCount(board) {
    const res = Math.round((doneItemsCount(board.items) / board.items.length) * 100);
    return isNaN(res) ? 0 : res;
  }
  return db.get('boards').cloneDeep().value().map((board) => ({
    id: board.id,
    label: board.label,
    progress: progressCount(board),
    prependNewItem: board.prependNewItem,
    showDone: board.showDone,
    showProgress: board.showProgress,
  }));
}

function boardsGetRawBoards() {
  return db.get('boards').cloneDeep().value();
}

function boardsGetState() {
  return db.getState();
}

function boardsImportDbFromJSON(boards) {
  boards.forEach((board) => {
    const newBoardObj = boardsAddNewBoard(board.label, { prependNewItems: board.prependNewItem });
    board.items.forEach((item) => {
      boardsAddItemToEnd(newBoardObj.id, item.text, item.created, item.isDone);
    });
  });
}

function boardsMoveItemToBoard(srcBoardId, dstBoardId, itemId) {
  if (srcBoardId === dstBoardId) return;
  const items = db.get('boards').find({ id: srcBoardId }).get('items').cloneDeep().value();
  const dstItems = db.get('boards').find({ id: dstBoardId }).get('items').cloneDeep().value();
  const index = items.findIndex((item) => item.id === itemId);
  const item = items.find((item) => item.id === itemId);
  if (!item) return;
  item.updated = new Date();
  const srcItems = [...items.slice(0, index), ...items.slice(index + 1)];
  dstItems.push(item);
  boardsSaveItemsArray(srcBoardId, srcItems);
  boardsSaveItemsArray(dstBoardId, dstItems);
}

function boardsMoveItemToBottom(boardId, itemId) {
  const board = db.get('boards').find({ id: boardId });
  const items = board.get('items').value();
  const index = items.findIndex((item) => item.id === itemId);
  const item = items.splice(index, 1)[0];
  item.updated = new Date();
  items.push(item);
  boardsSaveItemsArray(boardId, items);
}

function boardsMoveItemToTop(boardId, itemId) {
  const board = db.get('boards').find({ id: boardId });
  const items = board.get('items').value();
  const index = items.findIndex((item) => item.id === itemId);
  const item = items.splice(index, 1)[0];
  item.updated = new Date();
  items.unshift(item);
  boardsSaveItemsArray(boardId, items);
}

function boardsRemoveBoard(boardId) {
  const boards = db.get('boards');
  const oldBoardsVal = boards.cloneDeep().value();
  db.get('boards').remove({ id: boardId }).write();
  const newBoardsVal = boards.cloneDeep().value();
  _addAllToSyncQueue(oldBoardsVal, newBoardsVal);
}

function boardsRenameBoard(boardId, value) {
  const boards = db.get('boards');
  const oldBoardsVal = boards.cloneDeep().value();
  const res = boards.updateById(boardId, { label: value, updated: new Date() }).write();
  const newBoardsVal = boards.cloneDeep().value();
  _addAllToSyncQueue(oldBoardsVal, newBoardsVal);
  return res;
}

function boardsSetActiveBoard(boardId) {
  db.set('activeBoard', boardId).write();
}

function boardsSwitchShowDone(boardId, value) {
  const board = db.get('boards').find({ id: boardId });
  const oldBoardVal = board.cloneDeep().value();
  const res = board.assign({ showDone: value }).write();
  const newBoardVal = board.cloneDeep().value();
  _addToSyncQueue(oldBoardVal, newBoardVal);
  return res;
}

// ─── Items repository (main-process) ───────────────────────────────────────────

function itemsChangeItemValue(boardId, itemId, itemVal) {
  const board = db.get('boards').find({ id: boardId });
  board.assign({ updated: new Date() }).write();
  const oldBoardVal = board.cloneDeep().value();
  board.get('items').find({ id: itemId }).assign({ text: itemVal, updated: new Date() }).write();
  const newBoardVal = board.cloneDeep().value();
  _addToSyncQueue(oldBoardVal, newBoardVal);
}

function itemsRemoveItem(boardId, itemId) {
  const board = db.get('boards').find({ id: boardId });
  board.assign({ updated: new Date() }).write();
  const oldBoardVal = board.cloneDeep().value();
  board.get('items').remove({ id: itemId }).write();
  const newBoardVal = board.cloneDeep().value();
  _addToSyncQueue(oldBoardVal, newBoardVal);
}

function itemsSwitchIsDone(boardId, itemId, value) {
  const board = db.get('boards').find({ id: boardId });
  board.assign({ updated: new Date() }).write();
  const oldBoardVal = board.cloneDeep().value();
  const res = board.get('items').find({ id: itemId }).assign({ isDone: value, updated: new Date() }).write();
  const newBoardVal = board.cloneDeep().value();
  _addToSyncQueue(oldBoardVal, newBoardVal);
  return res;
}

function itemsSwitchPrependNewItem(boardId, value) {
  const board = db.get('boards').find({ id: boardId });
  const oldBoardVal = board.cloneDeep().value();
  const res = board.assign({ prependNewItem: value }).write();
  const newBoardVal = board.cloneDeep().value();
  _addToSyncQueue(oldBoardVal, newBoardVal);
  return res;
}

function itemsSwitchShowProgress(boardId, val) {
  const board = db.get('boards').find({ id: boardId });
  const oldBoardVal = board.cloneDeep().value();
  const res = board.assign({ showProgress: val }).write();
  const newBoardVal = board.cloneDeep().value();
  _addToSyncQueue(oldBoardVal, newBoardVal);
  return res;
}

// ─── Settings repository (main-process) ────────────────────────────────────────

function settingsAddKeyBinding(keyId, keyCombinations) {
  return db.get('appSettings.keyBindings').set(keyId, keyCombinations).write();
}

function settingsGetAppSettings() {
  return db.get('appSettings').cloneDeep().value();
}

function settingsGetKeyBindings() {
  return db.get('appSettings.keyBindings').cloneDeep().value();
}

function settingsHasKeyBindingsProperty() {
  return db.has('appSettings.keyBindings').value();
}

function settingsHasLanguageProperty() {
  return db.has('appSettings.language').value();
}

function settingsSetupKeyBindings() {
  settingsUpdateAppSettings({ keyBindings: defaultKeyBindings });
}

function settingsUpdateAppSettings(updateProp) {
  return db.get('appSettings').assign(updateProp).write();
}

function settingsUpdateKeyBinding(keyId, combination, isMac) {
  if (isMac) {
    return db.get(`appSettings.keyBindings.${keyId}`).set('mac', combination).write();
  }
  return db.get(`appSettings.keyBindings.${keyId}`).set('win', combination).write();
}

// ─── Sync repository (main-process, queue operations only) ─────────────────────

function syncResetQueue() {
  db.get('syncQueue').remove().write();
}

function syncUpdateLastSync(syncDate) {
  db.get('appSettings').assign({ lastSync: syncDate }).write();
}

function syncGetSyncQueue() {
  return db.get('syncQueue').value();
}

// ─── Register all IPC handlers ─────────────────────────────────────────────────

export function registerIpcHandlers(appVersion, userDataPath) {
  // App-level
  ipcMain.on('app:getUserDataPath', (event) => { event.returnValue = userDataPath; });
  ipcMain.on('app:getVersion', (event) => { event.returnValue = appVersion; });
  ipcMain.on('app:quit', () => { require('electron').app.quit(); });
  ipcMain.on('window:minimize', (event) => {
    const { BrowserWindow } = require('electron');
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
  });

  // Shell — validate URL protocol for security
  ipcMain.handle('shell:openExternal', async (_event, url) => {
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
      await shell.openExternal(url);
    }
  });

  // Dialogs
  ipcMain.handle('dialog:showSave', async (_event, options) => {
    const { dialog } = require('electron');
    return await dialog.showSaveDialog(options);
  });
  ipcMain.handle('dialog:showOpen', async (_event, options) => {
    const { dialog } = require('electron');
    return await dialog.showOpenDialog(options);
  });

  // ── Boards ──
  ipcMain.handle('db:boards:addItemToBegin', (_e, boardId, text) => boardsAddItemToBegin(boardId, text));
  ipcMain.handle('db:boards:addItemToEnd', (_e, boardId, text, created, isDone) => boardsAddItemToEnd(boardId, text, created, isDone));
  ipcMain.handle('db:boards:addNewBoard', (_e, boardName, defaults) => boardsAddNewBoard(boardName, defaults));
  ipcMain.handle('db:boards:changeBoardsOrder', (_e, movedElement) => boardsChangeBoardsOrder(movedElement));
  ipcMain.handle('db:boards:changeItemsOrder', (_e, boardId, movedElement) => boardsChangeItemsOrder(boardId, movedElement));
  ipcMain.handle('db:boards:duplicateBoard', (_e, boardId, newName) => boardsDuplicateBoard(boardId, newName));
  ipcMain.handle('db:boards:getActiveBoard', () => boardsGetActiveBoard());
  ipcMain.handle('db:boards:getBoardById', (_e, boardId) => boardsGetBoardById(boardId));
  ipcMain.handle('db:boards:getBoardItems', (_e, boardId) => boardsGetBoardItems(boardId));
  ipcMain.handle('db:boards:getFirstBoard', () => boardsGetFirstBoard());
  ipcMain.handle('db:boards:getItems', (_e, boardId) => boardsGetItems(boardId));
  ipcMain.handle('db:boards:getList', () => boardsGetList());
  ipcMain.handle('db:boards:getRawBoards', () => boardsGetRawBoards());
  ipcMain.handle('db:boards:getState', () => boardsGetState());
  ipcMain.handle('db:boards:importDbFromJSON', (_e, boards) => boardsImportDbFromJSON(boards));
  ipcMain.handle('db:boards:moveItemToBoard', (_e, src, dst, itemId) => boardsMoveItemToBoard(src, dst, itemId));
  ipcMain.handle('db:boards:moveItemToBottom', (_e, boardId, itemId) => boardsMoveItemToBottom(boardId, itemId));
  ipcMain.handle('db:boards:moveItemToTop', (_e, boardId, itemId) => boardsMoveItemToTop(boardId, itemId));
  ipcMain.handle('db:boards:removeBoard', (_e, boardId) => boardsRemoveBoard(boardId));
  ipcMain.handle('db:boards:renameBoard', (_e, boardId, value) => boardsRenameBoard(boardId, value));
  ipcMain.handle('db:boards:saveBoardsArray', (_e, arr, syncSource) => boardsSaveBoardsArray(arr, syncSource));
  ipcMain.handle('db:boards:saveItemsArray', (_e, boardId, items) => boardsSaveItemsArray(boardId, items));
  ipcMain.handle('db:boards:setActiveBoard', (_e, boardId) => boardsSetActiveBoard(boardId));
  ipcMain.handle('db:boards:switchShowDone', (_e, boardId, value) => boardsSwitchShowDone(boardId, value));

  // ── Items ──
  ipcMain.handle('db:items:changeItemValue', (_e, boardId, itemId, itemVal) => itemsChangeItemValue(boardId, itemId, itemVal));
  ipcMain.handle('db:items:removeItem', (_e, boardId, itemId) => itemsRemoveItem(boardId, itemId));
  ipcMain.handle('db:items:switchIsDone', (_e, boardId, itemId, value) => itemsSwitchIsDone(boardId, itemId, value));
  ipcMain.handle('db:items:switchPrependNewItem', (_e, boardId, value) => itemsSwitchPrependNewItem(boardId, value));
  ipcMain.handle('db:items:switchShowProgress', (_e, boardId, val) => itemsSwitchShowProgress(boardId, val));

  // ── Settings ──
  ipcMain.handle('db:settings:addKeyBinding', (_e, keyId, keyCombinations) => settingsAddKeyBinding(keyId, keyCombinations));
  ipcMain.handle('db:settings:getAppSettings', () => settingsGetAppSettings());
  ipcMain.handle('db:settings:getKeyBindings', () => settingsGetKeyBindings());
  ipcMain.handle('db:settings:hasKeyBindingsProperty', () => settingsHasKeyBindingsProperty());
  ipcMain.handle('db:settings:hasLanguageProperty', () => settingsHasLanguageProperty());
  ipcMain.handle('db:settings:setupKeyBindings', () => settingsSetupKeyBindings());
  ipcMain.handle('db:settings:updateAppSettings', (_e, updateProp) => settingsUpdateAppSettings(updateProp));
  ipcMain.handle('db:settings:updateKeyBinding', (_e, keyId, combination, isMac) => settingsUpdateKeyBinding(keyId, combination, isMac));

  // ── Sync ──
  ipcMain.handle('db:sync:isSync', () => _isSync());
  ipcMain.handle('db:sync:addAllToSyncQueue', () => _addAllToSyncQueue());
  ipcMain.handle('db:sync:addToSyncQueue', (_e, oldBoardVal, newBoardVal) => _addToSyncQueue(oldBoardVal, newBoardVal));
  ipcMain.handle('db:sync:resetQueue', () => syncResetQueue());
  ipcMain.handle('db:sync:updateLastSync', (_e, syncDate) => syncUpdateLastSync(syncDate));
  ipcMain.handle('db:sync:getSyncQueue', () => syncGetSyncQueue());
}

// Export default key bindings so settings store can reference them
export { defaultKeyBindings };
