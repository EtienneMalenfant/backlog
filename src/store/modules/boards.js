import boardsRepository from "./../../repositories/boardsRepository";
import itemsRepository from "./../../repositories/itemsRepository";
import EmojiIcons from "./../../assets/emojiIcons";

const state = {
  activeBoard: {},
  addItemEmoji: {
    search: "",
    icons: EmojiIcons,
    activeIndex: 0
  },
  boardItems: [],
  boardsList: [],
  findItem: {
    itemText: ""
  },
  isSubmittingNewItem: false,
  rawBoards: []
};

const mutations = {
  SET_ACTIVE_BOARD(state, board) {
    if (!board) {
      state.activeBoard = state.boardsList[0] || {};
      return;
    }
    const activeBoard = state.boardsList.find((b) => b.id === board.id);
    state.activeBoard = activeBoard || state.boardsList[0] || {};
  },
  SET_BOARD_ITEMS(state, items) {
    state.boardItems = items;
  },
  SET_BOARDS(state, boardsArray) {
    state.boardsList = boardsArray;
  },
  SET_FIND_ITEM_TEXT(state, val) {
    state.findItem.itemText = val;
  },
  SET_IS_SUBMITTING_NEW_ITEM(state, val) {
    state.isSubmittingNewItem = val;
  },
  SET_RAW_BOARDS(state, boards) {
    state.rawBoards = boards;
  },
  SWITCH_PREPEND_NEW_ITEM(state, {prependNewItem}) {
    state.activeBoard.prependNewItem = prependNewItem;
  },
  SWITCH_SHOW_DONE(state, {showDone}) {
    state.activeBoard.showDone = showDone;
  },
  SWITCH_SHOW_PROGRESS(state, val) {
    state.activeBoard.showProgress = val;
  }
};

const actions = {
  async addItem({state}, {boardId, newItem}) {
    const activeBoard = state.boardsList.find((board) => board.id === boardId);
    if (activeBoard.prependNewItem === true) {
      return await boardsRepository.addItemToBegin(boardId, newItem);
    } else {
      return await boardsRepository.addItemToEnd(boardId, newItem);
    }
  },
  async changeBoardsOrder(context, moved) {
    await boardsRepository.changeBoardsOrder(moved);
  },
  changeFindItem({commit}, val) {
    commit("SET_FIND_ITEM_TEXT", val);
  },
  async changeIsDone(context, {boardId, itemId, newVal}) {
    await itemsRepository.switchIsDone(boardId, itemId, newVal);
  },
  async changeItemVal(context, {boardId, itemId, newVal}) {
    await itemsRepository.changeItemValue(boardId, itemId, newVal);
  },
  async fetchActiveBoard({commit}) {
    const activeBoardId = await boardsRepository.getActiveBoard();
    const board = await boardsRepository.getBoardById(activeBoardId);
    commit("SET_ACTIVE_BOARD", board);
  },
  async fetchBoardItems({commit}, boardId) {
    const items = await boardsRepository.getBoardItems(boardId);
    commit("SET_BOARD_ITEMS", items);
  },
  async fetchBoards({commit}) {
    const list = await boardsRepository.getList();
    commit("SET_BOARDS", list);
  },
  async fetchRawBoards({commit}) {
    const boards = await boardsRepository.getRawBoards();
    commit("SET_RAW_BOARDS", boards);
  },
  async itemsOrderChanged(context, {moved, boardId}) {
    await boardsRepository.changeItemsOrder(boardId, moved);
  },
  async moveItemToBoard({dispatch}, {srcBoardId, dstBoardId, itemId}) {
    await boardsRepository.moveItemToBoard(srcBoardId, dstBoardId, itemId);
    await dispatch("fetchBoards");
  },
  async moveItemToBottom(context, {boardId, itemId}) {
    await boardsRepository.moveItemToBottom(boardId, itemId);
  },
  async moveItemToTop(context, {boardId, itemId}) {
    await boardsRepository.moveItemToTop(boardId, itemId);
  },
  async removeBoard(context, boardId) {
    await boardsRepository.removeBoard(boardId);
  },
  async removeItem({dispatch}, {boardId, itemId}) {
    await itemsRepository.removeItem(boardId, itemId);
    await dispatch("fetchBoards");
  },
  async renameBoard(context, {boardId, newName}) {
    await boardsRepository.renameBoard(boardId, newName);
  },
  async saveNewBoard({commit, dispatch, rootState}, boardName) {
    const savedBoard = await boardsRepository.addNewBoard(boardName, rootState.settings);
    await dispatch("fetchBoards");
    commit("SET_ACTIVE_BOARD", savedBoard);
    return savedBoard.id;
  },
  async setActiveBoard({commit}, boardId) {
    await boardsRepository.setActiveBoard(boardId);
    const board = await boardsRepository.getBoardById(boardId);
    commit("SET_ACTIVE_BOARD", board);
  },
  async setFirstBoardAsActiveBoard({commit}) {
    const activeBoard = await boardsRepository.getFirstBoard();
    await boardsRepository.setActiveBoard(activeBoard.id);
    commit("SET_ACTIVE_BOARD", activeBoard);
    return activeBoard.id;
  },
  setIsSubmittingNewItem({commit}, val) {
    commit("SET_IS_SUBMITTING_NEW_ITEM", val);
  },
  async switchPrependNewItem({commit}, {boardId, prependNewItem}) {
    await itemsRepository.switchPrependNewItem(boardId, prependNewItem);
    commit("SWITCH_PREPEND_NEW_ITEM", {boardId, prependNewItem});
  },
  async switchShowDone({commit}, {boardId, showDone}) {
    await boardsRepository.switchShowDone(boardId, showDone);
    commit("SWITCH_SHOW_DONE", {boardId, showDone});
  },
  async switchShowProgress({commit}, {boardId, val}) {
    await itemsRepository.switchShowProgress(boardId, val);
    commit("SWITCH_SHOW_PROGRESS", val);
  },
  async syncBoardsDone({dispatch}, boards) {
    await boardsRepository.saveBoardsArray(boards, true);
    await dispatch("fetchBoards");
    await dispatch("fetchRawBoards");
  },
  async updateLastSync({commit}, syncDate) {
    commit("SET_CLOUD_LAST_SYNC", syncDate);
    await window.electronAPI.db.sync.updateLastSync(syncDate);
  }
};

export default {
  state,
  mutations,
  actions
};
