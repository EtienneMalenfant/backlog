// Renderer-side boards repository — thin async wrapper over IPC.
// All actual DB logic lives in the main process (ipcHandlers.js).

export default {
  addItemToBegin(boardId, text) {
    return window.electronAPI.db.boards.addItemToBegin(boardId, text);
  },
  addItemToEnd(boardId, text, created, isDone) {
    return window.electronAPI.db.boards.addItemToEnd(boardId, text, created, isDone);
  },
  addNewBoard(boardName, defaults) {
    return window.electronAPI.db.boards.addNewBoard(boardName, defaults);
  },
  changeBoardsOrder(movedElement) {
    return window.electronAPI.db.boards.changeBoardsOrder(movedElement);
  },
  changeItemsOrder(boardId, movedElement) {
    return window.electronAPI.db.boards.changeItemsOrder(boardId, movedElement);
  },
  duplicateBoard(boardId, newName) {
    return window.electronAPI.db.boards.duplicateBoard(boardId, newName);
  },
  exportBoardToJSON(fileName, boardId) {
    return window.electronAPI.db.boards.getItems(boardId).then((items) => {
      return window.electronAPI.fs.writeFile(fileName, JSON.stringify(items));
    });
  },
  exportDbToJSON(fileName) {
    return window.electronAPI.db.boards.getState().then((state) => {
      return window.electronAPI.fs.writeFile(fileName, JSON.stringify(state));
    });
  },
  getActiveBoard() {
    return window.electronAPI.db.boards.getActiveBoard();
  },
  getBoardById(boardId) {
    return window.electronAPI.db.boards.getBoardById(boardId);
  },
  getBoardItems(boardId) {
    return window.electronAPI.db.boards.getBoardItems(boardId);
  },
  getFirstBoard() {
    return window.electronAPI.db.boards.getFirstBoard();
  },
  getItems(boardId) {
    return window.electronAPI.db.boards.getItems(boardId);
  },
  getList() {
    return window.electronAPI.db.boards.getList();
  },
  getRawBoards() {
    return window.electronAPI.db.boards.getRawBoards();
  },
  importDbFromJSON(filePath) {
    return window.electronAPI.fs.readFile(filePath).then((content) => {
      const data = JSON.parse(content);
      return window.electronAPI.db.boards.importDbFromJSON(data.boards);
    });
  },
  moveItemToBoard(srcBoardId, dstBoardId, itemId) {
    return window.electronAPI.db.boards.moveItemToBoard(srcBoardId, dstBoardId, itemId);
  },
  moveItemToBottom(boardId, itemId) {
    return window.electronAPI.db.boards.moveItemToBottom(boardId, itemId);
  },
  moveItemToTop(boardId, itemId) {
    return window.electronAPI.db.boards.moveItemToTop(boardId, itemId);
  },
  removeBoard(boardId) {
    return window.electronAPI.db.boards.removeBoard(boardId);
  },
  renameBoard(boardId, value) {
    return window.electronAPI.db.boards.renameBoard(boardId, value);
  },
  saveBoardsArray(boardsArray, syncSource) {
    return window.electronAPI.db.boards.saveBoardsArray(boardsArray, syncSource);
  },
  saveItemsArray(boardId, items) {
    return window.electronAPI.db.boards.saveItemsArray(boardId, items);
  },
  setActiveBoard(boardId) {
    return window.electronAPI.db.boards.setActiveBoard(boardId);
  },
  switchShowDone(boardId, value) {
    return window.electronAPI.db.boards.switchShowDone(boardId, value);
  },
};
