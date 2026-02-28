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
exports.registerRunsIpc = registerRunsIpc;
const electron_1 = require("electron");
const connection_1 = require("../db/connection");
const events_1 = require("./events");
function registerRunsIpc() {
    electron_1.ipcMain.handle('runs:record', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        yield db('task_runs').insert({
            task_id: payload.taskId,
            result: payload.result,
            failure_cause: payload.failureCause,
            agent_name: payload.agentName,
            input_snapshot_json: payload.inputSnapshotJson,
            expected_snapshot: payload.expectedSnapshot,
            started_at: db.fn.now(),
            finished_at: db.fn.now(),
            created_at: db.fn.now()
        });
        (0, events_1.emitTasksUpdated)();
        return true;
    }));
}
//# sourceMappingURL=runs.ipc.js.map