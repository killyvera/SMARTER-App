'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type UiProposal = {
  toolCallId: string;
  name: string;
  arguments: string;
  displayLabel: string;
  approvalToken: string;
};

type UiMsg = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  proposals?: UiProposal[];
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

function storageKey(userId: string) {
  return `smarter-agent-chat-v1:${userId}`;
}

export function AgentHomePage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as UiMsg[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
    setBooted(true);
  }, [userId]);

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
        body: JSON.stringify({ mode: 'chat', messages: nextHistory }),
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
      setMessages((prev) => [
        ...prev,
        {
          id: id(),
          role: 'system',
          content: e instanceof Error ? e.message : 'Error al contactar al agente',
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
        }),
      });

      if (res.type === 'execute_result') {
        const summary = res.results.map((r) => `${r.ok ? '✓' : '✗'} ${r.message}`).join('\n');
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, proposals: undefined } : m)).concat({
            id: id(),
            role: 'system',
            content: `Resultado de acciones:\n${summary}`,
          })
        );
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: id(),
          role: 'system',
          content: e instanceof Error ? e.message : 'Error al ejecutar acciones',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 pb-2">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
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
              {m.content}
              {m.proposals && m.proposals.length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-border/50 pt-2">
                  {m.proposals.map((p) => (
                    <div key={p.toolCallId} className="rounded-lg bg-background/80 p-2 text-xs text-foreground">
                      <div className="font-medium">{p.displayLabel}</div>
                      <pre className="mt-1 max-h-24 overflow-auto text-[10px] opacity-80">{p.arguments}</pre>
                    </div>
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
