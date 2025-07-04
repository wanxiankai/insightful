// apps/web-app/app/types/index.ts

// Analysis Result Types
export interface ActionItem {
  text: string;
  owner?: string;
  dueDate?: string;
}

export interface KeyDecision {
  text: string;
  context?: string;
}

export interface AnalysisResult {
  id: string;
  transcript?: string | null;
  summary?: string | null;
  actionItems?: ActionItem[] | null;
  keyDecisions?: KeyDecision[] | null;
  jobId: string;
}

export interface MeetingJob {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileName: string | null;
  fileUrl: string | null;
  userId: string;
  analysisResult?: AnalysisResult | null;
}
