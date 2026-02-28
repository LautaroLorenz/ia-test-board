import { BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window;
}

export function emitTasksUpdated(): void {
  mainWindow?.webContents.send('tasks:updated');
}
