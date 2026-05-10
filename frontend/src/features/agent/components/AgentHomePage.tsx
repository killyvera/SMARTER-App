'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateGoalProgress } from '@/features/goals/utils/calculateGoalProgress';
import { friendlyAgentToolMessage, sanitizeAgentApiErrorForClient } from '@/lib/agentErrorMessage';
import { ProposalToolPreview } from '@/features/agent/components/proposals/ProposalToolPreview';
import { AgentTodayPanel } from '@/features/agent/components/AgentTodayPanel';
import {
  createInitialSessionsIndex,
  deriveSessionTitleFromMessages,
  loadSessionMessagesRaw,
  loadSessionsIndex,
  migrateLegacyChatToSessions,
  newSessionId,
  removeSessionMessages,
  saveSessionMessagesRaw,
  saveSessionsIndex,
  type SessionsIndex,
} from '@/features/agent/agentChatSessions';
import { AGENT_CHAT_SHORTCUTS } from '@/features/agent/agentChatShortcuts';
import { SmarterWorksheetWidget } from '@/features/agent/components/widgets/SmarterWorksheetWidget';
import { MinitaskPickWidget } from '@/features/agent/components/widgets/MinitaskPickWidget';
import type { MinitaskPickItem } from '@/features/agent/components/widgets/MinitaskPickWidget';
import Link from 'next/link';

type UiProposal = {
  toolCallId: string;
  name: string;
  arguments: string;
  displayLabel: string;
  approvalToken: string;
};

type UiMsgKind =
  | 'text'
  | 'goal_snapshot'
  | 'task_table'
  | 'action_result'
  | 'smarter_worksheet'
  | 'minitask_pick';
type SystemTone = 'default' | 'error' | 'coach';

type GoalSnapRow = {
  id: string;
  title: string;
  status: string;
  deadline?: string | null;
  progressPercent?: number | null;
  scoreAverage?: number | null;
};
type TaskSnapRow = { id: string; title: string; status: string; goalTitle?: string; deadline?: string | null };

type UiMsg = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  proposals?: UiProposal[];
  kind?: UiMsgKind;
  goalRows?: GoalSnapRow[];
  taskRows?: TaskSnapRow[];
  actionResults?: Array<{ ok: boolean; message: string }>;
  systemTone?: SystemTone;
  minitaskPick?: { goalId: string; feedback?: string; items: MinitaskPickItem[] };
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
      results: Array<{
        approvalToken: string;
        ok: boolean;
        message: string;
        extras?: {
          kind: string;
          goalId?: string;
          suggestedMiniTasks?: Array<{ title: string; description?: string }>;
          feedback?: string;
        };
      }>;
    };

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
      kind:
        o.kind === 'goal_snapshot' ||
        o.kind === 'task_table' ||
        o.kind === 'action_result' ||
        o.kind === 'smarter_worksheet' ||
        o.kind === 'minitask_pick'
          ? o.kind
          : undefined,
      goalRows: Array.isArray(o.goalRows) ? (o.goalRows as GoalSnapRow[]) : undefined,
      taskRows: Array.isArray(o.taskRows) ? (o.taskRows as TaskSnapRow[]) : undefined,
      actionResults: Array.isArray(o.actionResults)
        ? (o.actionResults as Array<{ ok: boolean; message: string }>)
        : undefined,
      systemTone: o.systemTone === 'error' || o.systemTone === 'coach' ? o.systemTone : undefined,
      minitaskPick:
        o.minitaskPick &&
        typeof o.minitaskPick === 'object' &&
        typeof (o.minitaskPick as { goalId?: string }).goalId === 'string' &&
        Array.isArray((o.minitaskPick as { items?: unknown }).items)
          ? (o.minitaskPick as UiMsg['minitaskPick'])
          : undefined,
    };
  });
}

function formatGoalDeadlineShort(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  const s = typeof raw === 'string' ? raw : String(raw);
  return s.slice(0, 10);
}

async function fetchContextDigestLines(): Promise<string[] | null> {
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
      'Trabajo como coach SMARTER: puedo guiarte con preguntas para una meta en borrador, validarla (preview y confirm) antes de activarla, y proponer minitasks concretas o desbloquearlas con IA y plugins.'
    );
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
    return lines;
  } catch {
    return null;
  }
}

function upsertSnapshotPair(messages: UiMsg[], goalMsg: UiMsg, taskMsg: UiMsg): UiMsg[] {
  for (let i = messages.length - 2; i >= 0; i--) {
    const a = messages[i];
    const b = messages[i + 1];
    if (a?.kind === 'goal_snapshot' && b?.kind === 'task_table') {
      return [...messages.slice(0, i), goalMsg, taskMsg, ...messages.slice(i + 2)];
    }
  }
  return [...messages, goalMsg, taskMsg];
}

async function fetchSnapshotWidgets(): Promise<{ goalMsg: UiMsg; taskMsg: UiMsg } | null> {
  try {
    const [goals, tasks] = await Promise.all([
      apiRequest<
        Array<{
          id: string;
          title: string;
          status: string;
          deadline?: string | null;
          smarterScore?: { average: number } | null;
          miniTasks?: Array<{ status: string }>;
        }>
      >('/goals', { method: 'GET' }),
      apiRequest<
        Array<{
          id: string;
          title: string;
          status: string;
          goal?: { title?: string };
          deadline?: string | null;
        }>
      >('/minitasks', {
        method: 'GET',
      }),
    ]);
    const goalRows: GoalSnapRow[] = goals.slice(0, 14).map((g) => {
      const gp = calculateGoalProgress(g.miniTasks ?? []);
      return {
        id: g.id,
        title: g.title,
        status: g.status,
        deadline: formatGoalDeadlineShort(g.deadline ?? null),
        progressPercent: gp.total > 0 ? gp.percentage : null,
        scoreAverage: g.smarterScore?.average != null ? Math.round(g.smarterScore.average) : null,
      };
    });
    const taskRows: TaskSnapRow[] = tasks.slice(0, 18).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      goalTitle: t.goal?.title,
      deadline: formatGoalDeadlineShort(t.deadline ?? null),
    }));
    const stamp = new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
    return {
      goalMsg: {
        id: id(),
        role: 'system',
        content: `Metas · vista rápida (${stamp})`,
        kind: 'goal_snapshot',
        goalRows,
      },
      taskMsg: {
        id: id(),
        role: 'system',
        content: `Minitasks · vista rápida (${stamp})`,
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
  const [sessionsIndex, setSessionsIndex] = useState<SessionsIndex>({ activeSessionId: '', sessions: [] });
  const [activeSessionId, setActiveSessionId] = useState('');
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);
  const [coachMode, setCoachMode] = useState(true);
  const [coachStrict, setCoachStrict] = useState(false);
  const [viewRefreshBusy, setViewRefreshBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let idx = loadSessionsIndex(userId);
    if (!idx) idx = migrateLegacyChatToSessions(userId);
    if (!idx) idx = createInitialSessionsIndex();
    saveSessionsIndex(userId, idx);
    setSessionsIndex(idx);
    setActiveSessionId(idx.activeSessionId);
    const raw = loadSessionMessagesRaw(userId, idx.activeSessionId);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        const migrated = migrateLegacyMessages(parsed);
        setMessages(migrated ?? []);
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
    try {
      const coachRaw = localStorage.getItem(`smarter-agent-coach:${userId}`);
      if (coachRaw) {
        const o = JSON.parse(coachRaw) as { mode?: boolean; strict?: boolean };
        setCoachMode(o.mode !== false);
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
    if (!userId || !booted || !activeSessionId) return;
    try {
      saveSessionMessagesRaw(userId, activeSessionId, JSON.stringify(messages));
      const title = deriveSessionTitleFromMessages(messages);
      setSessionsIndex((prev) => {
        if (!prev.sessions.length) return prev;
        const next: SessionsIndex = {
          ...prev,
          activeSessionId,
          sessions: prev.sessions.map((s) =>
            s.id === activeSessionId ? { ...s, title, updatedAt: Date.now() } : s
          ),
        };
        saveSessionsIndex(userId, next);
        return next;
      });
    } catch {
      /* ignore */
    }
  }, [messages, userId, booted, activeSessionId]);

  const injectContextSummary = useCallback(async () => {
    const lines = await fetchContextDigestLines();
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      if (lines) return [{ id: id(), role: 'system', content: lines.join('\n') }];
      return [
        {
          id: id(),
          role: 'system',
          content: 'No se pudo cargar el resumen inicial. Podés escribirle al agente igualmente.',
        },
      ];
    });
  }, []);

  const mergeSnapshotsIntoChat = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['agent-today-panel'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    const [widgets, digestLines] = await Promise.all([fetchSnapshotWidgets(), fetchContextDigestLines()]);
    setMessages((prev) => {
      let next = prev;
      if (digestLines) {
        const idx = next.findIndex(
          (m) => m.role === 'system' && !m.kind && m.content.includes('Trabajo como coach SMARTER')
        );
        if (idx >= 0) {
          next = next.map((m, i) => (i === idx ? { ...m, content: digestLines.join('\n') } : m));
        }
      }
      if (widgets) {
        return upsertSnapshotPair(next, widgets.goalMsg, widgets.taskMsg);
      }
      return next;
    });
  }, [queryClient]);

  const refreshViewOnly = useCallback(async () => {
    setViewRefreshBusy(true);
    try {
      await mergeSnapshotsIntoChat();
    } finally {
      setViewRefreshBusy(false);
    }
  }, [mergeSnapshotsIntoChat]);

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

  const orderedSessions = useMemo(
    () => [...sessionsIndex.sessions].sort((a, b) => b.updatedAt - a.updatedAt),
    [sessionsIndex.sessions]
  );

  const switchToSession = useCallback(
    (nextId: string) => {
      if (!userId || nextId === activeSessionId) return;
      saveSessionMessagesRaw(userId, activeSessionId, JSON.stringify(messages));
      const nextIdx: SessionsIndex = { ...sessionsIndex, activeSessionId: nextId };
      saveSessionsIndex(userId, nextIdx);
      setSessionsIndex(nextIdx);
      setActiveSessionId(nextId);
      const raw = loadSessionMessagesRaw(userId, nextId);
      if (raw) {
        try {
          const migrated = migrateLegacyMessages(JSON.parse(raw) as unknown);
          setMessages(migrated ?? []);
        } catch {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    },
    [userId, activeSessionId, messages, sessionsIndex]
  );

  const startNewChat = useCallback(() => {
    if (!userId || !activeSessionId) return;
    saveSessionMessagesRaw(userId, activeSessionId, JSON.stringify(messages));
    const sid = newSessionId();
    const nextIdx: SessionsIndex = {
      activeSessionId: sid,
      sessions: [{ id: sid, title: 'Nuevo chat', updatedAt: Date.now() }, ...sessionsIndex.sessions],
    };
    saveSessionsIndex(userId, nextIdx);
    setSessionsIndex(nextIdx);
    setActiveSessionId(sid);
    setMessages([]);
    queueMicrotask(() => void injectContextSummary());
  }, [userId, activeSessionId, messages, sessionsIndex, injectContextSummary]);

  const removeCurrentSession = useCallback(() => {
    if (!userId || !activeSessionId) return;
    if (sessionsIndex.sessions.length <= 1) {
      setMessages([]);
      queueMicrotask(() => void injectContextSummary());
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('¿Eliminar este chat en este dispositivo?')) return;
    removeSessionMessages(userId, activeSessionId);
    const rest = sessionsIndex.sessions.filter((s) => s.id !== activeSessionId);
    const nextActive = rest[0].id;
    const nextIdx: SessionsIndex = { activeSessionId: nextActive, sessions: rest };
    saveSessionsIndex(userId, nextIdx);
    setSessionsIndex(nextIdx);
    setActiveSessionId(nextActive);
    const raw = loadSessionMessagesRaw(userId, nextActive);
    if (raw) {
      try {
        const migrated = migrateLegacyMessages(JSON.parse(raw) as unknown);
        setMessages(migrated ?? []);
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [userId, activeSessionId, sessionsIndex]);

  const insertSmarterWorksheetCard = useCallback(() => {
    setMessages((p) => [
      ...p,
      {
        id: id(),
        role: 'system',
        content:
          'Cuestionario SMARTER en el chat: completá cada criterio del grid; se guarda en tu meta DRAFT y podés pedir validación preview al agente.',
        kind: 'smarter_worksheet',
        systemTone: 'coach',
      },
    ]);
  }, []);

  const sendUserMessage = async (presetText?: string) => {
    const rawInput = presetText ?? input;
    const text = rawInput.trim();
    if (!text || loading || hasOpenProposals) return;
    if (presetText === undefined) setInput('');

    const userMsg: UiMsg = { id: id(), role: 'user', content: text };
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
        await mergeSnapshotsIntoChat();
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
          systemTone: 'error',
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
        const actionResults = res.results.map((r) => ({
          ok: r.ok,
          message: friendlyAgentToolMessage(r.message),
        }));
        const hadOk = res.results.some((r) => r.ok);
        const previewExtra = res.results.find((r) => r.ok && r.extras?.kind === 'validate_goal_preview')?.extras;

        setMessages((prev) => {
          const cleared = prev.map((m) => (m.id === msgId ? { ...m, proposals: undefined } : m));
          const withResult = cleared.concat({
            id: id(),
            role: 'system',
            content: 'Resultado de las acciones',
            kind: 'action_result',
            actionResults,
          });
          if (
            previewExtra &&
            previewExtra.kind === 'validate_goal_preview' &&
            typeof previewExtra.goalId === 'string' &&
            Array.isArray(previewExtra.suggestedMiniTasks)
          ) {
            return withResult.concat({
              id: id(),
              role: 'system',
              content: 'Minitasks sugeridas — elegí cuáles enviar a confirmación SMARTER',
              kind: 'minitask_pick',
              systemTone: 'coach',
              minitaskPick: {
                goalId: previewExtra.goalId,
                feedback: typeof previewExtra.feedback === 'string' ? previewExtra.feedback : undefined,
                items: previewExtra.suggestedMiniTasks as MinitaskPickItem[],
              },
            });
          }
          return withResult;
        });
        if (hadOk) {
          await mergeSnapshotsIntoChat();
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
          systemTone: 'error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col min-h-0 pb-2 md:max-w-xl">
      <AgentTodayPanel />
      <div className="mx-3 flex flex-wrap items-center gap-2 border-b border-border/50 py-2">
        <label htmlFor="agent-session-select" className="sr-only">
          Conversación
        </label>
        <select
          id="agent-session-select"
          value={activeSessionId}
          onChange={(e) => switchToSession(e.target.value)}
          disabled={!booted || orderedSessions.length === 0}
          className="h-8 min-w-0 max-w-[min(100%,14rem)] flex-1 rounded-md border border-input bg-background px-2 text-xs"
        >
          {orderedSessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title || 'Chat'}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1 px-2 text-xs"
          disabled={!booted || loading}
          onClick={() => startNewChat()}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
          Nuevo chat
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 px-2 text-xs text-destructive hover:text-destructive"
          disabled={!booted || loading}
          onClick={() => removeCurrentSession()}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Eliminar
        </Button>
      </div>
      <div className="mx-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/50 py-2">
        <div className="flex items-center gap-2">
          <Switch id={coachModeId} checked={coachMode} onCheckedChange={setCoachMode} />
          <Label htmlFor={coachModeId} className="text-[11px] font-normal cursor-pointer">
            Coach extendido (más preguntas antes de guardar)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id={coachStrictId} checked={coachStrict} onCheckedChange={setCoachStrict} />
          <Label htmlFor={coachStrictId} className="text-[11px] font-normal cursor-pointer">
            Ejecución estricta
          </Label>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 gap-1 px-2 text-xs shrink-0"
          disabled={loading || hasOpenProposals}
          onClick={() => insertSmarterWorksheetCard()}
        >
          <ClipboardList className="h-3.5 w-3.5" aria-hidden />
          Grid SMARTER
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2 text-xs shrink-0"
          disabled={!booted || loading || hasOpenProposals || viewRefreshBusy}
          onClick={() => void refreshViewOnly()}
          aria-busy={viewRefreshBusy}
        >
          {viewRefreshBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          )}
          Refrescar vista
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                m.role === 'user' && 'bg-primary text-primary-foreground',
                m.role === 'assistant' && 'bg-muted',
                m.role === 'system' &&
                  m.systemTone === 'error' &&
                  'bg-destructive/10 text-destructive-foreground border border-destructive/30 text-xs',
                m.role === 'system' &&
                  m.systemTone === 'coach' &&
                  'bg-sky-500/10 text-sky-950 dark:text-sky-100 border border-sky-500/25 text-xs',
                m.role === 'system' &&
                  !m.systemTone &&
                  'bg-amber-500/15 text-amber-950 dark:text-amber-100 border border-amber-500/30 text-xs'
              )}
            >
              {m.kind === 'goal_snapshot' && m.goalRows && m.goalRows.length > 0 ? (
                <AgentGoalSnapshotTable rows={m.goalRows} titleLine={m.content} />
              ) : m.kind === 'task_table' && m.taskRows && m.taskRows.length > 0 ? (
                <AgentTaskSnapshotTable rows={m.taskRows} titleLine={m.content} />
              ) : m.kind === 'smarter_worksheet' ? (
                <div className="space-y-3">
                  <p className="font-medium text-sm leading-snug text-amber-950 dark:text-amber-50">{m.content}</p>
                  <SmarterWorksheetWidget
                    disabled={loading || hasOpenProposals}
                    onAfterApply={(prompt) => {
                      void (async () => {
                        await mergeSnapshotsIntoChat();
                        await sendUserMessage(prompt);
                      })();
                    }}
                  />
                </div>
              ) : m.kind === 'minitask_pick' && m.minitaskPick ? (
                <div className="space-y-3">
                  <p className="font-medium text-sm leading-snug text-amber-950 dark:text-amber-50">{m.content}</p>
                  <MinitaskPickWidget
                    goalId={m.minitaskPick.goalId}
                    feedback={m.minitaskPick.feedback}
                    items={m.minitaskPick.items}
                    disabled={loading || hasOpenProposals}
                    onRequestConfirm={(prompt) => void sendUserMessage(prompt)}
                  />
                </div>
              ) : m.kind === 'action_result' && m.actionResults && m.actionResults.length > 0 ? (
                <AgentActionResultList title={m.content} results={m.actionResults} />
              ) : (
                <>
                  {m.systemTone === 'error' ? (
                    <p className="flex gap-2 items-start font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                      <span>{m.content}</span>
                    </p>
                  ) : (
                    m.content
                  )}
                </>
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
        <p className="text-[10px] text-muted-foreground px-0.5">Plantillas (un toque para enviar al agente)</p>
        <div className="grid grid-cols-2 min-[520px]:grid-cols-3 min-[720px]:grid-cols-5 gap-2">
          {AGENT_CHAT_SHORTCUTS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={loading || hasOpenProposals}
              onClick={() => void sendUserMessage(s.prompt)}
              className={cn(
                'rounded-lg border border-border bg-card px-2.5 py-2 text-left transition-colors',
                'hover:bg-accent/60 disabled:opacity-50 disabled:pointer-events-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <span className="block text-xs font-medium text-foreground">{s.title}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground leading-snug">{s.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentActionResultList({ title, results }: { title: string; results: Array<{ ok: boolean; message: string }> }) {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-amber-950 dark:text-amber-50">{title}</p>
      <ul className="space-y-2">
        {results.map((r, i) => (
          <li
            key={i}
            className={cn(
              'flex gap-2 rounded-lg border px-2.5 py-2 text-[11px] leading-snug',
              r.ok
                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50'
                : 'border-destructive/35 bg-destructive/10 text-destructive dark:text-destructive-foreground'
            )}
          >
            {r.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
            )}
            <span>{r.message}</span>
          </li>
        ))}
      </ul>
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
              <th className="px-2 py-1 font-medium">Plazo</th>
              <th className="px-2 py-1 font-medium min-w-[5rem]">Progreso</th>
              <th className="px-2 py-1 font-medium">SMARTER</th>
              <th className="px-2 py-1 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/40 last:border-0">
                <td className="px-2 py-1 align-top">
                  <Link href={`/goals/${r.id}`} className="text-primary underline-offset-2 hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-2 py-1 text-muted-foreground align-top whitespace-nowrap">{r.deadline ?? '—'}</td>
                <td className="px-2 py-1 align-top">
                  {r.progressPercent != null ? (
                    <div className="space-y-0.5 min-w-[4.5rem]">
                      <div className="h-1.5 w-full max-w-[6rem] rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/80"
                          style={{ width: `${Math.min(100, Math.max(0, r.progressPercent))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{r.progressPercent}%</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-2 py-1 text-muted-foreground align-top whitespace-nowrap">
                  {r.scoreAverage != null ? `${r.scoreAverage}` : '—'}
                </td>
                <td className="px-2 py-1 text-muted-foreground align-top">{r.status}</td>
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
              <th className="px-2 py-1 font-medium">Plazo</th>
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
                <td className="px-2 py-1 text-muted-foreground whitespace-nowrap">{r.deadline ?? '—'}</td>
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
