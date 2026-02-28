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
  latestResult: 'ok' | 'fail' | null;
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
