"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMainWindow = setMainWindow;
exports.emitTasksUpdated = emitTasksUpdated;
exports.emitRunsUpdated = emitRunsUpdated;
exports.emitStatusUpdated = emitStatusUpdated;
let mainWindow = null;
function setMainWindow(window) {
    mainWindow = window;
}
function emitTasksUpdated() {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('tasks:updated');
}
function emitRunsUpdated() {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('runs:updated');
}
function emitStatusUpdated() {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('status:updated');
}
//# sourceMappingURL=events.js.map