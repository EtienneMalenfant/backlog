'use strict';
/* global __static */

import {app, BrowserWindow, Menu, protocol, ipcMain, dialog} from 'electron';
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib';
import windowRepository from './windowRepository';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'


import path from 'path';
import electronContextMenu from 'electron-context-menu';
electronContextMenu();

const isDevelopment = process.env.NODE_ENV !== 'production';

const windowSettings = windowRepository(path.join(app.getPath('userData'), 'window.json'));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let userDataPath;

// Standard scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: {secure: true}}]);


function createWindow(userDataPath) {
  windowSettings.updateWindowState({minWidth: 600});
  const windowConfig = windowSettings.getWindowState();
  windowConfig.icon = path.join(__static, 'icon.png');
  windowConfig.frame = false;
  windowConfig.webPreferences = {
    nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
    contextIsolation: false
  };

  // Create the browser window.
  win = new BrowserWindow(windowConfig);
  win.userDataPath = userDataPath;

  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(createMenuOnMac());
  } else {
    win.removeMenu();
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }

  win.on('closed', () => {
    win = null;
  });

  win.on('ready-to-show', () => {
    win.show();
    win.focus();
  });

  win.on('resize', () => windowSettings.updateWindowState(win.getBounds()));
  win.on('move', () => windowSettings.updateWindowState(win.getBounds()));
  win.on('close', () => windowSettings.updateWindowState(win.getBounds()));
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow(userDataPath);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async() => {
  userDataPath = path.join(app.getPath('userData'), 'backlog.json');
  process.env.BACKLOG_APP_VERSION = app.getVersion();

  // Register IPC handlers before createWindow so they are available when the renderer starts.
  ipcMain.on('app:getUserDataPath', (event) => {
    event.returnValue = userDataPath;
  });

  ipcMain.on('app:quit', () => {
    app.quit();
  });

  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.minimize();
    }
  });

  ipcMain.handle('dialog:showSave', async(event, options) => {
    const result = await dialog.showSaveDialog(options);
    return result;
  });

  ipcMain.handle('dialog:showOpen', async(event, options) => {
    const result = await dialog.showOpenDialog(options);
    return result;
  });

  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      //await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow(userDataPath);
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}


function createMenuOnMac() {
  return Menu.buildFromTemplate([
    {
      label: app.getName(),
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'pasteandmatchstyle'},
        {role: 'delete'},
        {role: 'selectall'},
        {role: 'quit'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
      ],
    },
  ]);
}
