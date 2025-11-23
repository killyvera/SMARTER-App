import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { findMiniTasksByUser } from '@/repositories/miniTaskRepository';
import { findMiniTaskJournalEntryByDate } from '@/repositories/miniTaskJournalRepository';
import { startOfDay, format, parse } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const today = startOfDay(new Date());
    
    // Obtener todas las minitasks del usuario
    const allMiniTasks = await findMiniTasksByUser(userId);
    
    // Filtrar minitasks que:
    // 1. Están desbloqueadas
    // 2. Tienen plugin calendar o reminder con alarmas configuradas
    // 3. Están en estado PENDING o IN_PROGRESS
    // 4. No tienen entrada del journal para hoy (si es diaria)
    const pendingTasks = [];
    
    for (const miniTask of allMiniTasks) {
      // Solo procesar minitasks desbloqueadas y activas
      if (!miniTask.unlocked || (miniTask.status !== 'PENDING' && miniTask.status !== 'IN_PROGRESS')) {
        continue;
      }

      // Buscar plugins con alarmas (calendar o reminder)
      const plugins = (miniTask as any).plugins || [];
      
      for (const plugin of plugins) {
        if (!plugin.enabled) continue;
        
        let shouldAlert = false;
        let alarmTime: string | undefined;
        
        // Plugin Calendar
        if (plugin.pluginId === 'calendar' && plugin.config) {
          const config = typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config;
          
          // Obtener múltiples alarmas (migrar de alarmTime si existe)
          const alarmTimes = config.alarmTimes || (config.alarmTime ? [config.alarmTime] : []);
          
          // Verificar frecuencia
          const frequency = config.frequency || 'daily';
          const checklistEnabled = config.checklistEnabled || false;
          
          // Verificar si ya hay entrada del journal para hoy
          const todayEntry = await findMiniTaskJournalEntryByDate(miniTask.id, today);
          
          if (frequency === 'daily' || frequency === 'diaria') {
            if (checklistEnabled) {
              // Si el checklist está habilitado, verificar si está completado
              if (!todayEntry || !todayEntry.checklistCompleted) {
                shouldAlert = true;
                // Usar la primera alarma o la hora actual aproximada
                alarmTime = alarmTimes.length > 0 ? alarmTimes[0] : '09:00';
              }
            } else {
              // Sin checklist, verificar si hay entrada
              if (!todayEntry) {
                shouldAlert = true;
                alarmTime = alarmTimes.length > 0 ? alarmTimes[0] : '09:00';
              }
            }
          } else if (frequency === 'weekly' || frequency === 'semanal') {
            // Verificar si es el día de la semana configurado
            const dayOfWeek = today.getDay();
            const daysOfWeek = config.daysOfWeek || [1]; // Por defecto lunes
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
          
          // Si hay múltiples alarmas, crear una entrada por cada alarma pendiente
          if (shouldAlert && alarmTimes.length > 1) {
            const now = new Date();
            const currentHour = format(now, 'HH:mm');
            
            // Verificar cada hora de alarma
            for (const time of alarmTimes) {
              const alarmDate = parse(time, 'HH:mm', new Date());
              const alarmHour = format(alarmDate, 'HH:mm');
              
              // Si la hora de alarma coincide o ya pasó hoy, agregar como pendiente
              if (alarmHour <= currentHour || alarmHour === currentHour) {
                pendingTasks.push({
                  id: miniTask.id,
                  title: miniTask.title,
                  goalTitle: (miniTask as any).goal?.title,
                  alarmTime: time,
                  pluginId: plugin.pluginId,
                  checklistEnabled,
                  checklistCompleted: todayEntry?.checklistCompleted || false,
                });
              }
            }
            shouldAlert = false; // Ya se agregaron las alarmas
          }
        }
        
        // Plugin Reminder
        if (plugin.pluginId === 'reminder' && plugin.config) {
          const config = typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config;
          const reminderTimes = config.reminderTimes || [];
          
          if (reminderTimes.length > 0) {
            const now = new Date();
            const currentHour = format(now, 'HH:mm');
            
            // Verificar cada hora de recordatorio
            for (const reminderTime of reminderTimes) {
              const reminderDate = parse(reminderTime, 'HH:mm', new Date());
              const reminderHour = format(reminderDate, 'HH:mm');
              
              // Si la hora coincide o ya pasó hoy, agregar como pendiente
              if (reminderHour <= currentHour || reminderHour === currentHour) {
                pendingTasks.push({
                  id: miniTask.id,
                  title: miniTask.title,
                  goalTitle: (miniTask as any).goal?.title,
                  alarmTime: reminderTime,
                  pluginId: plugin.pluginId,
                  message: config.message,
                });
              }
            }
            shouldAlert = false; // Ya se agregaron los recordatorios
          }
        }
        
        if (shouldAlert) {
          pendingTasks.push({
            id: miniTask.id,
            title: miniTask.title,
            goalTitle: (miniTask as any).goal?.title,
            alarmTime,
            pluginId: plugin.pluginId,
            checklistEnabled: plugin.pluginId === 'calendar' ? (typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config)?.checklistEnabled : false,
            checklistCompleted: plugin.pluginId === 'calendar' ? (await findMiniTaskJournalEntryByDate(miniTask.id, today))?.checklistCompleted : false,
          });
          break; // Solo agregar una vez por minitask si no se agregaron múltiples alarmas
        }
      }
    }
    
    return NextResponse.json(pendingTasks);
  } catch (error) {
    console.error('Error al obtener tareas pendientes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener tareas pendientes' },
      { status: 500 }
    );
  }
}

