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
      <p><strong>Descripcion:</strong> {{ task.description }}</p>
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
          <option value="in_progress">En ejecucion</option>
          <option value="executing">Ejecutando</option>
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
    .task-card { border: 1px solid #d2d2d2; border-radius: 6px; padding: 12px; margin-bottom: 10px; background: #fff; }
    h3 { margin: 0 0 8px; font-size: 15px; }
    p { margin: 6px 0; font-size: 13px; }
    .actions, .run-actions { display: flex; gap: 8px; margin-top: 10px; }
    input, select { flex: 1; }
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
