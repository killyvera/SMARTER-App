import { findMiniTasksByUser } from '@/repositories/miniTaskRepository';
import { findMiniTaskJournalEntryByDate } from '@/repositories/miniTaskJournalRepository';
import { startOfDay, format, parse } from 'date-fns';

export interface PendingTaskToday {
  id: string;
  title: string;
  goalTitle?: string;
  alarmTime?: string;
  pluginId: string;
  checklistEnabled?: boolean;
  checklistCompleted?: boolean;
  message?: string;
}

/**
 * Misma lógica que GET /api/alarms/pending-today (plugins calendar/reminder).
 */
export async function getPendingTasksForToday(userId: string): Promise<PendingTaskToday[]> {
  const today = startOfDay(new Date());
  const allMiniTasks = await findMiniTasksByUser(userId);
  const pendingTasks: PendingTaskToday[] = [];

  for (const miniTask of allMiniTasks) {
    if (!miniTask.unlocked || (miniTask.status !== 'PENDING' && miniTask.status !== 'IN_PROGRESS')) {
      continue;
    }

    const plugins = (miniTask as { plugins?: Array<{ pluginId: string; enabled: boolean; config: unknown }> }).plugins || [];

    for (const plugin of plugins) {
      if (!plugin.enabled) continue;

      let shouldAlert = false;
      let alarmTime: string | undefined;

      if (plugin.pluginId === 'calendar' && plugin.config) {
        const config =
          typeof plugin.config === 'string' ? JSON.parse(plugin.config as string) : (plugin.config as Record<string, unknown>);

        const alarmTimes = (config.alarmTimes as string[] | undefined) || (config.alarmTime ? [config.alarmTime as string] : []);
        const frequency = (config.frequency as string) || 'daily';
        const checklistEnabled = Boolean(config.checklistEnabled);

        const todayEntry = await findMiniTaskJournalEntryByDate(miniTask.id, today);

        if (frequency === 'daily' || frequency === 'diaria') {
          if (checklistEnabled) {
            if (!todayEntry || !todayEntry.checklistCompleted) {
              shouldAlert = true;
              alarmTime = alarmTimes.length > 0 ? alarmTimes[0] : '09:00';
            }
          } else {
            if (!todayEntry) {
              shouldAlert = true;
              alarmTime = alarmTimes.length > 0 ? alarmTimes[0] : '09:00';
            }
          }
        } else if (frequency === 'weekly' || frequency === 'semanal') {
          const dayOfWeek = today.getDay();
          const daysOfWeek = (config.daysOfWeek as number[] | undefined) || [1];
          if (daysOfWeek.includes(dayOfWeek)) {
            if (checklistEnabled) {
              if (!todayEntry || !todayEntry.checklistCompleted) {
                shouldAlert = true;
                alarmTime = alarmTimes.length > 0 ? alarmTimes[0] : '09:00';
              }
            } else {
              if (!todayEntry) {
                shouldAlert = true;
                alarmTime = alarmTimes.length > 0 ? alarmTimes[0] : '09:00';
              }
            }
          }
        }

        if (shouldAlert && alarmTimes.length > 1) {
          const now = new Date();
          const currentHour = format(now, 'HH:mm');

          for (const time of alarmTimes) {
            const alarmDate = parse(time, 'HH:mm', new Date());
            const alarmHour = format(alarmDate, 'HH:mm');

            if (alarmHour <= currentHour || alarmHour === currentHour) {
              pendingTasks.push({
                id: miniTask.id,
                title: miniTask.title,
                goalTitle: (miniTask as { goal?: { title?: string } }).goal?.title,
                alarmTime: time,
                pluginId: plugin.pluginId,
                checklistEnabled,
                checklistCompleted: todayEntry?.checklistCompleted || false,
              });
            }
          }
          shouldAlert = false;
        }
      }

      if (plugin.pluginId === 'reminder' && plugin.config) {
        const config =
          typeof plugin.config === 'string' ? JSON.parse(plugin.config as string) : (plugin.config as Record<string, unknown>);
        const reminderTimes = (config.reminderTimes as string[]) || [];

        if (reminderTimes.length > 0) {
          const now = new Date();
          const currentHour = format(now, 'HH:mm');

          for (const reminderTime of reminderTimes) {
            const reminderDate = parse(reminderTime, 'HH:mm', new Date());
            const reminderHour = format(reminderDate, 'HH:mm');

            if (reminderHour <= currentHour || reminderHour === currentHour) {
              pendingTasks.push({
                id: miniTask.id,
                title: miniTask.title,
                goalTitle: (miniTask as { goal?: { title?: string } }).goal?.title,
                alarmTime: reminderTime,
                pluginId: plugin.pluginId,
                message: config.message as string | undefined,
              });
            }
          }
          shouldAlert = false;
        }
      }

      if (shouldAlert) {
        const goal = (miniTask as { goal?: { title?: string } }).goal;
        let calConfig: Record<string, unknown> = {};
        if (plugin.pluginId === 'calendar' && plugin.config) {
          calConfig =
            typeof plugin.config === 'string' ? JSON.parse(plugin.config as string) : (plugin.config as Record<string, unknown>);
        }
        const todayEntryForCheck = await findMiniTaskJournalEntryByDate(miniTask.id, today);
        pendingTasks.push({
          id: miniTask.id,
          title: miniTask.title,
          goalTitle: goal?.title,
          alarmTime,
          pluginId: plugin.pluginId,
          checklistEnabled: plugin.pluginId === 'calendar' ? Boolean(calConfig.checklistEnabled) : false,
          checklistCompleted:
            plugin.pluginId === 'calendar' ? Boolean(todayEntryForCheck?.checklistCompleted) : false,
        });
        break;
      }
    }
  }

  return pendingTasks;
}
