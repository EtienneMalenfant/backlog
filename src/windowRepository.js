import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import fs from 'fs';

export default function windowRepository(userAppPath) {
  if (!fs.existsSync(userAppPath.split('window.json')[0])) {
    fs.mkdirSync(userAppPath.split('window.json')[0]);
  }
  const windowAdapter = new FileSync(userAppPath);
  const windowSettings = low(windowAdapter);
  windowSettings.defaults({
    windowState: {
      height: 800,
      useContentSize: true,
      width: 600,
      show: false,
      minWidth: 600,
      x: undefined,
      y: undefined
    }
  }).write();

  return {
    getWindowState () {
      return windowSettings.get('windowState')
        .cloneDeep()
        .value();
    },
    updateWindowState (updateProp) {
      return windowSettings.get('windowState')
        .assign(updateProp)
        .write();
    }
  };
}
