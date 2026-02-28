import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../core/models/task.model';
import { TaskResult } from '../../core/models/task-result.enum';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="task-card">
      <h3>{{ task.title }}</h3>
      <p><strong>ID:</strong> {{ task.id }}</p>
      <p><strong>Descripcion:</strong> {{ task.description || '-' }}</p>
      <p><strong>Variables:</strong> <code>{{ task.inputVariablesJson }}</code></p>
      <p><strong>Como reproducir:</strong> {{ task.reproSteps }}</p>
      <p><strong>Resultado esperado:</strong> {{ task.expectedResult }}</p>
      <p><strong>Agente:</strong> {{ task.assignedAgent || 'Sin asignar' }}</p>
      <p>
        <strong>Ultima ejecucion:</strong>
        @if (task.latestResult === taskResult.OK) {
          <span>OK</span>
        } @else if (task.latestResult === taskResult.FAIL) {
          <span>Falla: {{ task.latestFailureCause || 'sin causa' }}</span>
        } @else if (task.latestResult === taskResult.SKIP) {
          <span>Skip</span>
        } @else {
          <span>Sin ejecuciones</span>
        }
      </p>

      @if (task.status === 'waiting' || task.status === 'executing') {
        <div class="bottom-actions">
          @if (task.status === 'waiting') {
            <button type="button" (click)="executeRequested.emit(task)">Ejecutar</button>
            <button type="button" (click)="editRequested.emit(task)">Editar</button>
            <button type="button" class="danger" (click)="deleteRequested.emit(task)">Eliminar</button>
          }

          @if (task.status === 'executing') {
            <button type="button" (click)="recordOk.emit(task)">Registrar OK</button>
            <button type="button" (click)="recordFailRequested.emit(task)">Registrar Falla</button>
            <button type="button" class="warning" (click)="skipRequested.emit(task)">Skip</button>
          }
        </div>
      }

      @if (task.status === 'finished') {
        <div class="bottom-actions">
          <button type="button" (click)="resetRequested.emit(task)">Reset</button>
        </div>
      }
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

    .bottom-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
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

    button.warning {
      background: #f59e0b;
      border-color: #f59e0b;
      color: #111827;
    }

    button.danger {
      background: #dc2626;
      border-color: #dc2626;
      color: #ffffff;
    }
  `]
})
export class TaskCardComponent {
  readonly taskResult = TaskResult;
  @Input({ required: true }) task!: Task;

  @Output() executeRequested = new EventEmitter<Task>();
  @Output() editRequested = new EventEmitter<Task>();
  @Output() deleteRequested = new EventEmitter<Task>();
  @Output() recordOk = new EventEmitter<Task>();
  @Output() recordFailRequested = new EventEmitter<Task>();
  @Output() skipRequested = new EventEmitter<Task>();
  @Output() resetRequested = new EventEmitter<Task>();
}
