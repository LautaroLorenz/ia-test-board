import { TaskResult } from './task-result.enum';

export type TaskStatus = 'waiting' | 'executing' | 'finished';

export interface Task {
  id: number;
  title: string;
  description: string;
  inputVariablesJson: string;
  reproSteps: string;
  expectedResult: string;
  status: TaskStatus;
  assignedAgent: string | null;
  latestResult: TaskResult | null;
  latestFailureCause: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  inputVariablesJson: string;
  reproSteps: string;
  expectedResult: string;
}

export interface UpdateTaskInput extends CreateTaskInput {
  taskId: number;
}
