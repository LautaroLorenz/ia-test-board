import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TaskStatus } from '../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <article class="task-card">
      <h3>{{ task.title }}</h3>
      <p><strong>Descripcion:</strong> {{ task.description || '-' }}</p>
      <p><strong>Variables:</strong> <code>{{ task.inputVariablesJson }}</code></p>
      <p><strong>Como reproducir:</strong> {{ task.reproSteps }}</p>
      <p><strong>Resultado esperado:</strong> {{ task.expectedResult }}</p>
      <p><strong>Agente:</strong> {{ task.assignedAgent || 'Sin asignar' }}</p>
      <p>
        <strong>Ultima ejecucion:</strong>
        @if (task.latestResult === 'ok') {
          <span>OK</span>
        } @else if (task.latestResult === 'fail') {
          <span>Falla: {{ task.latestFailureCause || 'sin causa' }}</span>
        } @else {
          <span>Sin ejecuciones</span>
        }
      </p>

      <div class="actions">
        <select [ngModel]="task.status" (ngModelChange)="onStatusChange($event)">
          <option value="waiting">En espera</option>
          <option value="executing">Ejecutando</option>
          <option value="finished">Finalizado</option>
        </select>
        <input [(ngModel)]="agentName" placeholder="agente" />
        <button type="button" (click)="assignAgent.emit({ taskId: task.id, agentName: agentName || null })">
          Asignar
        </button>
      </div>

      <div class="run-actions">
        <button type="button" (click)="recordOk.emit(task)">Registrar OK</button>
        <button type="button" (click)="onRecordFail()">Registrar Falla</button>
      </div>
    </article>
  `,
  styles: [`
    .task-card {
      border: 1px solid var(--p-content-border-color, #d1d5db);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
      background: var(--p-content-background, #ffffff);
      color: var(--p-text-color, #111827);
    }

    h3 {
      margin: 0 0 8px;
      font-size: 15px;
      color: var(--p-text-color, #111827);
    }

    p {
      margin: 6px 0;
      font-size: 13px;
      line-height: 1.4;
      color: var(--p-text-color, #111827);
      overflow-wrap: anywhere;
    }

    strong {
      color: var(--p-text-color, #111827);
    }

    code {
      display: inline-block;
      max-width: 100%;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 12px;
      background: rgba(127, 127, 127, 0.2);
      color: inherit;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }

    .actions, .run-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    input, select {
      flex: 1;
      min-height: 32px;
      border: 1px solid var(--p-content-border-color, #d1d5db);
      border-radius: 6px;
      padding: 0 8px;
      background: var(--p-content-background, #ffffff);
      color: var(--p-text-color, #111827);
    }

    button {
      min-height: 32px;
      border: 1px solid var(--p-primary-color, #3b82f6);
      border-radius: 6px;
      background: var(--p-primary-color, #3b82f6);
      color: var(--p-primary-contrast-color, #ffffff);
      padding: 0 10px;
      cursor: pointer;
    }

    button:hover {
      filter: brightness(1.05);
    }
  `]
})
export class TaskCardComponent implements OnChanges {
  @Input({ required: true }) task!: Task;

  @Output() statusChange = new EventEmitter<{ taskId: number; status: TaskStatus }>();
  @Output() assignAgent = new EventEmitter<{ taskId: number; agentName: string | null }>();
  @Output() recordOk = new EventEmitter<Task>();
  @Output() recordFail = new EventEmitter<{ task: Task; cause: string | null }>();

  agentName = '';

  ngOnChanges(): void {
    this.agentName = this.task.assignedAgent || '';
  }

  onStatusChange(status: TaskStatus): void {
    this.statusChange.emit({ taskId: this.task.id, status });
  }

  onRecordFail(): void {
    const cause = window.prompt('Causa de fallo', this.task.latestFailureCause || '') || null;
    this.recordFail.emit({ task: this.task, cause });
  }
}
