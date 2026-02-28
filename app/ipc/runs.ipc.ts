import { ipcMain } from 'electron';
import { getDb } from '../db/connection';
import { emitTasksUpdated } from './events';
import { TaskResult } from '../models/task-result.enum';

export function registerRunsIpc(): void {
  ipcMain.handle(
    'runs:record',
    async (
      _,
      payload: {
        taskId: number;
        result: TaskResult;
        failureCause: string | null;
        agentName: string | null;
        inputSnapshotJson: string;
        expectedSnapshot: string;
      },
    ) => {
      const db = getDb();
      await db('task_runs').insert({
        task_id: payload.taskId,
        result: payload.result,
        failure_cause: payload.failureCause,
        agent_name: payload.agentName,
        input_snapshot_json: payload.inputSnapshotJson,
        expected_snapshot: payload.expectedSnapshot,
        started_at: db.fn.now(),
        finished_at: db.fn.now(),
        created_at: db.fn.now(),
      });

      emitTasksUpdated();
      return true;
    },
  );
}
