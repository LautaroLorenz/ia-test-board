import { ipcMain } from 'electron';
import { getDb } from '../db/connection';
import { emitRunsUpdated, emitStatusUpdated, emitTasksUpdated } from './events';

type RunResult = 'ok' | 'fail';

export function registerStatusIpc(): void {
  ipcMain.handle('runs:start-group', async (_, payload: { triggeredBy: string }) => {
    const db = getDb();
    const [id] = await db('run_groups').insert({
      started_at: db.fn.now(),
      finished_at: null,
      triggered_by: payload.triggeredBy || 'manual',
      created_at: db.fn.now()
    });

    emitRunsUpdated();
    emitStatusUpdated();
    return id;
  });

  ipcMain.handle('runs:finish-group', async (_, payload: { runGroupId: number }) => {
    const db = getDb();
    await db('run_groups')
      .where({ id: payload.runGroupId })
      .update({ finished_at: db.fn.now() });

    emitRunsUpdated();
    emitStatusUpdated();
    return true;
  });

  ipcMain.handle('runs:record', async (_, payload: {
    taskId: number;
    runGroupId: number | null;
    result: RunResult;
    failureCause: string | null;
    agentName: string | null;
    inputSnapshotJson: string;
    expectedSnapshot: string;
  }) => {
    const db = getDb();
    await db('task_runs').insert({
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

    emitRunsUpdated();
    emitTasksUpdated();
    emitStatusUpdated();
    return true;
  });

  ipcMain.handle('status:get-latest-summary', async () => {
    const db = getDb();
    const latestRunGroup = await db('run_groups')
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

    const [okRow] = await db('task_runs')
      .where({ run_group_id: latestRunGroup.id, result: 'ok' })
      .count<{ count: number }[]>('* as count');

    const [failRow] = await db('task_runs')
      .where({ run_group_id: latestRunGroup.id, result: 'fail' })
      .count<{ count: number }[]>('* as count');

    const topCauses = await db('task_runs')
      .where({ run_group_id: latestRunGroup.id, result: 'fail' })
      .whereNotNull('failure_cause')
      .groupBy('failure_cause')
      .select('failure_cause as cause')
      .count<{ cause: string; count: number }[]>('* as count')
      .orderBy('count', 'desc')
      .limit(5);

    return {
      runGroupId: latestRunGroup.id,
      okCount: Number(okRow?.count ?? 0),
      failCount: Number(failRow?.count ?? 0),
      topFailureCauses: topCauses.map(item => ({
        cause: item.cause,
        count: Number(item.count)
      }))
    };
  });
}
