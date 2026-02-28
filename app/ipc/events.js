"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMainWindow = setMainWindow;
exports.emitTasksUpdated = emitTasksUpdated;
exports.emitAgentsUpdated = emitAgentsUpdated;
let mainWindow = null;
function setMainWindow(window) {
    mainWindow = window;
}
function emitTasksUpdated() {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('tasks:updated');
}
function emitAgentsUpdated() {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('agents:updated');
}
//# sourceMappingURL=events.js.map