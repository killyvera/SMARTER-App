'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeAgentApiErrorForClient } from '@/lib/agentErrorMessage';
import { ProposalToolPreview } from '@/features/agent/components/proposals/ProposalToolPreview';
import { AgentTodayPanel } from '@/features/agent/components/AgentTodayPanel';
import Link from 'next/link';

type UiProposal = {
  toolCallId: string;
  name: string;
  arguments: string;
  displayLabel: string;
  approvalToken: string;
};

type UiMsgKind = 'text' | 'goal_snapshot' | 'task_table';

type GoalSnapRow = { id: string; title: string; status: string };
type TaskSnapRow = { id: string; title: string; status: string; goalTitle?: string };

type UiMsg = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  proposals?: UiProposal[];
  kind?: UiMsgKind;
  goalRows?: GoalSnapRow[];
  taskRows?: TaskSnapRow[];
};

type AgentTurnResponse =
  | { type: 'message'; content: string }
  | {
      type: 'tool_proposals';
      assistantNote: string | null;
      proposals: UiProposal[];
    }
  | {
      type: 'execute_result';
      results: Array<{ approvalToken: string; ok: boolean; message: string }>;
    };

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const LEGACY_STORAGE_PREFIX = 'smarter-agent-chat-v1:';
const STORAGE_PREFIX = 'smarter-agent-chat-v2:';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function migrateLegacyMessages(raw: unknown): UiMsg[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.map((m) => {
    const o = m as Record<string, unknown>;
    return {
      id: String(o.id ?? id()),
      role: o.role === 'user' || o.role === 'assistant' || o.role === 'system' ? o.role : 'system',
      content: String(o.content ?? ''),
      proposals: Array.isArray(o.proposals) ? (o.proposals as UiProposal[]) : undefined,
      kind: o.kind === 'goal_snapshot' || o.kind === 'task_table' ? o.kind : undefined,
      goalRows: Array.isArray(o.goalRows) ? (o.goalRows as GoalSnapRow[]) : undefined,
      taskRows: Array.isArray(o.taskRows) ? (o.taskRows as TaskSnapRow[]) : undefined,
    };
  });
}

async function fetchSnapshotWidgets(): Promise<{ goalMsg: UiMsg; taskMsg: UiMsg } | null> {
  try {
    const [goals, tasks] = await Promise.all([
      apiRequest<Array<{ id: string; title: string; status: string }>>('/goals', { method: 'GET' }),
      apiRequest<Array<{ id: string; title: string; status: string; goal?: { title?: string } }>>('/minitasks', {
        method: 'GET',
      }),
    ]);
    const goalRows: GoalSnapRow[] = goals.slice(0, 14).map((g) => ({
      id: g.id,
      title: g.title,
      status: g.status,
    }));
    const taskRows: TaskSnapRow[] = tasks.slice(0, 18).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      goalTitle: t.goal?.title,
    }));
    return {
      goalMsg: {
        id: id(),
        role: 'system',
        content: 'Metas (actualizado)',
        kind: 'goal_snapshot',
        goalRows,
      },
      taskMsg: {
        id: id(),
        role: 'system',
        content: 'Minitasks (actualizado)',
        kind: 'task_table',
        taskRows,
      },
    };
  } catch {
    return null;
  }
}

export function AgentHomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const coachModeId = useId();
  const coachStrictId = useId();
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);
  const [coachMode, setCoachMode] = useState(false);
  const [coachStrict, setCoachStrict] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    try {
      let raw = localStorage.getItem(storageKey(userId));
      if (!raw) raw = localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        const migrated = migrateLegacyMessages(parsed);
        if (migrated) setMessages(migrated);
      }
    } catch {
      /* ignore */
    }
    try {
      const coachRaw = localStorage.getItem(`smarter-agent-coach:${userId}`);
      if (coachRaw) {
        const o = JSON.parse(coachRaw) as { mode?: boolean; strict?: boolean };
        setCoachMode(Boolean(o.mode));
        setCoachStrict(Boolean(o.strict));
      }
    } catch {
      /* ignore */
    }
    setBooted(true);
  }, [userId]);

  useEffect(() => {
    if (!userId || !booted) return;
    try {
      localStorage.setItem(`smarter-agent-coach:${userId}`, JSON.stringify({ mode: coachMode, strict: coachStrict }));
    } catch {
      /* ignore */
    }
  }, [userId, booted, coachMode, coachStrict]);

  useEffect(() => {
    if (!userId || !booted) return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, userId, booted]);

  const injectContextSummary = useCallback(async () => {
    try {
      const [stats, pending] = await Promise.all([
        apiRequest<{
          goals: { total: number; active: number; completed: number };
          miniTasks: { total: number; pending: number; completed: number; draft: number };
          progress: { percentage: number };
        }>('/stats', { method: 'GET' }),
        apiRequest<
          Array<{
            id: string;
            title: string;
            goalTitle?: string;
            alarmTime?: string;
            pluginId: string;
            message?: string;
          }>
        >('/alarms/pending-today', { method: 'GET' }),
      ]);

      const lines: string[] = [];
      lines.push(
        `Resumen: ${stats.goals.active} metas activas de ${stats.goals.total}, ${stats.miniTasks.pending} minitasks pendientes, ${stats.miniTasks.completed} completadas. Progreso medio ~${stats.progress.percentage}%.`
      );
      if (pending.length === 0) {
        lines.push('No hay alarmas pendientes para hoy en este momento.');
      } else {
        lines.push(`Alarmas / pendientes hoy (${pending.length}):`);
        pending.slice(0, 8).forEach((p) => {
          lines.push(`• ${p.title}${p.goalTitle ? ` (${p.goalTitle})` : ''}${p.alarmTime ? ` — ${p.alarmTime}` : ''}`);
        });
        if (pending.length > 8) lines.push(`…y ${pending.length - 8} más.`);
      }

      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [{ id: id(), role: 'system', content: lines.join('\n') }];
      });
    } catch {
      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            id: id(),
            role: 'system',
            content: 'No se pudo cargar el resumen inicial. Podés escribirle al agente igualmente.',
          },
        ];
      });
    }
  }, []);

  useEffect(() => {
    if (booted && userId) void injectContextSummary();
  }, [booted, userId, injectContextSummary]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const apiHistory = useMemo(() => {
    return messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }, [messages]);

  const hasOpenProposals = useMemo(() => messages.some((m) => m.proposals && m.proposals.length > 0), [messages]);

  const sendUserMessage = async () => {
    const text = input.trim();
    if (!text || loading || hasOpenProposals) return;

    const userMsg: UiMsg = { id: id(), role: 'user', content: text };
    setInput('');
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const nextHistory = [...apiHistory, { role: 'user' as const, content: text }];
      const res = await apiRequest<AgentTurnResponse>('/assistant/agent-turn', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'chat',
          messages: nextHistory,
          ...(coachMode ? { coachMode: true } : {}),
          ...(coachStrict ? { coachStrict: true } : {}),
        }),
      });

      if (res.type === 'message') {
        setMessages((prev) => [...prev, { id: id(), role: 'assistant', content: res.content }]);
      } else if (res.type === 'tool_proposals') {
        setMessages((prev) => [
          ...prev,
          {
            id: id(),
            role: 'assistant',
            content: res.assistantNote?.trim() || 'Puedo aplicar estos cambios. Confirmá si te parece bien.',
            proposals: res.proposals,
          },
        ]);
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Error al contactar al agente';
      setMessages((prev) => [
        ...prev,
        {
          id: id(),
          role: 'system',
          content: sanitizeAgentApiErrorForClient(raw),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const cancelProposals = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, proposals: undefined } : m))
    );
  };

  const confirmProposals = async (msgId: string, proposals: UiProposal[]) => {
    setLoading(true);
    try {
      const res = await apiRequest<AgentTurnResponse>('/assistant/agent-turn', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'execute_tools',
          executions: proposals.map((p) => ({ approvalToken: p.approvalToken })),
          ...(coachStrict ? { coachStrict: true } : {}),
        }),
      });

      if (res.type === 'execute_result') {
        const summary = res.results.map((r) => `${r.ok ? '✓' : '✗'} ${r.message}`).join('\n');
        const hadOk = res.results.some((r) => r.ok);
        setMessages((prev) =>
          prev
            .map((m) => (m.id === msgId ? { ...m, proposals: undefined } : m))
            .concat({
              id: id(),
              role: 'system',
              content: `Resultado de acciones:\n${summary}`,
            })
        );
        if (hadOk) {
          queryClient.invalidateQueries({ queryKey: ['agent-today-panel'] });
          const widgets = await fetchSnapshotWidgets();
          if (widgets) {
            setMessages((prev) => [...prev, widgets.goalMsg, widgets.taskMsg]);
          }
        }
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Error al ejecutar acciones';
      setMessages((prev) => [
        ...prev,
        {
          id: id(),
          role: 'system',
          content: sanitizeAgentApiErrorForClient(raw),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col min-h-0 pb-2 md:max-w-xl">
      <AgentTodayPanel />
      <div className="mx-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/50 py-2">
        <div className="flex items-center gap-2">
          <Switch id={coachModeId} checked={coachMode} onCheckedChange={setCoachMode} />
          <Label htmlFor={coachModeId} className="text-[11px] font-normal cursor-pointer">
            Modo coach SMARTER
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id={coachStrictId} checked={coachStrict} onCheckedChange={setCoachStrict} />
          <Label htmlFor={coachStrictId} className="text-[11px] font-normal cursor-pointer">
            Ejecución estricta
          </Label>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                m.role === 'user' && 'bg-primary text-primary-foreground',
                m.role === 'assistant' && 'bg-muted',
                m.role === 'system' && 'bg-amber-500/15 text-amber-950 dark:text-amber-100 border border-amber-500/30 text-xs'
              )}
            >
              {m.kind === 'goal_snapshot' && m.goalRows && m.goalRows.length > 0 ? (
                <AgentGoalSnapshotTable rows={m.goalRows} titleLine={m.content} />
              ) : m.kind === 'task_table' && m.taskRows && m.taskRows.length > 0 ? (
                <AgentTaskSnapshotTable rows={m.taskRows} titleLine={m.content} />
              ) : (
                m.content
              )}
              {m.proposals && m.proposals.length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-border/50 pt-2">
                  {m.proposals.map((p) => (
                    <ProposalToolPreview key={p.toolCallId} name={p.name} argumentsJson={p.arguments} />
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={loading}
                      onClick={() => void confirmProposals(m.id, m.proposals!)}
                    >
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" disabled={loading} onClick={() => cancelProposals(m.id)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex justify-center py-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t bg-background p-3 space-y-2">
        {hasOpenProposals ? (
          <p className="text-xs text-muted-foreground text-center">Confirmá o cancelá las acciones propuestas arriba.</p>
        ) : null}
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí al agente Smarter…"
            rows={2}
            disabled={loading || hasOpenProposals}
            className="min-h-[44px] resize-none text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendUserMessage();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={loading || !input.trim() || hasOpenProposals}
            onClick={() => void sendUserMessage()}
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AgentGoalSnapshotTable({ rows, titleLine }: { rows: GoalSnapRow[]; titleLine: string }) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-amber-950 dark:text-amber-50">{titleLine}</p>
      <div className="overflow-x-auto rounded-md border border-amber-500/25 bg-background/40">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="px-2 py-1 font-medium">Meta</th>
              <th className="px-2 py-1 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/40 last:border-0">
                <td className="px-2 py-1">
                  <Link href={`/goals/${r.id}`} className="text-primary underline-offset-2 hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-2 py-1 text-muted-foreground">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/goals" className="inline-block text-[10px] text-primary hover:underline">
        Editar en Metas
      </Link>
    </div>
  );
}

function AgentTaskSnapshotTable({ rows, titleLine }: { rows: TaskSnapRow[]; titleLine: string }) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-amber-950 dark:text-amber-50">{titleLine}</p>
      <div className="overflow-x-auto rounded-md border border-amber-500/25 bg-background/40">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="px-2 py-1 font-medium">Minitask</th>
              <th className="px-2 py-1 font-medium">Meta</th>
              <th className="px-2 py-1 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/40 last:border-0">
                <td className="px-2 py-1">
                  <Link href={`/minitasks/${r.id}`} className="text-primary underline-offset-2 hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-2 py-1 text-muted-foreground">{r.goalTitle ?? '—'}</td>
                <td className="px-2 py-1 text-muted-foreground">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">Gráficos y bitácora: abrí cada tarea para ver métricas completas.</p>
    </div>
  );
}
