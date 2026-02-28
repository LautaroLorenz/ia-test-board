import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CreateTaskInput, Task } from '../../core/models/task.model';
import { BoardStore } from '../../core/state/board.store';
import { TaskCardComponent } from './task-card.component';

@Component({
  selector: 'app-tasks-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AsyncPipe,
    TaskCardComponent,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule
  ],
  templateUrl: './tasks-board.component.html',
  styleUrl: './tasks-board.component.scss'
})
export class TasksBoardComponent implements OnInit, OnDestroy {
  private readonly boardStore = inject(BoardStore);

  readonly tasks$ = this.boardStore.tasks$;
  readonly runGroupId$ = this.boardStore.activeRunGroupId$;
  readonly waitingTasks$ = this.tasks$.pipe(map(tasks => tasks.filter(task => task.status === 'waiting')));
  readonly executingTasks$ = this.tasks$.pipe(map(tasks => tasks.filter(task => task.status === 'executing')));
  readonly finishedTasks$ = this.tasks$.pipe(map(tasks => tasks.filter(task => task.status === 'finished')));

  form: CreateTaskInput = {
    title: '',
    description: '',
    inputVariablesJson: '{}',
    reproSteps: '',
    expectedResult: ''
  };
  isNewTaskDialogVisible = false;

  ngOnInit(): void {
    this.boardStore.initialize();
    void this.boardStore.loadTasks();
  }

  ngOnDestroy(): void {
    this.boardStore.destroy();
  }

  async createTask(): Promise<void> {
    if (!this.form.title.trim()) {
      return;
    }
    await this.boardStore.createTask({
      ...this.form,
      title: this.form.title.trim()
    });
    this.form = {
      title: '',
      description: '',
      inputVariablesJson: '{}',
      reproSteps: '',
      expectedResult: ''
    };
    this.isNewTaskDialogVisible = false;
  }

  openNewTaskDialog(): void {
    this.isNewTaskDialogVisible = true;
  }

  async changeStatus(payload: { taskId: number; status: 'waiting' | 'executing' | 'finished' }): Promise<void> {
    await this.boardStore.updateStatus(payload.taskId, payload.status);
  }

  async assignAgent(payload: { taskId: number; agentName: string | null }): Promise<void> {
    await this.boardStore.assignAgent(payload.taskId, payload.agentName);
  }

  async recordOk(task: Task): Promise<void> {
    await this.boardStore.recordRun(task, 'ok', null);
  }

  async recordFail(payload: { task: Task; cause: string | null }): Promise<void> {
    await this.boardStore.recordRun(payload.task, 'fail', payload.cause);
  }

  async startRunGroup(): Promise<void> {
    const triggeredBy = window.prompt('Nombre del agente que inicia la corrida', 'manual') || 'manual';
    await this.boardStore.startRunGroup(triggeredBy);
  }

  async finishRunGroup(): Promise<void> {
    await this.boardStore.finishRunGroup();
  }
}
