import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from '../models/task.model';
import { TaskResult } from '../models/task-result.enum';
import { IpcClientService } from '../services/ipc-client.service';

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  private readonly ipc = inject(IpcClientService);
  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);

  readonly tasks$ = this.tasksSubject.asObservable();

  private unsubscribers: Array<() => void> = [];

  initialize(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [this.ipc.onTasksUpdated(() => void this.loadTasks())];
  }

  destroy(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
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

  async updateTask(input: UpdateTaskInput): Promise<void> {
    await this.ipc.updateTask(input);
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

  async deleteTask(taskId: number): Promise<void> {
    await this.ipc.deleteTask(taskId);
    await this.loadTasks();
  }

  async recordRun(
    task: Task,
    result: TaskResult,
    failureCause: string | null,
  ): Promise<void> {
    await this.ipc.recordRun({
      taskId: task.id,
      result,
      failureCause,
      agentName: task.assignedAgent,
      inputSnapshotJson: task.inputVariablesJson,
      expectedSnapshot: task.expectedResult,
    });
    await this.loadTasks();
  }
}
