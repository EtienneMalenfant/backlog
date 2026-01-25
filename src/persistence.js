import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import lodashId from 'lodash-id';
import processModule from 'process';

const { env } = processModule;
const userDataPath = env.BACKLOG_USER_DATA_PATH;

if (!userDataPath) {
	throw new Error('BACKLOG_USER_DATA_PATH is not defined; set it in the main process before creating windows.');
}

const dataAdapter = new FileSync(userDataPath);
let db = low(dataAdapter);

db._.mixin(lodashId);

export { db };
