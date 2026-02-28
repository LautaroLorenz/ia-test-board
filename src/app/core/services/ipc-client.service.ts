import { Injectable, inject } from '@angular/core';
import { ElectronService } from './electron/electron.service';
import { CreateTaskInput, Task, TaskStatus } from '../models/task.model';
import { LatestRunSummary } from '../models/status.model';

@Injectable({
  providedIn: 'root'
})
export class IpcClientService {
  private readonly electron = inject(ElectronService);

  async listTasks(): Promise<Task[]> {
    return this.invoke<Task[]>('tasks:list', []);
  }

  async createTask(payload: CreateTaskInput): Promise<number> {
    return this.invoke<number>('tasks:create', [payload]);
  }

  async updateTaskStatus(taskId: number, status: TaskStatus): Promise<void> {
    await this.invoke('tasks:update-status', [{ taskId, status }]);
  }

  async assignAgent(taskId: number, agentName: string | null): Promise<void> {
    await this.invoke('tasks:assign-agent', [{ taskId, agentName }]);
  }

  async startRunGroup(triggeredBy: string): Promise<number> {
    return this.invoke<number>('runs:start-group', [{ triggeredBy }]);
  }

  async finishRunGroup(runGroupId: number): Promise<void> {
    await this.invoke('runs:finish-group', [{ runGroupId }]);
  }

  async recordRun(payload: {
    taskId: number;
    runGroupId: number | null;
    result: 'ok' | 'fail';
    failureCause: string | null;
    agentName: string | null;
    inputSnapshotJson: string;
    expectedSnapshot: string;
  }): Promise<void> {
    await this.invoke('runs:record', [payload]);
  }

  async getLatestSummary(): Promise<LatestRunSummary> {
    return this.invoke<LatestRunSummary>('status:get-latest-summary', []);
  }

  onTasksUpdated(callback: () => void): () => void {
    return this.listen('tasks:updated', callback);
  }

  onRunsUpdated(callback: () => void): () => void {
    return this.listen('runs:updated', callback);
  }

  onStatusUpdated(callback: () => void): () => void {
    return this.listen('status:updated', callback);
  }

  private async invoke<T>(channel: string, args: unknown[]): Promise<T> {
    if (!this.electron.isElectron) {
      throw new Error(`IPC channel "${channel}" is only available in Electron mode.`);
    }
    return this.electron.ipcRenderer.invoke(channel, ...args) as Promise<T>;
  }

  private listen(channel: string, callback: () => void): () => void {
    if (!this.electron.isElectron) {
      return () => undefined;
    }

    const listener = () => callback();
    this.electron.ipcRenderer.on(channel, listener);
    return () => this.electron.ipcRenderer.removeListener(channel, listener);
  }
}
