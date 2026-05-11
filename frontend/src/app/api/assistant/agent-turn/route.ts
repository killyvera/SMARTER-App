import { NextRequest, NextResponse } from 'next/server';
import { agentTurnBodySchema } from '@smarter-app/shared';
import { getUserId } from '@/lib/auth/getUserId';
import { getClientIP } from '@/lib/getClientIP';
import { buildGlobalSmarterContext, contextToPromptBlock } from '@/services/globalSmarterContextService';
import { runGlobalAgentTurn } from '@/clients/aiClient';
import { mintToolApprovalToken, defaultApprovalWindow, verifyToolApprovalToken } from '@/lib/agentToolApproval';
import { executeAgentTool, type AgentToolResultExtras } from '@/services/agentToolExecutor';
import { AGENT_TOOL_NAME_SET, type AgentToolName } from '@/config/agentOpenAiTools';
import { logApiRequest, logApiError } from '@/lib/api-logger';
import { sanitizeAgentApiErrorForClient } from '@/lib/agentErrorMessage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const start = Date.now();
  const ip = getClientIP(request);

  try {
    const userId = await getUserId(request);
    const body = await request.json();
    const parsed = agentTurnBodySchema.parse(body);

    if (parsed.mode === 'execute_tools') {
      const results: Array<{
        approvalToken: string;
        ok: boolean;
        message: string;
        extras?: AgentToolResultExtras;
      }> = [];

      for (const ex of parsed.executions) {
        const payload = verifyToolApprovalToken(ex.approvalToken, userId);
        if (!payload) {
          results.push({ approvalToken: ex.approvalToken.slice(0, 12) + '…', ok: false, message: 'Token inválido o expirado' });
          continue;
        }
        if (!AGENT_TOOL_NAME_SET.has(payload.name)) {
          results.push({ approvalToken: payload.toolCallId, ok: false, message: 'Herramienta no permitida' });
          continue;
        }
        const out = await executeAgentTool(userId, payload.name as AgentToolName, payload.arguments, {
          coachStrict: parsed.coachStrict === true,
        });
        results.push({
          approvalToken: payload.toolCallId,
          ok: out.ok,
          message: out.message,
          ...(out.extras ? { extras: out.extras } : {}),
        });
      }

      const duration = Date.now() - start;
      logApiRequest('POST', '/api/assistant/agent-turn', 200, duration);
      return NextResponse.json({ type: 'execute_result', results });
    }

    const ctx = await buildGlobalSmarterContext(userId);
    const contextBlock = contextToPromptBlock(ctx);

    const outcome = await runGlobalAgentTurn(
      userId,
      contextBlock,
      parsed.messages.map((m) => ({ role: m.role, content: m.content })),
      ip,
      { coachMode: parsed.coachMode === true, coachStrict: parsed.coachStrict === true }
    );

    if (outcome.kind === 'text') {
      const duration = Date.now() - start;
      logApiRequest('POST', '/api/assistant/agent-turn', 200, duration);
      return NextResponse.json({
        type: 'message',
        content: outcome.content,
      });
    }

    const { iat, exp } = defaultApprovalWindow();
    const proposals = outcome.toolCalls.map((tc) => {
      const token = mintToolApprovalToken({
        userId,
        toolCallId: tc.id,
        name: tc.name,
        arguments: tc.arguments,
        iat,
        exp,
      });
      return {
        toolCallId: tc.id,
        name: tc.name,
        arguments: tc.arguments,
        displayLabel: summarizeTool(tc.name, tc.arguments),
        approvalToken: token,
      };
    });

    const duration = Date.now() - start;
    logApiRequest('POST', '/api/assistant/agent-turn', 200, duration);
    const assistantNote =
      typeof outcome.content === 'string' && outcome.content.trim().length > 0
        ? outcome.content.trim()
        : defaultAssistantNoteForToolCalls(outcome.toolCalls);

    return NextResponse.json({
      type: 'tool_proposals',
      assistantNote,
      proposals,
    });
  } catch (error) {
    const duration = Date.now() - start;
    logApiError('POST', '/api/assistant/agent-turn', error);
    const msg = error instanceof Error ? error.message : 'Error del agente';
    const status = msg.includes('Token') || msg.includes('autenticación') || msg.includes('No autorizado') ? 401 : 400;
    return NextResponse.json({ error: sanitizeAgentApiErrorForClient(msg) }, { status });
  }
}

function summarizeTool(name: string, argsJson: string): string {
  try {
    const a = JSON.parse(argsJson) as Record<string, unknown>;
    if (name === 'create_goal') return `Crear meta: ${String(a.title ?? '').slice(0, 40)}`;
    if (name === 'update_goal') return `Actualizar meta ${String(a.goalId ?? '').slice(0, 8)}…`;
    if (name === 'delete_goal') return `Eliminar meta ${String(a.goalId ?? '').slice(0, 8)}…`;
    if (name === 'activate_goal') return `Activar meta ${String(a.goalId ?? '').slice(0, 8)}…`;
    if (name === 'validate_goal') {
      const gid = String(a.goalId ?? '').slice(0, 8);
      const phase = String(a.phase ?? '');
      return `Validar meta ${gid}…${phase ? ` (${phase})` : ''}`;
    }
    if (name === 'apply_smarter_worksheet') return `Cuestionario SMARTER → meta ${String(a.goalId ?? '').slice(0, 8)}…`;
    if (name === 'sync_goals_completion') return 'Sincronizar completitud de metas';
    if (name === 'create_minitask') return `Crear minitask: ${String(a.title ?? '').slice(0, 40)}`;
    if (name === 'update_minitask') return `Actualizar minitask ${String(a.miniTaskId ?? '').slice(0, 8)}…`;
    if (name === 'delete_minitask') return `Eliminar minitask ${String(a.miniTaskId ?? '').slice(0, 8)}…`;
    if (name === 'upsert_journal_today') {
      return `Guardar journal de hoy (${String(a.miniTaskId ?? '').slice(0, 8)}…)`;
    }
    if (name === 'unlock_minitask') return `Desbloquear minitask ${String(a.miniTaskId ?? '').slice(0, 8)}…`;
  } catch {
    /* ignore */
  }
  return name;
}

function defaultAssistantNoteForToolCalls(
  toolCalls: Array<{ name: string; arguments: string }>
): string {
  if (!toolCalls.length) {
    return 'Puedo aplicar estos cambios. Confirmá si te parece bien.';
  }
  const labels = toolCalls.map((tc) => summarizeTool(tc.name, tc.arguments));
  if (labels.length === 1) {
    return `Te propongo esta acción: ${labels[0]}. Revisá el panel de confirmación abajo y confirmá si te parece bien.`;
  }
  return (
    `Te propongo estas acciones:\n` +
    labels.map((l, i) => `${i + 1}. ${l}`).join('\n') +
    `\n\nRevisá el panel abajo y confirmá las que quieras aplicar.`
  );
}
