import { ipcMain } from 'electron';
import { getDb } from '../db/connection';
import { emitAgentsUpdated } from './events';

type AgentRow = {
  id: number;
  name: string;
  created_at: string;
};

export function registerAgentsIpc(): void {
  ipcMain.handle('agents:list', async () => {
    const db = getDb();
    const rows = await db('agents')
      .select('id', 'name', 'created_at')
      .orderBy('created_at', 'asc');

    return rows.map((row: AgentRow) => ({
      id: row.id,
      name: row.name,
    }));
  });

  ipcMain.handle('agents:create', async (_, payload: { name: string }) => {
    const db = getDb();
    const name = payload.name.trim();
    if (!name) {
      throw new Error('Agent name is required');
    }

    const [id] = await db('agents').insert({
      name,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    emitAgentsUpdated();
    return id;
  });

  ipcMain.handle('agents:update', async (_, payload: { agentId: number; name: string }) => {
    const db = getDb();
    const name = payload.name.trim();
    if (!name) {
      throw new Error('Agent name is required');
    }

    await db('agents')
      .where({ id: payload.agentId })
      .update({
        name,
        updated_at: db.fn.now(),
      });

    emitAgentsUpdated();
    return true;
  });

  ipcMain.handle('agents:delete', async (_, payload: { agentId: number }) => {
    const db = getDb();
    await db('agents').where({ id: payload.agentId }).del();
    emitAgentsUpdated();
    return true;
  });
}
