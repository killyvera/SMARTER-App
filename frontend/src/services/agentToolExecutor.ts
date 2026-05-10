import { updateMiniTaskService, createMiniTaskService, deleteMiniTaskService, unlockMiniTaskService } from '@/services/miniTaskService';
import { createMiniTaskJournalEntryService } from '@/services/miniTaskJournalService';
import {
  createGoalService,
  updateGoalService,
  deleteGoalService,
  activateGoalService,
  validateGoalService,
  checkAndUpdateGoalCompletion,
} from '@/services/goalService';
import { findGoalsByUser, findGoalById } from '@/repositories/goalRepository';
import { findSmarterScoreByGoalId } from '@/repositories/smarterScoreRepository';
import type { CreateGoalInput, UpdateGoalInput, UpdateMiniTaskInput, MiniTaskStatus } from '@smarter-app/shared';
import type { AgentToolName } from '@/config/agentOpenAiTools';

const GOAL_STATUS = new Set(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']);
const MINITASK_STATUS = new Set(['DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

/**
 * Si el modelo no pasa goalId o pasa uno inválido, usa la primera meta ACTIVE, luego DRAFT, luego cualquiera.
 */
async function resolveGoalIdForNewMiniTask(
  userId: string,
  requestedGoalId: string | undefined
): Promise<{ goalId: string; hint: string } | { error: string }> {
  const trimmed = requestedGoalId?.trim();
  if (trimmed) {
    const g = await findGoalById(trimmed, userId);
    if (g) return { goalId: trimmed, hint: '' };
  }

  let list = await findGoalsByUser(userId, { status: 'ACTIVE' });
  if (list.length > 0) {
    const g = list[0];
    return { goalId: g.id, hint: ` (asignada a tu meta activa: "${g.title}")` };
  }
  list = await findGoalsByUser(userId, { status: 'DRAFT' });
  if (list.length > 0) {
    const g = list[0];
    return { goalId: g.id, hint: ` (asignada a meta en borrador: "${g.title}")` };
  }
  const all = await findGoalsByUser(userId);
  if (all.length > 0) {
    const g = all[0];
    return { goalId: g.id, hint: ` (asignada a "${g.title}" — ${g.status})` };
  }

  return {
    error:
      'No tenés ninguna meta. Creá una primero (pedime "crear meta …" o usá Metas en el menú) y después la tarea.',
  };
}

export async function executeAgentTool(
  userId: string,
  name: AgentToolName,
  argsJson: string,
  opts?: { coachStrict?: boolean }
): Promise<{ ok: boolean; message: string }> {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsJson) as Record<string, unknown>;
  } catch {
    return { ok: false, message: 'Argumentos JSON invalidos' };
  }

  try {
    switch (name) {
      case 'create_goal': {
        const title = typeof args.title === 'string' ? args.title.trim() : '';
        if (!title) return { ok: false, message: 'title requerido' };
        const input: CreateGoalInput = {
          title,
          description: typeof args.description === 'string' ? args.description : undefined,
          deadline: typeof args.deadline === 'string' ? args.deadline : undefined,
          plannedHours: typeof args.plannedHours === 'number' ? args.plannedHours : undefined,
          isSingleDayGoal: typeof args.isSingleDayGoal === 'boolean' ? args.isSingleDayGoal : undefined,
        };
        const g = await createGoalService(userId, input);
        return { ok: true, message: `Meta creada (DRAFT) id=${g.id}: ${g.title}` };
      }
      case 'update_goal': {
        const goalId = typeof args.goalId === 'string' ? args.goalId : '';
        if (!goalId) return { ok: false, message: 'goalId requerido' };
        const patch: UpdateGoalInput = {};
        if (typeof args.title === 'string') patch.title = args.title;
        if (typeof args.description === 'string') patch.description = args.description;
        if (typeof args.deadline === 'string') patch.deadline = args.deadline;
        if (typeof args.plannedHours === 'number') patch.plannedHours = args.plannedHours;
        if (typeof args.isSingleDayGoal === 'boolean') patch.isSingleDayGoal = args.isSingleDayGoal;
        if (typeof args.status === 'string' && GOAL_STATUS.has(args.status)) {
          patch.status = args.status as UpdateGoalInput['status'];
        }
        if (Object.keys(patch).length === 0) return { ok: false, message: 'Sin campos para actualizar' };
        const g = await updateGoalService(goalId, userId, patch);
        return { ok: true, message: `Meta actualizada: ${g.title} (${g.status})` };
      }
      case 'delete_goal': {
        const goalId = typeof args.goalId === 'string' ? args.goalId : '';
        if (!goalId) return { ok: false, message: 'goalId requerido' };
        await deleteGoalService(goalId, userId);
        return { ok: true, message: `Meta ${goalId} eliminada.` };
      }
      case 'activate_goal': {
        const goalId = typeof args.goalId === 'string' ? args.goalId : '';
        if (!goalId) return { ok: false, message: 'goalId requerido' };
        if (opts?.coachStrict) {
          const score = await findSmarterScoreByGoalId(goalId);
          if (!score || !score.passed) {
            return {
              ok: false,
              message:
                'Modo coach estricto: validá la meta con validate_goal (fase confirm) y cumplí el score SMARTER antes de activate_goal.',
            };
          }
        }
        const g = await activateGoalService(goalId, userId);
        return { ok: true, message: `Meta activada: ${g.title}` };
      }
      case 'validate_goal': {
        const goalId = typeof args.goalId === 'string' ? args.goalId : '';
        const phase = args.phase === 'confirm' ? 'confirm' : 'preview';
        if (!goalId) return { ok: false, message: 'goalId requerido' };
        if (phase === 'preview') {
          const result = await validateGoalService(goalId, userId, { userId });
          const n = result.suggestedMiniTasks?.length ?? 0;
          const fb = (result.feedback || '').slice(0, 500);
          return { ok: true, message: `Preview validacion: ${n} minitasks sugeridas. Feedback: ${fb}` };
        }
        const acceptedMiniTasks = Array.isArray(args.acceptedMiniTasks) ? args.acceptedMiniTasks : undefined;
        const hasConfirm =
          typeof args.acceptedTitle === 'string' ||
          typeof args.acceptedDescription === 'string' ||
          (acceptedMiniTasks && acceptedMiniTasks.length > 0);
        if (!hasConfirm) {
          return { ok: false, message: 'Fase confirm requiere acceptedTitle, acceptedDescription o acceptedMiniTasks' };
        }
        await validateGoalService(goalId, userId, {
          acceptedTitle: typeof args.acceptedTitle === 'string' ? args.acceptedTitle : undefined,
          acceptedDescription: typeof args.acceptedDescription === 'string' ? args.acceptedDescription : undefined,
          acceptedMiniTasks: acceptedMiniTasks as any,
          userId,
        });
        return { ok: true, message: 'Validacion confirmada: score y minitasks guardadas.' };
      }
      case 'sync_goals_completion': {
        const activeGoals = await findGoalsByUser(userId, { status: 'ACTIVE' });
        await Promise.allSettled(activeGoals.map((g) => checkAndUpdateGoalCompletion(g.id, userId)));
        return { ok: true, message: `Revisadas ${activeGoals.length} metas ACTIVE.` };
      }
      case 'create_minitask': {
        const title = typeof args.title === 'string' ? args.title.trim() : '';
        if (!title) return { ok: false, message: 'title requerido' };
        if (opts?.coachStrict) {
          const desc = typeof args.description === 'string' ? args.description.trim() : '';
          if (desc.length < 12) {
            return {
              ok: false,
              message:
                'Modo coach estricto: añadí una descripción más concreta (≥12 caracteres) o usá unlock_minitask para el flujo guiado con plugins y checklist.',
            };
          }
        }
        const requested = typeof args.goalId === 'string' ? args.goalId : undefined;
        const resolved = await resolveGoalIdForNewMiniTask(userId, requested);
        if ('error' in resolved) return { ok: false, message: resolved.error };
        const mt = await createMiniTaskService({
          goalId: resolved.goalId,
          title,
          description: typeof args.description === 'string' ? args.description : undefined,
          deadline: typeof args.deadline === 'string' ? args.deadline : undefined,
          plannedHours: typeof args.plannedHours === 'number' ? args.plannedHours : undefined,
          isSingleDayTask: typeof args.isSingleDayTask === 'boolean' ? args.isSingleDayTask : undefined,
        });
        return {
          ok: true,
          message: `Minitask creada id=${mt.id}: ${mt.title}${resolved.hint}`,
        };
      }
      case 'update_minitask': {
        const miniTaskId = typeof args.miniTaskId === 'string' ? args.miniTaskId : '';
        if (!miniTaskId) return { ok: false, message: 'miniTaskId requerido' };
        const u: UpdateMiniTaskInput = {};
        if (typeof args.title === 'string') u.title = args.title;
        if (typeof args.description === 'string') u.description = args.description;
        if (typeof args.deadline === 'string') u.deadline = args.deadline;
        if (typeof args.plannedHours === 'number') u.plannedHours = args.plannedHours;
        if (typeof args.isSingleDayTask === 'boolean') u.isSingleDayTask = args.isSingleDayTask;
        if (typeof args.status === 'string' && MINITASK_STATUS.has(args.status)) {
          u.status = args.status as MiniTaskStatus;
        }
        if (Object.keys(u).length === 0) return { ok: false, message: 'Sin campos para actualizar minitask' };
        const mt = await updateMiniTaskService(miniTaskId, userId, u);
        return { ok: true, message: `Minitask actualizada: ${mt.title} (${mt.status})` };
      }
      case 'delete_minitask': {
        const miniTaskId = typeof args.miniTaskId === 'string' ? args.miniTaskId : '';
        if (!miniTaskId) return { ok: false, message: 'miniTaskId requerido' };
        await deleteMiniTaskService(miniTaskId, userId);
        return { ok: true, message: `Minitask ${miniTaskId} eliminada.` };
      }
      case 'upsert_journal_today': {
        const miniTaskId = typeof args.miniTaskId === 'string' ? args.miniTaskId : '';
        if (!miniTaskId) return { ok: false, message: 'miniTaskId requerido' };
        const notes = typeof args.notes === 'string' ? args.notes : undefined;
        const progressValue = typeof args.progressValue === 'number' ? args.progressValue : undefined;
        const progressUnit = typeof args.progressUnit === 'string' ? args.progressUnit : undefined;
        const checklistCompleted =
          typeof args.checklistCompleted === 'boolean' ? args.checklistCompleted : undefined;
        const mood =
          args.mood === 'positivo' || args.mood === 'neutral' || args.mood === 'negativo'
            ? args.mood
            : undefined;
        const timeSpent = typeof args.timeSpent === 'number' ? Math.max(0, Math.floor(args.timeSpent)) : undefined;
        await createMiniTaskJournalEntryService(userId, miniTaskId, {
          notes,
          progressValue,
          progressUnit,
          checklistCompleted,
          mood,
          timeSpent,
        });
        return { ok: true, message: 'Entrada de journal de hoy guardada.' };
      }
      case 'unlock_minitask': {
        const miniTaskId = typeof args.miniTaskId === 'string' ? args.miniTaskId : '';
        if (!miniTaskId) return { ok: false, message: 'miniTaskId requerido' };
        await unlockMiniTaskService(miniTaskId, userId);
        return { ok: true, message: `Minitask ${miniTaskId} desbloqueada.` };
      }
      default:
        return { ok: false, message: `Herramienta no soportada: ${name}` };
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Error al ejecutar herramienta' };
  }
}
