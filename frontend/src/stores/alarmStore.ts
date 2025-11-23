import { create } from 'zustand';

export interface PendingTask {
  id: string;
  title: string;
  goalTitle?: string;
  alarmTime?: string;
  pluginId: string; // 'calendar' | 'reminder'
  checklistEnabled?: boolean;
  checklistCompleted?: boolean;
  message?: string;
}

interface AlarmStore {
  pendingTasks: PendingTask[];
  pendingCount: number;
  lastChecked: Date | null;
  setPendingTasks: (tasks: PendingTask[]) => void;
  addPendingTask: (task: PendingTask) => void;
  removePendingTask: (taskId: string) => void;
  updateLastChecked: () => void;
  clearAll: () => void;
}

export const useAlarmStore = create<AlarmStore>((set) => ({
  pendingTasks: [],
  pendingCount: 0,
  lastChecked: null,
  
  setPendingTasks: (tasks) => set({ 
    pendingTasks: tasks,
    pendingCount: tasks.length,
  }),
  
  addPendingTask: (task) => set((state) => {
    // Evitar duplicados
    if (state.pendingTasks.some(t => t.id === task.id)) {
      return state;
    }
    const newTasks = [...state.pendingTasks, task];
    return {
      pendingTasks: newTasks,
      pendingCount: newTasks.length,
    };
  }),
  
  removePendingTask: (taskId) => set((state) => {
    const newTasks = state.pendingTasks.filter(t => t.id !== taskId);
    return {
      pendingTasks: newTasks,
      pendingCount: newTasks.length,
    };
  }),
  
  updateLastChecked: () => set({ lastChecked: new Date() }),
  
  clearAll: () => set({ 
    pendingTasks: [],
    pendingCount: 0,
  }),
}));

