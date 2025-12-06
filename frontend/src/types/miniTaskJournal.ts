export interface MiniTaskJournalEntry {
  id: string;
  miniTaskId: string;
  entryDate: Date;
  progressValue?: number | null;
  progressUnit?: string | null;
  notes?: string | null;
  obstacles?: string | null;
  mood?: string | null;
  timeSpent?: number | null;
  checklistCompleted?: boolean | null;
  metricsData?: string | null;
  coachQuery?: string | null;
  coachResponse?: string | null;
  coachSuggestions?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMiniTaskJournalEntryInput {
  entryDate?: string | Date;
  progressValue?: number;
  progressUnit?: string;
  notes?: string;
  obstacles?: string;
  mood?: string;
  timeSpent?: number;
  checklistCompleted?: boolean;
  metricsData?: Record<string, any>;
}

export interface UpdateMiniTaskJournalEntryInput {
  progressValue?: number;
  progressUnit?: string;
  notes?: string;
  obstacles?: string;
  mood?: string;
  timeSpent?: number;
  checklistCompleted?: boolean;
  metricsData?: Record<string, any>;
}

export interface CoachQueryRequest {
  query: string;
  includeHistory?: boolean;
}

export interface CoachSuggestion {
  type: 'improvement' | 'warning' | 'encouragement' | 'action';
  title: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface CoachQueryResponse {
  feedback: string;
  smarterEvaluation: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timebound: number;
    average: number;
    passed: boolean;
  };
  suggestions: CoachSuggestion[];
  encouragement?: string;
  warnings?: string[];
}

export interface MiniTaskCoachContext {
  miniTask: {
    id: string;
    title: string;
    description?: string;
    deadline?: Date;
    status: string;
    unlocked: boolean;
  };
  goal: {
    title: string;
    description?: string;
  };
  plugins?: Array<{
    pluginId: string;
    config: any;
    enabled: boolean;
  }>;
  journalHistory?: Array<{
    entryDate: Date;
    progressValue?: number;
    progressUnit?: string;
    notes?: string;
    obstacles?: string;
    mood?: string;
    timeSpent?: number;
  }>;
  currentMetrics?: {
    totalEntries: number;
    daysWithEntries: number;
    avgProgress: number;
    totalTimeSpent: number;
  };
}

