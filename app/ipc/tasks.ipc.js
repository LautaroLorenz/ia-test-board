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
exports.registerTasksIpc = registerTasksIpc;
const electron_1 = require("electron");
const connection_1 = require("../db/connection");
const events_1 = require("./events");
function registerTasksIpc() {
    const normalizeStatus = (status) => {
        if (status === 'in_progress') {
            return 'executing';
        }
        if (status === 'finalizado' || status === 'finalized') {
            return 'finished';
        }
        if (status === 'finished' || status === 'executing' || status === 'waiting') {
            return status;
        }
        return 'waiting';
    };
    electron_1.ipcMain.handle('tasks:list', () => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        const rows = yield db('tasks')
            .select('id', 'title', 'description', 'input_variables_json', 'repro_steps', 'expected_result', 'status', 'assigned_agent', 'created_at', 'updated_at')
            .orderBy('created_at', 'asc');
        const latestRuns = yield db('task_runs as tr')
            .select('tr.task_id', 'tr.result as latest_result', 'tr.failure_cause as latest_failure_cause')
            .whereIn('tr.id', function () {
            this.select(db.raw('max(tr2.id)'))
                .from('task_runs as tr2')
                .groupBy('tr2.task_id');
        });
        const latestByTaskId = new Map();
        latestRuns.forEach((row) => {
            latestByTaskId.set(row.task_id, {
                latest_result: row.latest_result,
                latest_failure_cause: row.latest_failure_cause
            });
        });
        return rows.map((row) => {
            var _a, _b, _c, _d;
            return ({
                id: row.id,
                title: row.title,
                description: row.description,
                inputVariablesJson: row.input_variables_json,
                reproSteps: row.repro_steps,
                expectedResult: row.expected_result,
                status: normalizeStatus(row.status),
                assignedAgent: row.assigned_agent,
                latestResult: (_b = (_a = latestByTaskId.get(row.id)) === null || _a === void 0 ? void 0 : _a.latest_result) !== null && _b !== void 0 ? _b : null,
                latestFailureCause: (_d = (_c = latestByTaskId.get(row.id)) === null || _c === void 0 ? void 0 : _c.latest_failure_cause) !== null && _d !== void 0 ? _d : null,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            });
        });
    }));
    electron_1.ipcMain.handle('tasks:create', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        const [id] = yield db('tasks').insert({
            title: payload.title,
            description: payload.description,
            input_variables_json: payload.inputVariablesJson,
            repro_steps: payload.reproSteps,
            expected_result: payload.expectedResult,
            status: 'waiting',
            assigned_agent: null,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });
        (0, events_1.emitTasksUpdated)();
        return id;
    }));
    electron_1.ipcMain.handle('tasks:update-status', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        yield db('tasks')
            .where({ id: payload.taskId })
            .update({
            status: payload.status,
            updated_at: db.fn.now()
        });
        (0, events_1.emitTasksUpdated)();
        return true;
    }));
    electron_1.ipcMain.handle('tasks:assign-agent', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        yield db('tasks')
            .where({ id: payload.taskId })
            .update({
            assigned_agent: payload.agentName,
            updated_at: db.fn.now()
        });
        (0, events_1.emitTasksUpdated)();
        return true;
    }));
    electron_1.ipcMain.handle('tasks:delete', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        yield db('tasks').where({ id: payload.taskId }).del();
        (0, events_1.emitTasksUpdated)();
        return true;
    }));
}
//# sourceMappingURL=tasks.ipc.js.map