import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { initDatabase } from './db/connection';
import { registerTasksIpc } from './ipc/tasks.ipc';
import { registerStatusIpc } from './ipc/status.ipc';
import { setMainWindow } from './ipc/events';

let win: BrowserWindow | null = null;
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function createWindow(): BrowserWindow {
  if (win) {
    return win;
  }

  const size = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      contextIsolation: false,
      webSecurity: !serve
    }
  });

  if (serve) {
    import('electron-debug').then(debug => {
      debug.default({ isEnabled: true, showDevTools: true });
    });

    import('electron-reloader').then(reloader => {
      const reloaderFn = (reloader as any).default || reloader;
      reloaderFn(module, { watchRenderer: false });
    });

    win.loadURL('http://localhost:4200');
  } else {
    let pathIndex = './browser/index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/browser/index.html'))) {
      pathIndex = '../dist/browser/index.html';
    }

    const fullPath = path.join(__dirname, pathIndex);
    const url = `file://${path.resolve(fullPath).replace(/\\/g, '/')}`;
    win.loadURL(url);
  }

  win.on('closed', () => {
    setMainWindow(null);
    win = null;
  });

  setMainWindow(win);
  return win;
}

try {
  app.on('second-instance', () => {
    if (!win) {
      return;
    }

    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  });

  ipcMain.handle('app:get-version', () => app.getVersion());
  registerTasksIpc();
  registerStatusIpc();

  app.on('ready', async () => {
    await initDatabase();
    setTimeout(createWindow, 400);
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('activate', () => {
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // throw e;
}
