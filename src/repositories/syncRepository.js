// Renderer-side sync repository — thin async wrapper over IPC for DB operations.
// Network calls (login, initialSync, patchSync) stay in the renderer since axios
// does not require Node.js APIs.

import axios from 'axios';
import cloudSettings from './../cloud';

export default {
  isSync() {
    return window.electronAPI.db.sync.isSync();
  },
  addAllToSyncQueue() {
    return window.electronAPI.db.sync.addAllToSyncQueue();
  },
  addToSyncQueue(oldBoardVal, newBoardVal) {
    return window.electronAPI.db.sync.addToSyncQueue(oldBoardVal, newBoardVal);
  },
  initialSync(username, rawBoards, token, lastSync) {
    return axios({
      method: 'post',
      url: cloudSettings.boardsUrl(username, lastSync),
      data: { boards: rawBoards },
      headers: { 'Authorization': `JWT ${token}` },
    });
  },
  login(username, password) {
    return axios.post(cloudSettings.login, { username, password });
  },
  resetQueue() {
    return window.electronAPI.db.sync.resetQueue();
  },
  updateLastSync(syncDate) {
    return window.electronAPI.db.sync.updateLastSync(syncDate);
  },
  patchSync(username, token, lastSync) {
    if (!username || !token) {
      return Promise.reject();
    }
    return window.electronAPI.db.sync.getSyncQueue().then((queue) => {
      if (!queue || queue.length === 0) {
        return axios({
          method: 'get',
          url: cloudSettings.boardsUrl(username, lastSync),
          headers: { 'Authorization': `JWT ${token}` },
        });
      }
      return axios({
        method: 'post',
        url: cloudSettings.boardPatchUrl(username, lastSync),
        data: { queue },
        headers: { 'Authorization': `JWT ${token}` },
      });
    });
  },
};
