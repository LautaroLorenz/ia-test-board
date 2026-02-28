"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAgentsIpc = registerAgentsIpc;
const electron_1 = require("electron");
const connection_1 = require("../db/connection");
const events_1 = require("./events");
function registerAgentsIpc() {
    electron_1.ipcMain.handle('agents:list', () => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        const rows = yield db('agents')
            .select('id', 'name', 'created_at')
            .orderBy('created_at', 'asc');
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
        }));
    }));
    electron_1.ipcMain.handle('agents:create', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        const name = payload.name.trim();
        if (!name) {
            throw new Error('Agent name is required');
        }
        const [id] = yield db('agents').insert({
            name,
            created_at: db.fn.now(),
            updated_at: db.fn.now(),
        });
        (0, events_1.emitAgentsUpdated)();
        return id;
    }));
    electron_1.ipcMain.handle('agents:update', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        const name = payload.name.trim();
        if (!name) {
            throw new Error('Agent name is required');
        }
        yield db('agents')
            .where({ id: payload.agentId })
            .update({
            name,
            updated_at: db.fn.now(),
        });
        (0, events_1.emitAgentsUpdated)();
        return true;
    }));
    electron_1.ipcMain.handle('agents:delete', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        yield db('agents').where({ id: payload.agentId }).del();
        (0, events_1.emitAgentsUpdated)();
        return true;
    }));
}
//# sourceMappingURL=agents.ipc.js.map