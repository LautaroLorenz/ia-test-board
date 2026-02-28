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
  isExecuteDialogVisible = false;
  isFailDialogVisible = false;
  selectedTask: Task | null = null;
  executeAgentName = '';
  failCause = '';

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

  openExecuteDialog(task: Task): void {
    this.selectedTask = task;
    this.executeAgentName = task.assignedAgent || '';
    this.isExecuteDialogVisible = true;
  }

  async confirmExecuteTask(): Promise<void> {
    if (!this.selectedTask || !this.executeAgentName.trim()) {
      return;
    }

    await this.boardStore.assignAgent(this.selectedTask.id, this.executeAgentName.trim());
    await this.boardStore.updateStatus(this.selectedTask.id, 'executing');
    this.isExecuteDialogVisible = false;
    this.selectedTask = null;
    this.executeAgentName = '';
  }

  async registerOk(task: Task): Promise<void> {
    await this.boardStore.recordRun(task, 'ok', null);
    await this.boardStore.updateStatus(task.id, 'finished');
  }

  openFailDialog(task: Task): void {
    this.selectedTask = task;
    this.failCause = task.latestFailureCause || '';
    this.isFailDialogVisible = true;
  }

  async confirmFailTask(): Promise<void> {
    if (!this.selectedTask || !this.failCause.trim()) {
      return;
    }

    await this.boardStore.recordRun(this.selectedTask, 'fail', this.failCause.trim());
    await this.boardStore.updateStatus(this.selectedTask.id, 'finished');
    this.isFailDialogVisible = false;
    this.selectedTask = null;
    this.failCause = '';
  }

}
