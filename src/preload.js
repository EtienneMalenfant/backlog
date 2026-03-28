'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── App ──────────────────────────────────────────────
  app: {
    quit: () => ipcRenderer.send('app:quit'),
    getVersion: () => ipcRenderer.sendSync('app:getVersion'),
    getUserDataPath: () => ipcRenderer.sendSync('app:getUserDataPath'),
  },

  // ── Window ───────────────────────────────────────────
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
  },

  // ── Dialog ───────────────────────────────────────────
  dialog: {
    showSave: (options) => ipcRenderer.invoke('dialog:showSave', options),
    showOpen: (options) => ipcRenderer.invoke('dialog:showOpen', options),
  },

  // ── Shell ────────────────────────────────────────────
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },

  // ── File I/O (for export / import via user-chosen paths) ──
  fs: {
    writeFile: (filePath, data) => fs.promises.writeFile(filePath, data, 'utf-8'),
    readFile: (filePath) => fs.promises.readFile(filePath, 'utf-8'),
  },

  // ── Database (boards repository) ─────────────────────
  db: {
    boards: {
      addItemToBegin:   (boardId, text) => ipcRenderer.invoke('db:boards:addItemToBegin', boardId, text),
      addItemToEnd:     (boardId, text, created, isDone) => ipcRenderer.invoke('db:boards:addItemToEnd', boardId, text, created, isDone),
      addNewBoard:      (boardName, defaults) => ipcRenderer.invoke('db:boards:addNewBoard', boardName, defaults),
      changeBoardsOrder:(movedElement) => ipcRenderer.invoke('db:boards:changeBoardsOrder', movedElement),
      changeItemsOrder: (boardId, movedElement) => ipcRenderer.invoke('db:boards:changeItemsOrder', boardId, movedElement),
      duplicateBoard:   (boardId, newName) => ipcRenderer.invoke('db:boards:duplicateBoard', boardId, newName),
      getActiveBoard:   () => ipcRenderer.invoke('db:boards:getActiveBoard'),
      getBoardById:     (boardId) => ipcRenderer.invoke('db:boards:getBoardById', boardId),
      getBoardItems:    (boardId) => ipcRenderer.invoke('db:boards:getBoardItems', boardId),
      getFirstBoard:    () => ipcRenderer.invoke('db:boards:getFirstBoard'),
      getItems:         (boardId) => ipcRenderer.invoke('db:boards:getItems', boardId),
      getList:          () => ipcRenderer.invoke('db:boards:getList'),
      getRawBoards:     () => ipcRenderer.invoke('db:boards:getRawBoards'),
      getState:         () => ipcRenderer.invoke('db:boards:getState'),
      importDbFromJSON: (boards) => ipcRenderer.invoke('db:boards:importDbFromJSON', boards),
      moveItemToBoard:  (srcBoardId, dstBoardId, itemId) => ipcRenderer.invoke('db:boards:moveItemToBoard', srcBoardId, dstBoardId, itemId),
      moveItemToBottom: (boardId, itemId) => ipcRenderer.invoke('db:boards:moveItemToBottom', boardId, itemId),
      moveItemToTop:    (boardId, itemId) => ipcRenderer.invoke('db:boards:moveItemToTop', boardId, itemId),
      removeBoard:      (boardId) => ipcRenderer.invoke('db:boards:removeBoard', boardId),
      renameBoard:      (boardId, value) => ipcRenderer.invoke('db:boards:renameBoard', boardId, value),
      saveBoardsArray:  (boardsArray, syncSource) => ipcRenderer.invoke('db:boards:saveBoardsArray', boardsArray, syncSource),
      saveItemsArray:   (boardId, items) => ipcRenderer.invoke('db:boards:saveItemsArray', boardId, items),
      setActiveBoard:   (boardId) => ipcRenderer.invoke('db:boards:setActiveBoard', boardId),
      switchShowDone:   (boardId, value) => ipcRenderer.invoke('db:boards:switchShowDone', boardId, value),
    },

    // ── Database (items repository) ──────────────────────
    items: {
      changeItemValue:    (boardId, itemId, itemVal) => ipcRenderer.invoke('db:items:changeItemValue', boardId, itemId, itemVal),
      removeItem:         (boardId, itemId) => ipcRenderer.invoke('db:items:removeItem', boardId, itemId),
      switchIsDone:       (boardId, itemId, value) => ipcRenderer.invoke('db:items:switchIsDone', boardId, itemId, value),
      switchPrependNewItem:(boardId, value) => ipcRenderer.invoke('db:items:switchPrependNewItem', boardId, value),
      switchShowProgress: (boardId, val) => ipcRenderer.invoke('db:items:switchShowProgress', boardId, val),
    },

    // ── Database (settings repository) ───────────────────
    settings: {
      addKeyBinding:        (keyId, keyCombinations) => ipcRenderer.invoke('db:settings:addKeyBinding', keyId, keyCombinations),
      getAppSettings:       () => ipcRenderer.invoke('db:settings:getAppSettings'),
      getKeyBindings:       () => ipcRenderer.invoke('db:settings:getKeyBindings'),
      hasKeyBindingsProperty:() => ipcRenderer.invoke('db:settings:hasKeyBindingsProperty'),
      hasLanguageProperty:  () => ipcRenderer.invoke('db:settings:hasLanguageProperty'),
      setupKeyBindings:     () => ipcRenderer.invoke('db:settings:setupKeyBindings'),
      updateAppSettings:    (updateProp) => ipcRenderer.invoke('db:settings:updateAppSettings', updateProp),
      updateKeyBinding:     (keyId, combination, isMac) => ipcRenderer.invoke('db:settings:updateKeyBinding', keyId, combination, isMac),
    },

    // ── Database (sync repository) ───────────────────────
    sync: {
      isSync:           () => ipcRenderer.invoke('db:sync:isSync'),
      addAllToSyncQueue:() => ipcRenderer.invoke('db:sync:addAllToSyncQueue'),
      addToSyncQueue:   (oldBoardVal, newBoardVal) => ipcRenderer.invoke('db:sync:addToSyncQueue', oldBoardVal, newBoardVal),
      resetQueue:       () => ipcRenderer.invoke('db:sync:resetQueue'),
      updateLastSync:   (syncDate) => ipcRenderer.invoke('db:sync:updateLastSync', syncDate),
      getSyncQueue:     () => ipcRenderer.invoke('db:sync:getSyncQueue'),
    },
  },
});
