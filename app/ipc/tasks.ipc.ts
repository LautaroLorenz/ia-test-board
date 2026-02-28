import { ipcMain } from 'electron';
import { getDb } from '../db/connection';
import { emitTasksUpdated } from './events';

type TaskStatus = 'waiting' | 'executing' | 'finished';

type TaskCreateInput = {
  title: string;
  description: string;
  inputVariablesJson: string;
  reproSteps: string;
  expectedResult: string;
};

type TaskRow = {
  id: number;
  title: string;
  description: string;
  input_variables_json: string;
  repro_steps: string;
  expected_result: string;
  status: string;
  assigned_agent: string | null;
  created_at: string;
  updated_at: string;
  latest_result?: 'ok' | 'fail' | null;
  latest_failure_cause?: string | null;
};

export function registerTasksIpc(): void {
  const normalizeStatus = (status: string): TaskStatus => {
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

  ipcMain.handle('tasks:list', async () => {
    const db = getDb();

    const rows = await db('tasks')
      .select(
        'id',
        'title',
        'description',
        'input_variables_json',
        'repro_steps',
        'expected_result',
        'status',
        'assigned_agent',
        'created_at',
        'updated_at'
      )
      .orderBy('created_at', 'asc');

    const latestRuns = await db('task_runs as tr')
      .select('tr.task_id', 'tr.result as latest_result', 'tr.failure_cause as latest_failure_cause')
      .whereIn('tr.id', function () {
        this.select(db.raw('max(tr2.id)'))
          .from('task_runs as tr2')
          .groupBy('tr2.task_id');
      });

    const latestByTaskId = new Map<number, { latest_result: 'ok' | 'fail'; latest_failure_cause: string | null }>();
    latestRuns.forEach((row: { task_id: number; latest_result: 'ok' | 'fail'; latest_failure_cause: string | null }) => {
      latestByTaskId.set(row.task_id, {
        latest_result: row.latest_result,
        latest_failure_cause: row.latest_failure_cause
      });
    });

    return rows.map((row: TaskRow) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      inputVariablesJson: row.input_variables_json,
      reproSteps: row.repro_steps,
      expectedResult: row.expected_result,
      status: normalizeStatus(row.status),
      assignedAgent: row.assigned_agent,
      latestResult: latestByTaskId.get(row.id)?.latest_result ?? null,
      latestFailureCause: latestByTaskId.get(row.id)?.latest_failure_cause ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  });

  ipcMain.handle('tasks:create', async (_, payload: TaskCreateInput) => {
    const db = getDb();
    const [id] = await db('tasks').insert({
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

    emitTasksUpdated();
    return id;
  });

  ipcMain.handle('tasks:update-status', async (_, payload: { taskId: number; status: TaskStatus }) => {
    const db = getDb();
    await db('tasks')
      .where({ id: payload.taskId })
      .update({
        status: payload.status,
        updated_at: db.fn.now()
      });

    emitTasksUpdated();
    return true;
  });

  ipcMain.handle('tasks:assign-agent', async (_, payload: { taskId: number; agentName: string | null }) => {
    const db = getDb();
    await db('tasks')
      .where({ id: payload.taskId })
      .update({
        assigned_agent: payload.agentName,
        updated_at: db.fn.now()
      });

    emitTasksUpdated();
    return true;
  });
}
