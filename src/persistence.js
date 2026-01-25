import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import lodashId from 'lodash-id';

import { remote } from 'electron';
const userDataPath = remote.getCurrentWindow().userDataPath;

const dataAdapter = new FileSync(userDataPath);
let db = low(dataAdapter);

db._.mixin(lodashId);

export { db };
