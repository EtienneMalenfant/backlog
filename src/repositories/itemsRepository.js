// Renderer-side items repository — thin async wrapper over IPC.

export default {
  changeItemValue(boardId, itemId, itemVal) {
    return window.electronAPI.db.items.changeItemValue(boardId, itemId, itemVal);
  },
  removeItem(boardId, itemId) {
    return window.electronAPI.db.items.removeItem(boardId, itemId);
  },
  switchIsDone(boardId, itemId, value) {
    return window.electronAPI.db.items.switchIsDone(boardId, itemId, value);
  },
  switchPrependNewItem(boardId, value) {
    return window.electronAPI.db.items.switchPrependNewItem(boardId, value);
  },
  switchShowProgress(boardId, val) {
    return window.electronAPI.db.items.switchShowProgress(boardId, val);
  },
};
