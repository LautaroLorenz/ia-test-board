"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMainWindow = setMainWindow;
exports.emitTasksUpdated = emitTasksUpdated;
let mainWindow = null;
function setMainWindow(window) {
    mainWindow = window;
}
function emitTasksUpdated() {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('tasks:updated');
}
//# sourceMappingURL=events.js.map