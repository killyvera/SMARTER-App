import { findGoalsByUser } from '@/repositories/goalRepository';
import { findMiniTasksByUser } from '@/repositories/miniTaskRepository';
import { calculateGoalProgress } from '@/features/goals/utils/calculateGoalProgress';
import { getPendingTasksForToday } from '@/services/pendingAlarmsService';

const MAX_GOALS = 40;
const MAX_MINITASKS = 120;
const TITLE_MAX = 120;

function trimTitle(s: string): string {
  const t = s.trim();
  return t.length <= TITLE_MAX ? t : `${t.slice(0, TITLE_MAX)}…`;
}

/**
 * Resumen JSON-serializable para el system prompt del agente (acotado por tokens).
 */
export async function buildGlobalSmarterContext(userId: string): Promise<{
  stats: {
    goalsTotal: number;
    goalsActive: number;
    goalsCompleted: number;
    miniTasksTotal: number;
    miniTasksPending: number;
    miniTasksInProgress: number;
    miniTasksCompleted: number;
    progressAvgPercent: number;
  };
  pendingToday: Awaited<ReturnType<typeof getPendingTasksForToday>>;
  goals: Array<{
    id: string;
    title: string;
    status: string;
    deadline: string | null;
    /** true si ya hubo validate_goal confirm (hay fila SmarterScore en BD). */
    smarterValidated: boolean;
  }>;
  miniTasks: Array<{
    id: string;
    goalId: string;
    goalTitle: string;
    title: string;
    status: string;
    unlocked: boolean;
    deadline: string | null;
  }>;
}> {
  const goals = await findGoalsByUser(userId);
  const miniTasks = await findMiniTasksByUser(userId);
  const pendingToday = await getPendingTasksForToday(userId);

  const goalsStats = {
    total: goals.length,
    active: goals.filter((g) => g.status === 'ACTIVE').length,
    completed: goals.filter((g) => g.status === 'COMPLETED').length,
  };

  const mtStats = {
    total: miniTasks.length,
    draft: miniTasks.filter((mt) => mt.status === 'DRAFT').length,
    pending: miniTasks.filter((mt) => mt.status === 'PENDING').length,
    inProgress: miniTasks.filter((mt) => mt.status === 'IN_PROGRESS').length,
    completed: miniTasks.filter((mt) => mt.status === 'COMPLETED').length,
  };

  let totalProgress = 0;
  let goalsWithProgress = 0;
  goals.forEach((goal) => {
    const gmt = miniTasks.filter((mt) => mt.goalId === goal.id);
    const gp = calculateGoalProgress(gmt);
    if (gp.total > 0) {
      totalProgress += gp.percentage;
      goalsWithProgress++;
    }
  });
  const progressAvgPercent =
    goalsWithProgress > 0 ? Math.round(totalProgress / goalsWithProgress) : 0;

  const goalsSlice = goals.slice(0, MAX_GOALS).map((g) => ({
    id: g.id,
    title: trimTitle(g.title),
    status: g.status,
    deadline: g.deadline ? g.deadline.toISOString().slice(0, 10) : null,
    smarterValidated: Boolean((g as { smarterScore?: unknown }).smarterScore),
  }));

  const mtSlice = miniTasks.slice(0, MAX_MINITASKS).map((mt) => {
    const goal = goals.find((g) => g.id === mt.goalId);
    return {
      id: mt.id,
      goalId: mt.goalId,
      goalTitle: trimTitle(goal?.title || ''),
      title: trimTitle(mt.title),
      status: mt.status,
      unlocked: Boolean(mt.unlocked),
      deadline: mt.deadline ? mt.deadline.toISOString().slice(0, 10) : null,
    };
  });

  return {
    stats: {
      goalsTotal: goalsStats.total,
      goalsActive: goalsStats.active,
      goalsCompleted: goalsStats.completed,
      miniTasksTotal: mtStats.total,
      miniTasksPending: mtStats.pending,
      miniTasksInProgress: mtStats.inProgress,
      miniTasksCompleted: mtStats.completed,
      progressAvgPercent,
    },
    pendingToday,
    goals: goalsSlice,
    miniTasks: mtSlice,
  };
}

export function contextToPromptBlock(ctx: Awaited<ReturnType<typeof buildGlobalSmarterContext>>): string {
  return `Contexto actual del usuario (JSON compacto):\n${JSON.stringify(ctx)}`;
}
