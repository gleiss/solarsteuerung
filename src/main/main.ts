/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { SerialCommunicationKasten123, ModusValue, ControlValue, StatusValue, ControlValues, StatusValues, Temperatures } from './SerialCommunicationKasten123'

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

function onCurrentModus(modus: ModusValue) {
  mainWindow!.webContents.send("update-modus", modus);
};
function onCurrentTargetTemperature(targetTemperature: number): void {
  mainWindow!.webContents.send("update-target-temperature", targetTemperature);
}
function onCurrentControlValues(controlValues: ControlValues): void {
  mainWindow!.webContents.send("update-control-values", controlValues);
}
function onCurrentStatusValues(statusValues: StatusValues): void {
  mainWindow!.webContents.send("update-status-values", statusValues);
}
function onCurrentTemperatures(temperatures: Temperatures): void {
  mainWindow!.webContents.send("update-temperatures", temperatures);
}

const serialCommunicationKasten123 = new SerialCommunicationKasten123(
  onCurrentModus,
  onCurrentTargetTemperature,
  onCurrentControlValues,
  onCurrentStatusValues,
  onCurrentTemperatures
);

ipcMain.on('get-modus', (_event) => {
  // console.log("main: requesting modus");
  serialCommunicationKasten123.getModus();
});
ipcMain.on('get-target-temperature', (_event) => {
  // console.log("main: requesting target temperature");
  serialCommunicationKasten123.getTargetTemperature();
});
ipcMain.on('get-control-values', (_event) => {
  // console.log("main: requesting control values");
  serialCommunicationKasten123.getControlValues();
});
ipcMain.on('get-status-values', (_event) => {
  // console.log("main: requesting status values");
  serialCommunicationKasten123.getStatusValues();
});
ipcMain.on('get-temperatures', (_event) => {
  // console.log("main: requesting temperatures");
  serialCommunicationKasten123.getTemperatures();
});
ipcMain.on('set-modus', (_event, arg) => {
  serialCommunicationKasten123.setModus(arg);
});
ipcMain.on('set-target-temperature', (_event, arg) => {
  serialCommunicationKasten123.setTargetTemperature(arg);
});
ipcMain.on('set-first-klappe-mode', (_event, arg) => {
  serialCommunicationKasten123.setFirstklappe(arg);
});
ipcMain.on('set-heiz-klappe-mode', (_event, arg) => {
  serialCommunicationKasten123.setHeizklappe(arg);
});
ipcMain.on('set-kollektor-klappe-mode', (_event, arg) => {
  serialCommunicationKasten123.setKollektorklappe(arg);
});
ipcMain.on('set-speicher-klappe-mode', (_event, arg) => {
  serialCommunicationKasten123.setSpeicherklappe(arg);
});
ipcMain.on('set-wintergarten-fenster-mode', (_event, arg) => {
  console.log("main: set-wintergarten-fenster-mode: " + arg)
  serialCommunicationKasten123.setWintergartenfenster(arg);
});
ipcMain.on('set-ventilator-mode', (_event, arg) => {
  console.log("main: set-ventilator-mode: " + arg)
  serialCommunicationKasten123.setVentilator(arg);
});
ipcMain.on('set-pumpe-wasserkollektor-mode', (_event, arg) => {
  serialCommunicationKasten123.setPumpeWasserkollektor(arg);
});


if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1920,
    height: 1080,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // // Remove this if your app does not use auto updates
  // // eslint-disable-next-line
  // new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
