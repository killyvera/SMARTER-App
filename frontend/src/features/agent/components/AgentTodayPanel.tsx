'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, CalendarCheck, ChevronDown, ChevronUp, LineChart } from 'lucide-react';
import { useState } from 'react';
import { LineChart as RechartsLine, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { TodayPanelPayload } from '@/services/agentTodayPanelService';
import { useCreateMiniTaskJournalEntry, useUpdateMiniTaskJournalEntry } from '@/features/minitasks/hooks/useMiniTaskJournal';
import { startOfDay } from 'date-fns';

export function AgentTodayPanel() {
  const [open, setOpen] = useState(true);
  const queryClient = useQueryClient();
  const today = startOfDay(new Date());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['agent-today-panel'],
    queryFn: () => apiRequest<TodayPanelPayload>('/agent/today-panel', { method: 'GET' }),
    staleTime: 60_000,
  });

  const hasContent =
    !!data && (data.alarms.length > 0 || data.checklists.length > 0 || data.metricsHints.length > 0);

  return (
    <Card className="mx-3 mt-2 shrink-0 border-dashed">
      <CardHeader className="py-2 px-3 pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
            Hoy
            <span className="text-[10px] font-normal text-muted-foreground">
              {format(new Date(), "EEE d MMM", { locale: es })}
            </span>
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px]"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>
      {open ? (
        <CardContent className="px-3 pt-2 pb-3 space-y-3 text-xs">
          {isLoading ? (
            <p className="text-muted-foreground">Cargando alarmas y checklist…</p>
          ) : isError ? (
            <p className="text-destructive">No se pudo cargar el panel.</p>
          ) : !hasContent ? (
            <p className="text-muted-foreground">No hay alarmas ni checklists para hoy.</p>
          ) : (
            <>
              {data!.alarms.length > 0 ? (
                <section>
                  <h3 className="flex items-center gap-1 font-medium text-[11px] mb-1.5">
                    <Bell className="h-3 w-3" />
                    Alarmas / pendientes
                  </h3>
                  <ul className="space-y-1">
                    {data!.alarms.map((a) => (
                      <li key={`${a.miniTaskId}-${a.alarmTime}-${a.pluginId}`} className="rounded-md bg-muted/50 px-2 py-1">
                        <Link
                          href={`/minitasks/${a.miniTaskId}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {a.title}
                        </Link>
                        {a.goalTitle ? (
                          <span className="text-muted-foreground"> · {a.goalTitle}</span>
                        ) : null}
                        {a.alarmTime ? (
                          <span className="block text-[10px] text-muted-foreground">{a.alarmTime}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {data!.checklists.length > 0 ? (
                <section>
                  <h3 className="font-medium text-[11px] mb-1.5">Checklist</h3>
                  <ul className="space-y-2">
                    {data!.checklists.map((c) => (
                      <li key={c.miniTaskId} className="rounded-md border border-border/60 px-2 py-1.5 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/minitasks/${c.miniTaskId}`} className="font-medium hover:underline">
                              {c.title}
                            </Link>
                            {c.goalTitle ? (
                              <span className="text-muted-foreground"> · {c.goalTitle}</span>
                            ) : null}
                            {c.checklistLabel ? (
                              <p className="text-[10px] text-muted-foreground">{c.checklistLabel}</p>
                            ) : null}
                          </div>
                          {c.interactiveDaily ? (
                            <DailyCheckToggle
                              miniTaskId={c.miniTaskId}
                              doneToday={c.doneToday}
                              journalEntryId={c.journalEntryId}
                              today={today}
                              onSettled={() => queryClient.invalidateQueries({ queryKey: ['agent-today-panel'] })}
                            />
                          ) : (
                            <Button variant="outline" size="sm" className="h-7 text-[10px] shrink-0" asChild>
                              <Link href={`/minitasks/${c.miniTaskId}`}>Abrir</Link>
                            </Button>
                          )}
                        </div>
                        {!c.interactiveDaily ? (
                          <p className="text-[10px] text-muted-foreground">
                            Tipo «{c.checklistType}»: gestioná el checklist en la pantalla de la tarea.
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {data!.metricsHints.length > 0 ? (
                <section>
                  <h3 className="flex items-center gap-1 font-medium text-[11px] mb-1.5">
                    <LineChart className="h-3 w-3" />
                    Bitácora / métricas
                  </h3>
                  <ul className="space-y-1">
                    {data!.metricsHints.map((m) => (
                      <li key={m.miniTaskId} className="text-[10px] space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                          <span className="truncate min-w-0 flex-1 font-medium text-foreground">{m.title}</span>
                          <span className="text-muted-foreground shrink-0">
                            {m.totalEntries} ent. · {m.daysWithEntries} días
                            {m.avgProgress > 0 ? ` · progr. ~${m.avgProgress}` : ''}
                          </span>
                          <Link
                            href={`/minitasks/${m.miniTaskId}`}
                            className={cn('text-primary shrink-0 hover:underline')}
                          >
                            Métricas
                          </Link>
                        </div>
                        {m.sparkline && m.sparkline.length >= 2 ? (
                          <JournalSparkline points={m.sparkline} />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}

function JournalSparkline({ points }: { points: Array<{ date: string; value: number }> }) {
  const chartData = points.map((p, i) => ({
    idx: i,
    date: p.date,
    value: p.value,
  }));
  return (
    <div className="h-9 w-full max-w-[14rem]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine data={chartData} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <div className="rounded border border-border bg-popover px-2 py-1 text-[10px] shadow-sm">
                  <span className="text-muted-foreground">{(payload[0].payload as { date: string }).date}</span>
                  <span className="ml-2 font-medium">{Number(payload[0].value).toFixed(1)}</span>
                </div>
              ) : null
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
}

function DailyCheckToggle({
  miniTaskId,
  doneToday,
  journalEntryId,
  today,
  onSettled,
}: {
  miniTaskId: string;
  doneToday: boolean;
  journalEntryId?: string;
  today: Date;
  onSettled: () => void;
}) {
  const createEntry = useCreateMiniTaskJournalEntry();
  const updateEntry = useUpdateMiniTaskJournalEntry();
  const busy = createEntry.isPending || updateEntry.isPending;

  const toggle = async () => {
    const next = !doneToday;
    try {
      if (journalEntryId) {
        await updateEntry.mutateAsync({
          miniTaskId,
          entryId: journalEntryId,
          data: { checklistCompleted: next },
        });
      } else {
        await createEntry.mutateAsync({
          miniTaskId,
          data: { entryDate: today, checklistCompleted: next },
        });
      }
    } finally {
      onSettled();
    }
  };

  return (
    <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
      <Checkbox checked={doneToday} disabled={busy} onCheckedChange={() => void toggle()} />
      <span className="text-[10px] text-muted-foreground">Hecho</span>
    </label>
  );
}
