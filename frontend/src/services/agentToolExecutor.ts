import { updateMiniTaskService } from '@/services/miniTaskService';
import { createMiniTaskJournalEntryService } from '@/services/miniTaskJournalService';
import type { MiniTaskStatus } from '@smarter-app/shared';

const ALLOWED_STATUS = new Set(['DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

export type AgentToolName = 'update_minitask_status' | 'upsert_journal_today';

export async function executeAgentTool(
  userId: string,
  name: AgentToolName,
  argsJson: string
): Promise<{ ok: boolean; message: string }> {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsJson) as Record<string, unknown>;
  } catch {
    return { ok: false, message: 'Argumentos JSON inválidos' };
  }

  if (name === 'update_minitask_status') {
    const miniTaskId = typeof args.miniTaskId === 'string' ? args.miniTaskId : '';
    const status = typeof args.status === 'string' ? args.status : '';
    if (!miniTaskId || !ALLOWED_STATUS.has(status)) {
      return { ok: false, message: 'miniTaskId o status inválido' };
    }
    try {
      await updateMiniTaskService(miniTaskId, userId, { status: status as MiniTaskStatus });
      return { ok: true, message: `Estado de la minitask actualizado a ${status}.` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Error al actualizar minitask' };
    }
  }

  if (name === 'upsert_journal_today') {
    const miniTaskId = typeof args.miniTaskId === 'string' ? args.miniTaskId : '';
    if (!miniTaskId) {
      return { ok: false, message: 'miniTaskId requerido' };
    }
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

    try {
      await createMiniTaskJournalEntryService(userId, miniTaskId, {
        notes,
        progressValue,
        progressUnit,
        checklistCompleted,
        mood,
        timeSpent,
      });
      return { ok: true, message: 'Entrada de journal de hoy guardada.' };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Error al guardar journal' };
    }
  }

  return { ok: false, message: `Herramienta no soportada: ${name}` };
}
