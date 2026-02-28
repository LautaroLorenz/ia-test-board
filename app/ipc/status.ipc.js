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
exports.registerStatusIpc = registerStatusIpc;
const electron_1 = require("electron");
const connection_1 = require("../db/connection");
const events_1 = require("./events");
function registerStatusIpc() {
    electron_1.ipcMain.handle('runs:start-group', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        const [id] = yield db('run_groups').insert({
            started_at: db.fn.now(),
            finished_at: null,
            triggered_by: payload.triggeredBy || 'manual',
            created_at: db.fn.now()
        });
        (0, events_1.emitRunsUpdated)();
        (0, events_1.emitStatusUpdated)();
        return id;
    }));
    electron_1.ipcMain.handle('runs:finish-group', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        yield db('run_groups')
            .where({ id: payload.runGroupId })
            .update({ finished_at: db.fn.now() });
        (0, events_1.emitRunsUpdated)();
        (0, events_1.emitStatusUpdated)();
        return true;
    }));
    electron_1.ipcMain.handle('runs:record', (_, payload) => __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getDb)();
        yield db('task_runs').insert({
            task_id: payload.taskId,
            run_group_id: payload.runGroupId,
            result: payload.result,
            failure_cause: payload.failureCause,
            agent_name: payload.agentName,
            input_snapshot_json: payload.inputSnapshotJson,
            expected_snapshot: payload.expectedSnapshot,
            started_at: db.fn.now(),
            finished_at: db.fn.now(),
            created_at: db.fn.now()
        });
        (0, events_1.emitRunsUpdated)();
        (0, events_1.emitTasksUpdated)();
        (0, events_1.emitStatusUpdated)();
        return true;
    }));
    electron_1.ipcMain.handle('status:get-latest-summary', () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const db = (0, connection_1.getDb)();
        const latestRunGroup = yield db('run_groups')
            .whereNotNull('finished_at')
            .orderBy('finished_at', 'desc')
            .first();
        if (!latestRunGroup) {
            return {
                runGroupId: null,
                okCount: 0,
                failCount: 0,
                topFailureCauses: []
            };
        }
        const [okRow] = yield db('task_runs')
            .where({ run_group_id: latestRunGroup.id, result: 'ok' })
            .count('* as count');
        const [failRow] = yield db('task_runs')
            .where({ run_group_id: latestRunGroup.id, result: 'fail' })
            .count('* as count');
        const topCauses = yield db('task_runs')
            .where({ run_group_id: latestRunGroup.id, result: 'fail' })
            .whereNotNull('failure_cause')
            .groupBy('failure_cause')
            .select('failure_cause as cause')
            .count('* as count')
            .orderBy('count', 'desc')
            .limit(5);
        return {
            runGroupId: latestRunGroup.id,
            okCount: Number((_a = okRow === null || okRow === void 0 ? void 0 : okRow.count) !== null && _a !== void 0 ? _a : 0),
            failCount: Number((_b = failRow === null || failRow === void 0 ? void 0 : failRow.count) !== null && _b !== void 0 ? _b : 0),
            topFailureCauses: topCauses.map(item => ({
                cause: item.cause,
                count: Number(item.count)
            }))
        };
    }));
}
//# sourceMappingURL=status.ipc.js.map