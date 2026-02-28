import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CreateTaskInput, Task, TaskStatus } from '../models/task.model';
import { IpcClientService } from '../services/ipc-client.service';

@Injectable({
  providedIn: 'root'
})
export class BoardStore {
  private readonly ipc = inject(IpcClientService);
  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  private readonly activeRunGroupIdSubject = new BehaviorSubject<number | null>(null);

  readonly tasks$ = this.tasksSubject.asObservable();
  readonly activeRunGroupId$ = this.activeRunGroupIdSubject.asObservable();

  private unsubscribers: Array<() => void> = [];

  initialize(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [
      this.ipc.onTasksUpdated(() => void this.loadTasks()),
      this.ipc.onRunsUpdated(() => void this.loadTasks())
    ];
  }

  destroy(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  async loadTasks(): Promise<void> {
    const tasks = await this.ipc.listTasks();
    this.tasksSubject.next(tasks);
  }

  async createTask(input: CreateTaskInput): Promise<void> {
    await this.ipc.createTask(input);
    await this.loadTasks();
  }

  async updateStatus(taskId: number, status: TaskStatus): Promise<void> {
    await this.ipc.updateTaskStatus(taskId, status);
    await this.loadTasks();
  }

  async assignAgent(taskId: number, agentName: string | null): Promise<void> {
    await this.ipc.assignAgent(taskId, agentName);
    await this.loadTasks();
  }

  async startRunGroup(triggeredBy: string): Promise<void> {
    const runGroupId = await this.ipc.startRunGroup(triggeredBy);
    this.activeRunGroupIdSubject.next(runGroupId);
  }

  async finishRunGroup(): Promise<void> {
    const runGroupId = this.activeRunGroupIdSubject.value;
    if (!runGroupId) {
      return;
    }
    await this.ipc.finishRunGroup(runGroupId);
    this.activeRunGroupIdSubject.next(null);
  }

  async recordRun(task: Task, result: 'ok' | 'fail', failureCause: string | null): Promise<void> {
    await this.ipc.recordRun({
      taskId: task.id,
      runGroupId: this.activeRunGroupIdSubject.value,
      result,
      failureCause,
      agentName: task.assignedAgent,
      inputSnapshotJson: task.inputVariablesJson,
      expectedSnapshot: task.expectedResult
    });
    await this.loadTasks();
  }
}
