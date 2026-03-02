import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import lodashId from 'lodash-id';
import { ipcRenderer } from 'electron';

const userDataPath = ipcRenderer.sendSync('app:getUserDataPath');

if (!userDataPath) {
	throw new Error('Failed to retrieve user data path from main process via IPC.');
}

const dataAdapter = new FileSync(userDataPath);
let db = low(dataAdapter);

db._.mixin(lodashId);

export { db };
