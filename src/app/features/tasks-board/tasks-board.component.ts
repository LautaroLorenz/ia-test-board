import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, map } from 'rxjs';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Agent } from '../../core/models/agent.model';
import { CreateTaskInput, Task } from '../../core/models/task.model';
import { TaskResult } from '../../core/models/task-result.enum';
import { AgentsStore } from '../../core/state/agents.store';
import { BoardStore } from '../../core/state/board.store';
import { TaskCardComponent } from './task-card.component';

type AgentSuggestion = {
  label: string;
  name: string;
  isCreate: boolean;
};

@Component({
  selector: 'app-tasks-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AsyncPipe,
    TaskCardComponent,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    AutoCompleteModule,
    InputTextModule,
    TextareaModule
  ],
  providers: [ConfirmationService],
  templateUrl: './tasks-board.component.html',
  styleUrl: './tasks-board.component.scss'
})
export class TasksBoardComponent implements OnInit, OnDestroy {
  private readonly boardStore = inject(BoardStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly confirmationService = inject(ConfirmationService);

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
  isEditTaskDialogVisible = false;
  isExecuteDialogVisible = false;
  isFailDialogVisible = false;
  selectedTask: Task | null = null;
  editForm: CreateTaskInput = {
    title: '',
    description: '',
    inputVariablesJson: '{}',
    reproSteps: '',
    expectedResult: ''
  };
  agents: Agent[] = [];
  executeAgentInput: AgentSuggestion | string | null = null;
  executeAgentSuggestions: AgentSuggestion[] = [];
  failCause = '';
  private agentsSubscription?: Subscription;

  ngOnInit(): void {
    this.boardStore.initialize();
    this.agentsStore.initialize();
    this.agentsSubscription = this.agentsStore.agents$.subscribe((agents) => {
      this.agents = agents;
    });
    void this.boardStore.loadTasks();
    void this.loadAgents();
  }

  ngOnDestroy(): void {
    this.boardStore.destroy();
    this.agentsStore.destroy();
    this.agentsSubscription?.unsubscribe();
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

  openEditTaskDialog(task: Task): void {
    if (task.status !== 'waiting') {
      return;
    }

    this.selectedTask = task;
    this.editForm = {
      title: task.title,
      description: task.description,
      inputVariablesJson: task.inputVariablesJson,
      reproSteps: task.reproSteps,
      expectedResult: task.expectedResult
    };
    this.isEditTaskDialogVisible = true;
  }

  async saveTaskChanges(): Promise<void> {
    if (!this.selectedTask || this.selectedTask.status !== 'waiting') {
      return;
    }

    if (!this.editForm.title.trim()) {
      return;
    }

    await this.boardStore.updateTask({
      taskId: this.selectedTask.id,
      title: this.editForm.title.trim(),
      description: this.editForm.description,
      inputVariablesJson: this.editForm.inputVariablesJson,
      reproSteps: this.editForm.reproSteps,
      expectedResult: this.editForm.expectedResult
    });

    this.isEditTaskDialogVisible = false;
    this.selectedTask = null;
  }

  openExecuteDialog(task: Task): void {
    this.selectedTask = task;
    this.executeAgentInput = task.assignedAgent
      ? { label: task.assignedAgent, name: task.assignedAgent, isCreate: false }
      : null;
    this.executeAgentSuggestions = this.buildAgentSuggestions('');
    this.isExecuteDialogVisible = true;
  }

  async confirmExecuteTask(): Promise<void> {
    if (!this.selectedTask) {
      return;
    }

    const agentName = await this.resolveExecuteAgentName();
    if (!agentName) {
      return;
    }

    await this.boardStore.assignAgent(this.selectedTask.id, agentName);
    await this.boardStore.updateStatus(this.selectedTask.id, 'executing');
    this.isExecuteDialogVisible = false;
    this.selectedTask = null;
    this.executeAgentInput = null;
  }

  async registerOk(task: Task): Promise<void> {
    await this.boardStore.recordRun(task, TaskResult.OK, null);
    await this.boardStore.updateStatus(task.id, 'finished');
  }

  async deleteWaitingTask(task: Task): Promise<void> {
    const confirmed = await this.confirmAction(`Eliminar la task "${task.title}"?`);
    if (!confirmed) {
      return;
    }
    await this.boardStore.deleteTask(task.id);
  }

  async skipExecutingTask(task: Task): Promise<void> {
    const confirmed = await this.confirmAction(`Hacer skip de la task "${task.title}"?`);
    if (!confirmed) {
      return;
    }
    await this.boardStore.recordRun(task, TaskResult.SKIP, null);
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

    await this.boardStore.recordRun(
      this.selectedTask,
      TaskResult.FAIL,
      this.failCause.trim(),
    );
    await this.boardStore.updateStatus(this.selectedTask.id, 'finished');
    this.isFailDialogVisible = false;
    this.selectedTask = null;
    this.failCause = '';
  }

  async resetTask(task: Task): Promise<void> {
    await this.boardStore.assignAgent(task.id, null);
    await this.boardStore.updateStatus(task.id, 'waiting');
  }

  filterAgentSuggestions(query: string): void {
    this.executeAgentSuggestions = this.buildAgentSuggestions(query);
  }

  async onExecuteAgentSelected(selected: AgentSuggestion | string): Promise<void> {
    if (typeof selected === 'string') {
      return;
    }

    if (!selected.isCreate) {
      this.executeAgentInput = selected;
      return;
    }

    const createdName = await this.ensureAgentExists(selected.name);
    this.executeAgentInput = { label: createdName, name: createdName, isCreate: false };
    this.executeAgentSuggestions = this.buildAgentSuggestions(createdName);
  }

  private async loadAgents(): Promise<void> {
    await this.agentsStore.loadAgents();
  }

  private buildAgentSuggestions(rawQuery: string): AgentSuggestion[] {
    const query = rawQuery.trim().toLowerCase();
    const suggestions = this.agents
      .filter((agent) => !query || agent.name.toLowerCase().includes(query))
      .map((agent) => ({ label: agent.name, name: agent.name, isCreate: false }));

    const exactMatch = this.agents.some((agent) => agent.name.toLowerCase() === query);
    if (query && !exactMatch) {
      suggestions.push({
        label: `Crear "${rawQuery.trim()}"`,
        name: rawQuery.trim(),
        isCreate: true,
      });
    }

    return suggestions;
  }

  private async resolveExecuteAgentName(): Promise<string | null> {
    if (!this.executeAgentInput) {
      return null;
    }

    if (typeof this.executeAgentInput === 'string') {
      const typedName = this.executeAgentInput.trim();
      if (!typedName) {
        return null;
      }
      return this.ensureAgentExists(typedName);
    }

    if (this.executeAgentInput.isCreate) {
      return this.ensureAgentExists(this.executeAgentInput.name);
    }

    return this.executeAgentInput.name;
  }

  private async ensureAgentExists(name: string): Promise<string> {
    const normalizedName = name.trim();
    const existing = this.agents.find(
      (agent) => agent.name.toLowerCase() === normalizedName.toLowerCase(),
    );
    if (existing) {
      return existing.name;
    }

    await this.agentsStore.createAgent({ name: normalizedName });
    await this.loadAgents();
    return normalizedName;
  }

  private confirmAction(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      const finish = (value: boolean): void => {
        if (resolved) {
          return;
        }
        resolved = true;
        resolve(value);
      };

      this.confirmationService.confirm({
        header: 'Confirmar accion',
        message,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Aceptar',
        rejectLabel: 'Cancelar',
        closeOnEscape: true,
        dismissableMask: true,
        accept: () => finish(true),
        reject: () => finish(false),
      });
    });
  }

}
