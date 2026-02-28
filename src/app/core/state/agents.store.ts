import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IpcClientService } from '../services/ipc-client.service';
import { Agent, CreateAgentInput } from '../models/agent.model';

@Injectable({
  providedIn: 'root',
})
export class AgentsStore {
  private readonly ipc = inject(IpcClientService);
  private readonly agentsSubject = new BehaviorSubject<Agent[]>([]);

  readonly agents$ = this.agentsSubject.asObservable();

  private unsubscribers: Array<() => void> = [];

  initialize(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [this.ipc.onAgentsUpdated(() => void this.loadAgents())];
  }

  destroy(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
  }

  async loadAgents(): Promise<void> {
    const agents = await this.ipc.listAgents();
    this.agentsSubject.next(agents);
  }

  async createAgent(input: CreateAgentInput): Promise<void> {
    await this.ipc.createAgent(input);
    await this.loadAgents();
  }

  async updateAgent(agentId: number, name: string): Promise<void> {
    await this.ipc.updateAgent(agentId, name);
    await this.loadAgents();
  }

  async deleteAgent(agentId: number): Promise<void> {
    await this.ipc.deleteAgent(agentId);
    await this.loadAgents();
  }
}
