export interface MiniTaskChecklistItem {
  id: string;
  miniTaskId: string;
  label: string;
  completed: boolean;
  completedAt: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMiniTaskChecklistItemInput {
  label: string;
  order?: number;
}

export interface UpdateMiniTaskChecklistItemInput {
  label?: string;
  completed?: boolean;
  order?: number;
}

export interface ChecklistProgress {
  total: number;
  completed: number;
  percentage: number;
  allCompleted: boolean;
}

