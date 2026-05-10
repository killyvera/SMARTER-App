import { NextRequest, NextResponse } from 'next/server';
import { agentTurnBodySchema } from '@smarter-app/shared';
import { getUserId } from '@/lib/auth/getUserId';
import { getClientIP } from '@/lib/getClientIP';
import { buildGlobalSmarterContext, contextToPromptBlock } from '@/services/globalSmarterContextService';
import { runGlobalAgentTurn } from '@/clients/aiClient';
import { mintToolApprovalToken, defaultApprovalWindow, verifyToolApprovalToken } from '@/lib/agentToolApproval';
import { executeAgentTool, type AgentToolName } from '@/services/agentToolExecutor';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

const ALLOWED_TOOLS = new Set<AgentToolName>(['update_minitask_status', 'upsert_journal_today']);

export async function POST(request: NextRequest) {
  const start = Date.now();
  const ip = getClientIP(request);

  try {
    const userId = await getUserId(request);
    const body = await request.json();
    const parsed = agentTurnBodySchema.parse(body);

    if (parsed.mode === 'execute_tools') {
      const results: Array<{ approvalToken: string; ok: boolean; message: string }> = [];

      for (const ex of parsed.executions) {
        const payload = verifyToolApprovalToken(ex.approvalToken, userId);
        if (!payload) {
          results.push({ approvalToken: ex.approvalToken.slice(0, 12) + '…', ok: false, message: 'Token inválido o expirado' });
          continue;
        }
        if (!ALLOWED_TOOLS.has(payload.name as AgentToolName)) {
          results.push({ approvalToken: payload.toolCallId, ok: false, message: 'Herramienta no permitida' });
          continue;
        }
        const out = await executeAgentTool(userId, payload.name as AgentToolName, payload.arguments);
        results.push({ approvalToken: payload.toolCallId, ok: out.ok, message: out.message });
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
      ip
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
    return NextResponse.json({
      type: 'tool_proposals',
      assistantNote: outcome.content,
      proposals,
    });
  } catch (error) {
    const duration = Date.now() - start;
    logApiError('POST', '/api/assistant/agent-turn', error);
    const msg = error instanceof Error ? error.message : 'Error del agente';
    const status = msg.includes('Token') || msg.includes('autenticación') || msg.includes('No autorizado') ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

function summarizeTool(name: string, argsJson: string): string {
  try {
    const a = JSON.parse(argsJson) as Record<string, unknown>;
    if (name === 'update_minitask_status') {
      return `Cambiar estado de minitask → ${String(a.status ?? '')}`;
    }
    if (name === 'upsert_journal_today') {
      return `Guardar journal de hoy (${String(a.miniTaskId ?? '').slice(0, 8)}…)`;
    }
  } catch {
    /* ignore */
  }
  return name;
}
