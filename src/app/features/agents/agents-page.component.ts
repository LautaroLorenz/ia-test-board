import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Agent } from '../../core/models/agent.model';
import { AgentsStore } from '../../core/state/agents.store';

@Component({
  selector: 'app-agents-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AsyncPipe,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './agents-page.component.html',
  styleUrl: './agents-page.component.scss',
})
export class AgentsPageComponent implements OnInit, OnDestroy {
  private readonly agentsStore = inject(AgentsStore);

  readonly agents$ = this.agentsStore.agents$;

  isDialogVisible = false;
  editingAgent: Agent | null = null;
  formName = '';

  ngOnInit(): void {
    this.agentsStore.initialize();
    void this.agentsStore.loadAgents();
  }

  ngOnDestroy(): void {
    this.agentsStore.destroy();
  }

  openCreateDialog(): void {
    this.editingAgent = null;
    this.formName = '';
    this.isDialogVisible = true;
  }

  openEditDialog(agent: Agent): void {
    this.editingAgent = agent;
    this.formName = agent.name;
    this.isDialogVisible = true;
  }

  async saveAgent(): Promise<void> {
    const name = this.formName.trim();
    if (!name) {
      return;
    }

    if (this.editingAgent) {
      await this.agentsStore.updateAgent(this.editingAgent.id, name);
    } else {
      await this.agentsStore.createAgent({ name });
    }

    this.isDialogVisible = false;
    this.editingAgent = null;
    this.formName = '';
  }

  async deleteAgent(agent: Agent): Promise<void> {
    const confirmed = window.confirm(`Eliminar el agente "${agent.name}"?`);
    if (!confirmed) {
      return;
    }

    await this.agentsStore.deleteAgent(agent.id);
  }
}
