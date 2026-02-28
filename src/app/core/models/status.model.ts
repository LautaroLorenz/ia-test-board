export interface FailureCauseCount {
  cause: string;
  count: number;
}

export interface LatestRunSummary {
  runGroupId: number | null;
  okCount: number;
  failCount: number;
  topFailureCauses: FailureCauseCount[];
}
