import { getPendingTasksForToday } from '@/services/pendingAlarmsService';
import { findMiniTasksByUser } from '@/repositories/miniTaskRepository';
import { findMiniTaskJournalEntryByDate } from '@/repositories/miniTaskJournalRepository';
import { getJournalMetrics } from '@/repositories/miniTaskJournalRepository';
import { startOfDay } from 'date-fns';
import type { MiniTask } from '@/types/miniTask';

type MiniTaskWithRelations = MiniTask & {
  goal?: { title?: string };
  plugins?: Array<{ pluginId: string; enabled: boolean; config: unknown }>;
};

export interface TodayPanelAlarmRow {
  miniTaskId: string;
  title: string;
  goalTitle?: string;
  alarmTime?: string;
  pluginId: string;
  message?: string;
}

export interface TodayPanelChecklistRow {
  miniTaskId: string;
  title: string;
  goalTitle?: string;
  checklistLabel?: string;
  checklistType: string;
  doneToday: boolean;
  journalEntryId?: string;
  /** daily checklist en journal; single/multi requieren pantalla detalle */
  interactiveDaily: boolean;
}

export interface TodayPanelMetricsHint {
  miniTaskId: string;
  title: string;
  totalEntries: number;
  daysWithEntries: number;
  /** Promedio de progressValue en entradas con dato (0 si no hay) */
  avgProgress: number;
  /** Últimos puntos de progressValue con fecha (para mini gráfico en el panel Hoy) */
  sparkline?: Array<{ date: string; value: number }>;
}

export interface TodayPanelPayload {
  alarms: TodayPanelAlarmRow[];
  checklists: TodayPanelChecklistRow[];
  metricsHints: TodayPanelMetricsHint[];
}

const MAX_CHECKLIST_SCAN = 24;
const MAX_METRICS = 5;

function parsePluginConfig(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return raw as Record<string, unknown>;
}

export async function buildTodayPanelPayload(userId: string): Promise<TodayPanelPayload> {
  const today = startOfDay(new Date());
  const rawAlarms = await getPendingTasksForToday(userId);

  const seenAlarm = new Set<string>();
  const alarms: TodayPanelAlarmRow[] = [];
  for (const a of rawAlarms) {
    const key = `${a.id}-${a.alarmTime ?? ''}-${a.pluginId}`;
    if (seenAlarm.has(key)) continue;
    seenAlarm.add(key);
    alarms.push({
      miniTaskId: a.id,
      title: a.title,
      goalTitle: a.goalTitle,
      alarmTime: a.alarmTime,
      pluginId: a.pluginId,
      message: a.message,
    });
  }

  const tasks = (await findMiniTasksByUser(userId)) as MiniTaskWithRelations[];
  const checklists: TodayPanelChecklistRow[] = [];

  for (const t of tasks) {
    if (checklists.length >= MAX_CHECKLIST_SCAN) break;
    if (!t.unlocked || (t.status !== 'PENDING' && t.status !== 'IN_PROGRESS')) continue;

    const plugins = t.plugins || [];
    const cal = plugins.find((p) => p.pluginId === 'calendar' && p.enabled);
    if (!cal?.config) continue;

    const config = parsePluginConfig(cal.config);
    if (!config.checklistEnabled) continue;

    const checklistType = (config.checklistType as string) || 'daily';
    const todayEntry = await findMiniTaskJournalEntryByDate(t.id, today);

    checklists.push({
      miniTaskId: t.id,
      title: t.title,
      goalTitle: t.goal?.title,
      checklistLabel: (config.checklistLabel as string) || undefined,
      checklistType,
      doneToday: Boolean(todayEntry?.checklistCompleted),
      journalEntryId: todayEntry?.id,
      interactiveDaily: checklistType === 'daily',
    });
  }

  const metricsHints: TodayPanelMetricsHint[] = [];
  const forMetrics = checklists.slice(0, MAX_METRICS);
  await Promise.all(
    forMetrics.map(async (c) => {
      try {
        const m = await getJournalMetrics(c.miniTaskId);
        const sparkline = m.progressByDate.slice(-14).map((p) => ({ date: p.date, value: p.value }));
        metricsHints.push({
          miniTaskId: c.miniTaskId,
          title: c.title,
          totalEntries: m.totalEntries,
          daysWithEntries: m.daysWithEntries,
          avgProgress: Math.round(m.avgProgress * 10) / 10,
          ...(sparkline.length >= 2 ? { sparkline } : {}),
        });
      } catch {
        /* ignore */
      }
    })
  );

  return { alarms, checklists, metricsHints };
}
