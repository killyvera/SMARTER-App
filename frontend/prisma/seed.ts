import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');
  console.log('🗑️  Limpiando base de datos...');
  
  // Fecha de referencia para datos históricos
  const today = new Date();

  // Limpiar TODA la base de datos en orden correcto (respetando foreign keys)
  // Usar try-catch para manejar tablas que pueden no existir aún
  try {
    await prisma.miniTaskJournalEntry.deleteMany({});
  } catch (e: any) {
    if (e.code !== 'P2021') throw e; // P2021 = tabla no existe
  }
  try {
    await prisma.miniTaskMetric.deleteMany({});
  } catch (e: any) {
    if (e.code !== 'P2021') throw e;
  }
  try {
    await prisma.miniTaskPlugin.deleteMany({});
  } catch (e: any) {
    if (e.code !== 'P2021') throw e;
  }
  await prisma.suggestedMiniTask.deleteMany({});
  await prisma.readjustment.deleteMany({});
  await prisma.miniTaskScore.deleteMany({});
  await prisma.miniTask.deleteMany({});
  await prisma.smarterScore.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Base de datos limpiada');

  // Crear usuario local por defecto
  const defaultEmail = 'user@local';
  const defaultPassword = 'password123';

  const passwordHash = await hashPassword(defaultPassword);
  const user = await prisma.user.create({
    data: {
      email: defaultEmail,
      passwordHash,
    },
  });
  console.log('✅ Usuario creado:', user.email);

  // ============================================
  // GOAL 1: COMPLETADA - Con score, minitasks completadas, checkins
  // ============================================
  const goal1 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Completar certificación en React y Next.js',
      description: 'Obtener la certificación oficial de React y Next.js completando todos los módulos y proyectos requeridos',
      status: 'COMPLETED',
      deadline: new Date('2024-11-15'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-11-15'),
    },
  });

  // Score para goal completado
  await prisma.smarterScore.create({
    data: {
      goalId: goal1.id,
      specific: 95,
      measurable: 90,
      achievable: 85,
      relevant: 95,
      timebound: 90,
      evaluate: 88,
      readjust: 85,
      average: 89.7,
      passed: true,
    },
  });

  // Minitasks completadas para goal1 - DESBLOQUEADA CON PLUGINS Y JOURNAL
  const mt1_1 = await prisma.miniTask.create({
    data: {
      goalId: goal1.id,
      title: 'Completar módulo de React Fundamentals',
      description: 'Terminar todos los ejercicios y proyectos del módulo básico',
      status: 'COMPLETED',
      deadline: new Date('2024-02-28'),
      unlocked: true,
      order: 0, // Primera minitask
      priority: 'high',
      schedulingType: 'parallel',
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date('2024-01-20').toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'daily', alarmTimes: ['09:00'], checklistEnabled: true, checklistLabel: 'Completar estudio diario de React' } },
          { id: 'chart', config: { enabled: true, chartType: 'line', metricType: 'horas-estudiadas', timeRange: 'week' } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 40, unit: 'horas' } },
          { id: 'reminder', config: { enabled: true, reminderTimes: ['09:00', '18:00'] } },
        ],
      }),
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-02-25'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt1_1.id,
      specific: 90,
      measurable: 85,
      achievable: 90,
      relevant: 95,
      timebound: 88,
      average: 89.6,
      passed: true,
    },
  });

  // Plugins para mt1_1
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_1.id,
      pluginId: 'calendar',
      config: JSON.stringify({ enabled: true, frequency: 'daily', alarmTimes: ['09:00'], checklistEnabled: true, checklistLabel: 'Completar estudio diario de React' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_1.id,
      pluginId: 'chart',
      config: JSON.stringify({ enabled: true, chartType: 'line', metricType: 'horas-estudiadas', timeRange: 'week' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_1.id,
      pluginId: 'progress-tracker',
      config: JSON.stringify({ enabled: true, targetValue: 40, unit: 'horas' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_1.id,
      pluginId: 'reminder',
      config: JSON.stringify({ enabled: true, reminderTimes: ['09:00', '18:00'] }),
      enabled: true,
    },
  });

  // Métricas históricas para mt1_1 (36 días - desde 2024-01-20 hasta 2024-02-25)
  const baseDate1 = new Date('2024-01-20');
  let totalHours1_1 = 0;
  
  for (let i = 0; i < 36; i++) {
    const date = new Date(baseDate1);
    date.setDate(date.getDate() + i);
    date.setHours(9 + Math.floor(Math.random() * 3), 0, 0, 0); // Entre 09:00 y 12:00
    
    // Progresión realista: empezar con 1.5-2 horas, aumentar gradualmente
    const progressFactor = i / 36; // 0 a 1
    const baseHours = 1.5 + progressFactor * 1.5; // 1.5 a 3.0
    const hours = baseHours + (Math.random() - 0.5) * 0.7; // Variación ±0.35
    const clampedHours = Math.max(1.0, Math.min(4.0, hours));
    totalHours1_1 += clampedHours;
    
    await prisma.miniTaskMetric.create({
      data: {
        miniTaskId: mt1_1.id,
        pluginId: 'progress-tracker',
        metricType: 'progress',
        value: JSON.stringify(clampedHours),
        metadata: JSON.stringify({ 
          unit: 'horas', 
          entryDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
          totalAcumulado: totalHours1_1.toFixed(1)
        }),
        recordedAt: date,
      },
    });
  }

  // Entradas del journal para mt1_1 (36 días) - sincronizadas con métricas
  const moods1_1 = ['positivo', 'neutral', 'negativo'];
  const reactTopics = [
    'Components', 'Props', 'State', 'Hooks', 'useState', 'useEffect',
    'Event Handling', 'Conditional Rendering', 'Lists & Keys', 'Forms',
    'Lifting State Up', 'Composition', 'Context API', 'Custom Hooks'
  ];
  
  totalHours1_1 = 0;
  for (let i = 0; i < 36; i++) {
    const date = new Date(baseDate1);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    // Mismo cálculo de horas que en métricas para sincronización
    const progressFactor = i / 36;
    const baseHours = 1.5 + progressFactor * 1.5;
    const hours = baseHours + (Math.random() - 0.5) * 0.7;
    const clampedHours = Math.max(1.0, Math.min(4.0, hours));
    totalHours1_1 += clampedHours;
    
    const topicIndex = Math.floor(Math.random() * reactTopics.length);
    const currentTopic = reactTopics[topicIndex];
    const exercisesCompleted = Math.floor(clampedHours * 2.5);
    const conceptsLearned = i % 5 === 0 ? 1 : 0;
    
    const notes = i % 2 === 0 ? [
      `Estudié ${clampedHours.toFixed(1)} horas hoy. Trabajé en ${currentTopic}.`,
      `Avancé con ${currentTopic}. Completé ${exercisesCompleted} ejercicios.`,
      `Día productivo. ${clampedHours.toFixed(1)} horas de estudio enfocado en ${currentTopic}.`,
      `Completé ejercicios de ${currentTopic}. ${exercisesCompleted} ejercicios resueltos.`,
    ][Math.floor(Math.random() * 4)] : null;
    
    const obstacles = i % 4 === 0 ? [
      'Falta de tiempo',
      'Distracciones',
      'Alguna confusión con conceptos nuevos',
      null
    ][Math.floor(Math.random() * 4)] : null;
    
    const journalEntry = await prisma.miniTaskJournalEntry.create({
      data: {
        miniTaskId: mt1_1.id,
        entryDate: date,
        progressValue: clampedHours,
        progressUnit: 'horas',
        timeSpent: Math.round(clampedHours * 60),
        notes: notes,
        obstacles: obstacles,
        mood: moods1_1[i % 3],
        checklistCompleted: i % 5 !== 0, // Completado la mayoría de días
        metricsData: JSON.stringify({ 
          horasEstudiadas: clampedHours,
          ejerciciosCompletados: exercisesCompleted,
          conceptosAprendidos: conceptsLearned,
          temaPrincipal: currentTopic,
          totalAcumulado: totalHours1_1.toFixed(1),
          leccionesCompletadas: Math.floor(i / 3)
        }),
      },
    });
    
    // Crear métrica desde journal entry (simulando pluginEventService) si no existe
    const existingMetric = await prisma.miniTaskMetric.findFirst({
      where: {
        miniTaskId: mt1_1.id,
        pluginId: 'progress-tracker',
        recordedAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        },
      },
    });
    
    if (!existingMetric) {
      await prisma.miniTaskMetric.create({
        data: {
          miniTaskId: mt1_1.id,
          pluginId: 'progress-tracker',
          metricType: 'progress',
          value: JSON.stringify(clampedHours),
          metadata: JSON.stringify({
            unit: 'horas',
            entryDate: date.toISOString(),
            journalEntryId: journalEntry.id,
            eventType: 'created',
          }),
          recordedAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0),
        },
      });
    }
  }
  console.log('  ✅ mt1_1: 4 plugins, 36 métricas, 36 entradas journal (con checklist diario)');

  const mt1_2 = await prisma.miniTask.create({
    data: {
      goalId: goal1.id,
      title: 'Completar módulo de Next.js App Router',
      description: 'Dominar el App Router, Server Components y Data Fetching',
      status: 'COMPLETED',
      deadline: new Date('2024-04-15'),
      unlocked: true,
      order: 1, // Segunda minitask (depende de mt1_1)
      priority: 'high',
      dependsOn: mt1_1.id, // Depende de completar React Fundamentals primero
      schedulingType: 'sequential',
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date('2024-03-01').toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'daily', alarmTimes: ['08:00', '20:00'], checklistEnabled: true, checklistLabel: 'Completar estudio diario de Next.js' } },
          { id: 'chart', config: { enabled: true, chartType: 'line', metricType: 'horas-estudiadas', timeRange: 'week' } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 50, unit: 'horas' } },
          { id: 'reminder', config: { enabled: true, reminderTimes: ['08:00', '20:00'] } },
          { id: 'notification', config: { enabled: true, frequency: 'daily' } },
        ],
      }),
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-04-10'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt1_2.id,
      specific: 92,
      measurable: 90,
      achievable: 88,
      relevant: 95,
      timebound: 90,
      average: 91,
      passed: true,
    },
  });

  // Plugins para mt1_2
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_2.id,
      pluginId: 'calendar',
      config: JSON.stringify({ enabled: true, frequency: 'daily', alarmTimes: ['08:00', '20:00'], checklistEnabled: true, checklistLabel: 'Completar estudio diario de Next.js' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_2.id,
      pluginId: 'chart',
      config: JSON.stringify({ enabled: true, chartType: 'line', metricType: 'horas-estudiadas', timeRange: 'week' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_2.id,
      pluginId: 'progress-tracker',
      config: JSON.stringify({ enabled: true, targetValue: 50, unit: 'horas' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_2.id,
      pluginId: 'reminder',
      config: JSON.stringify({ enabled: true, reminderTimes: ['08:00', '20:00'] }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_2.id,
      pluginId: 'notification',
      config: JSON.stringify({ enabled: true, frequency: 'daily' }),
      enabled: true,
    },
  });

  // Métricas históricas para mt1_2 (40 días - 2024-03-01 a 2024-04-10)
  const baseDate1_2 = new Date('2024-03-01');
  let totalHours = 0;
  
  for (let i = 0; i < 40; i++) {
    const date = new Date(baseDate1_2);
    date.setDate(date.getDate() + i);
    date.setHours(8 + Math.floor(Math.random() * 4), 0, 0, 0); // Entre 08:00 y 12:00
    
    // Progresión realista: empezar con 1-2 horas, aumentar gradualmente a 3-4 horas
    const progressFactor = i / 40; // 0 a 1
    const baseHours = 1.0 + progressFactor * 2.0; // 1.0 a 3.0
    const hours = baseHours + (Math.random() - 0.5) * 0.8; // Variación ±0.4
    const clampedHours = Math.max(0.5, Math.min(4.5, hours));
    totalHours += clampedHours;
    
    await prisma.miniTaskMetric.create({
      data: {
        miniTaskId: mt1_2.id,
        pluginId: 'progress-tracker',
        metricType: 'progress',
        value: JSON.stringify(clampedHours),
        metadata: JSON.stringify({ 
          unit: 'horas', 
          entryDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
          totalAcumulado: totalHours.toFixed(1)
        }),
        recordedAt: date,
      },
    });
  }

  // Journal entries para mt1_2 (40 días) - sincronizadas con métricas
  const moods = ['positivo', 'neutral', 'negativo'];
  const topics = [
    'App Router', 'Server Components', 'Client Components', 'Data Fetching',
    'Route Handlers', 'Middleware', 'Layouts', 'Templates', 'Loading States',
    'Error Boundaries', 'Streaming', 'Suspense', 'Metadata API', 'Image Optimization'
  ];
  
  totalHours = 0;
  for (let i = 0; i < 40; i++) {
    const date = new Date(baseDate1_2);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    // Mismo cálculo de horas que en métricas para sincronización
    const progressFactor = i / 40;
    const baseHours = 1.0 + progressFactor * 2.0;
    const hours = baseHours + (Math.random() - 0.5) * 0.8;
    const clampedHours = Math.max(0.5, Math.min(4.5, hours));
    totalHours += clampedHours;
    
    const topicIndex = Math.floor(Math.random() * topics.length);
    const currentTopic = topics[topicIndex];
    const exercisesCompleted = Math.floor(clampedHours * 3);
    const modulesAdvanced = i % 7 === 0 ? 1 : 0;
    
    const notes = i % 2 === 0 ? [
      `Estudié ${clampedHours.toFixed(1)} horas hoy. Trabajé en ${currentTopic}.`,
      `Avancé con ${currentTopic}. Completé ${exercisesCompleted} ejercicios.`,
      `Día productivo. ${clampedHours.toFixed(1)} horas de estudio enfocado en ${currentTopic}.`,
      `Completé el módulo de ${currentTopic}. ${exercisesCompleted} ejercicios resueltos.`,
    ][Math.floor(Math.random() * 4)] : null;
    
    const obstacles = i % 5 === 0 ? [
      'Algunas dificultades con Server Components',
      'Confusión con la diferencia entre Server y Client Components',
      'Problemas con el routing dinámico',
      null
    ][Math.floor(Math.random() * 4)] : null;
    
    const journalEntry = await prisma.miniTaskJournalEntry.create({
      data: {
        miniTaskId: mt1_2.id,
        entryDate: date,
        progressValue: clampedHours,
        progressUnit: 'horas',
        timeSpent: Math.round(clampedHours * 60),
        notes: notes,
        obstacles: obstacles,
        mood: moods[i % 3],
        checklistCompleted: i % 4 !== 0, // Completado la mayoría de días
        metricsData: JSON.stringify({ 
          horasEstudiadas: clampedHours,
          ejerciciosCompletados: exercisesCompleted,
          modulosAvanzados: modulesAdvanced,
          temaPrincipal: currentTopic,
          totalAcumulado: totalHours.toFixed(1)
        }),
      },
    });
    
    // Crear métrica desde journal entry (simulando pluginEventService)
    // Solo si no existe ya una métrica para ese día
    const existingMetric = await prisma.miniTaskMetric.findFirst({
      where: {
        miniTaskId: mt1_2.id,
        pluginId: 'progress-tracker',
        recordedAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        },
      },
    });
    
    if (!existingMetric) {
      await prisma.miniTaskMetric.create({
        data: {
          miniTaskId: mt1_2.id,
          pluginId: 'progress-tracker',
          metricType: 'progress',
          value: JSON.stringify(clampedHours),
          metadata: JSON.stringify({
            unit: 'horas',
            entryDate: date.toISOString(),
            journalEntryId: journalEntry.id,
            eventType: 'created',
          }),
          recordedAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0),
        },
      });
    }
  }
  console.log('  ✅ mt1_2: 5 plugins, 40 métricas, 40 entradas journal');

  const mt1_3 = await prisma.miniTask.create({
    data: {
      goalId: goal1.id,
      title: 'Aprobar examen de certificación',
      description: 'Presentar y aprobar el examen final con más del 85%',
      status: 'COMPLETED',
      deadline: new Date('2024-11-10'),
      unlocked: true,
      order: 2, // Tercera minitask (depende de mt1_2)
      priority: 'high',
      dependsOn: mt1_2.id, // Depende de completar Next.js primero
      schedulingType: 'sequential',
      scheduledDate: new Date('2024-11-10'),
      scheduledTime: '10:00',
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date('2024-10-01').toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'daily', alarmTimes: ['09:00', '15:00'], checklistEnabled: true, checklistLabel: 'Sesión de estudio para examen' } },
          { id: 'chart', config: { enabled: true, chartType: 'bar', metricType: 'sesiones-estudio', timeRange: 'week' } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 60, unit: 'horas' } },
          { id: 'reminder', config: { enabled: true, reminderTimes: ['09:00', '15:00'] } },
          { id: 'notification', config: { enabled: true, frequency: 'daily' } },
        ],
      }),
      createdAt: new Date('2024-10-01'),
      updatedAt: new Date('2024-11-08'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt1_3.id,
      specific: 95,
      measurable: 95,
      achievable: 90,
      relevant: 98,
      timebound: 92,
      average: 94,
      passed: true,
    },
  });

  // Plugins para mt1_3
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_3.id,
      pluginId: 'calendar',
      config: JSON.stringify({ enabled: true, frequency: 'daily', alarmTimes: ['09:00', '15:00'], checklistEnabled: true, checklistLabel: 'Sesión de estudio para examen' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_3.id,
      pluginId: 'chart',
      config: JSON.stringify({ enabled: true, chartType: 'bar', metricType: 'sesiones-estudio', timeRange: 'week' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_3.id,
      pluginId: 'progress-tracker',
      config: JSON.stringify({ enabled: true, targetValue: 60, unit: 'horas' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_3.id,
      pluginId: 'reminder',
      config: JSON.stringify({ enabled: true, reminderTimes: ['09:00', '15:00'] }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt1_3.id,
      pluginId: 'notification',
      config: JSON.stringify({ enabled: true, frequency: 'daily' }),
      enabled: true,
    },
  });

  // Métricas históricas para mt1_3 (38 días - 2024-10-01 a 2024-11-08)
  const baseDate1_3 = new Date('2024-10-01');
  let totalHours1_3 = 0;
  
  for (let i = 0; i < 38; i++) {
    const date = new Date(baseDate1_3);
    date.setDate(date.getDate() + i);
    date.setHours(9 + Math.floor(Math.random() * 6), 0, 0, 0); // Entre 09:00 y 15:00
    
    // Progresión intensiva: 1.5-2 horas al inicio, aumentar a 3-4 horas cerca del examen
    const progressFactor = i / 38; // 0 a 1
    const baseHours = 1.5 + progressFactor * 2.0; // 1.5 a 3.5
    const hours = baseHours + (Math.random() - 0.5) * 0.6; // Variación ±0.3
    const clampedHours = Math.max(1.0, Math.min(4.5, hours));
    totalHours1_3 += clampedHours;
    
    await prisma.miniTaskMetric.create({
      data: {
        miniTaskId: mt1_3.id,
        pluginId: 'progress-tracker',
        metricType: 'progress',
        value: JSON.stringify(clampedHours),
        metadata: JSON.stringify({ 
          unit: 'horas', 
          entryDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
          totalAcumulado: totalHours1_3.toFixed(1),
          tipoSesion: i % 3 === 0 ? 'practica-examen' : 'estudio-temas'
        }),
        recordedAt: date,
      },
    });
  }

  // Journal entries para mt1_3 (38 días) - sincronizadas con métricas
  const moods1_3 = ['positivo', 'neutral', 'negativo'];
  const examTopics = [
    'React Fundamentals', 'Next.js App Router', 'Server Components', 'Data Fetching',
    'Routing', 'Middleware', 'API Routes', 'Authentication', 'Performance',
    'SEO', 'Deployment', 'Testing', 'TypeScript', 'Best Practices'
  ];
  
  totalHours1_3 = 0;
  for (let i = 0; i < 38; i++) {
    const date = new Date(baseDate1_3);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    // Mismo cálculo de horas que en métricas para sincronización
    const progressFactor = i / 38;
    const baseHours = 1.5 + progressFactor * 2.0;
    const hours = baseHours + (Math.random() - 0.5) * 0.6;
    const clampedHours = Math.max(1.0, Math.min(4.5, hours));
    totalHours1_3 += clampedHours;
    
    const topicIndex = Math.floor(Math.random() * examTopics.length);
    const currentTopic = examTopics[topicIndex];
    const practiceScore = i > 20 ? 75 + Math.floor(Math.random() * 20) : null; // Puntajes de práctica solo en la segunda mitad
    const topicsReviewed = Math.floor(clampedHours / 1.5);
    
    // Mood más positivo cerca del examen
    const moodIndex = i < 10 ? i % 3 : (i < 30 ? (i % 3 === 0 ? 0 : (i % 3 === 1 ? 0 : 1)) : 0); // Más positivo al final
    const mood = moods1_3[moodIndex];
    
    const notes = i % 2 === 0 ? [
      `Estudié ${clampedHours.toFixed(1)} horas hoy. Revisé ${currentTopic}.`,
      `Sesión intensiva de ${clampedHours.toFixed(1)} horas. Enfocado en ${currentTopic}.`,
      `Practiqué ${currentTopic}. ${clampedHours.toFixed(1)} horas de estudio concentrado.`,
      i > 20 && practiceScore ? `Examen de práctica: ${practiceScore}%. Revisé ${currentTopic}.` : `Día productivo. ${clampedHours.toFixed(1)} horas estudiando ${currentTopic}.`,
    ][Math.floor(Math.random() * 4)] : null;
    
    const obstacles = i % 6 === 0 ? [
      'Algo de ansiedad sobre el examen',
      'Dificultad con algunos conceptos avanzados',
      'Fatiga mental por el estudio intensivo',
      null
    ][Math.floor(Math.random() * 4)] : null;
    
    const journalEntry = await prisma.miniTaskJournalEntry.create({
      data: {
        miniTaskId: mt1_3.id,
        entryDate: date,
        progressValue: clampedHours,
        progressUnit: 'horas',
        timeSpent: Math.round(clampedHours * 60),
        notes: notes,
        obstacles: obstacles,
        mood: mood,
        checklistCompleted: i % 5 !== 0, // Completado la mayoría de días (más consistente cerca del examen)
        metricsData: JSON.stringify({ 
          horasEstudiadas: clampedHours,
          temasRevisados: topicsReviewed,
          temaPrincipal: currentTopic,
          puntajePractica: practiceScore,
          totalAcumulado: totalHours1_3.toFixed(1),
          diasRestantes: 38 - i
        }),
      },
    });
    
    // Crear métrica desde journal entry (simulando pluginEventService)
    const existingMetric = await prisma.miniTaskMetric.findFirst({
      where: {
        miniTaskId: mt1_3.id,
        pluginId: 'progress-tracker',
        recordedAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        },
      },
    });
    
    if (!existingMetric) {
      await prisma.miniTaskMetric.create({
        data: {
          miniTaskId: mt1_3.id,
          pluginId: 'progress-tracker',
          metricType: 'progress',
          value: JSON.stringify(clampedHours),
          metadata: JSON.stringify({
            unit: 'horas',
            entryDate: date.toISOString(),
            journalEntryId: journalEntry.id,
            eventType: 'created',
          }),
          recordedAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0, 0),
        },
      });
    }
  }
  console.log('  ✅ mt1_3: 5 plugins, 38 métricas, 38 entradas journal');


  console.log('✅ Goal 1 (COMPLETADA) creada con 3 minitasks completadas y 3 checkins');

  // ============================================
  // GOAL 2: ACTIVA - En proceso con minitasks mixtas
  // ============================================
  const goal2 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Escribir y publicar un libro de 200 páginas sobre productividad',
      description: 'Completar un libro completo sobre técnicas de productividad personal y publicarlo en Amazon',
      status: 'ACTIVE',
      deadline: new Date('2025-06-30'),
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-11-20'),
    },
  });

  // Score para goal activa
  await prisma.smarterScore.create({
    data: {
      goalId: goal2.id,
      specific: 88,
      measurable: 85,
      achievable: 80,
      relevant: 90,
      timebound: 85,
      evaluate: 82,
      readjust: 80,
      average: 84.3,
      passed: true,
    },
  });

  // Minitasks mixtas para goal2
  const mt2_1 = await prisma.miniTask.create({
    data: {
      goalId: goal2.id,
      title: 'Escribir el primer capítulo (20 páginas)',
      description: 'Completar la introducción y el primer capítulo del libro',
      status: 'COMPLETED',
      deadline: new Date('2024-10-15'),
      order: 0,
      priority: 'high',
      schedulingType: 'parallel',
      createdAt: new Date('2024-09-05'),
      updatedAt: new Date('2024-10-12'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt2_1.id,
      specific: 90,
      measurable: 85,
      achievable: 88,
      relevant: 92,
      timebound: 90,
      average: 89,
      passed: true,
    },
  });

  const mt2_2 = await prisma.miniTask.create({
    data: {
      goalId: goal2.id,
      title: 'Investigar y documentar 10 técnicas de productividad',
      description: 'Revisar libros, artículos y estudios sobre productividad',
      status: 'COMPLETED',
      deadline: new Date('2024-09-30'),
      order: 1,
      priority: 'high',
      dependsOn: null, // Puede hacerse en paralelo con mt2_1
      schedulingType: 'parallel',
      createdAt: new Date('2024-09-10'),
      updatedAt: new Date('2024-09-28'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt2_2.id,
      specific: 85,
      measurable: 80,
      achievable: 90,
      relevant: 95,
      timebound: 85,
      average: 87,
      passed: true,
    },
  });

  const mt2_3 = await prisma.miniTask.create({
    data: {
      goalId: goal2.id,
      title: 'Escribir segundo capítulo (25 páginas)',
      description: 'Desarrollar el capítulo sobre gestión del tiempo',
      status: 'PENDING',
      deadline: new Date('2024-12-15'),
      unlocked: true,
      order: 2,
      priority: 'high',
      dependsOn: mt2_1.id, // Depende de completar el primer capítulo
      schedulingType: 'daily', // Tarea diaria de escritura
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date('2024-10-20').toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'daily', alarmTimes: ['08:00', '20:00'], checklistEnabled: true, checklistLabel: 'Completar escritura diaria' } },
          { id: 'chart', config: { enabled: true, chartType: 'bar', metricType: 'páginas-escritas', timeRange: 'week' } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 25, unit: 'páginas' } },
          { id: 'notification', config: { enabled: true, frequency: 'daily' } },
        ],
      }),
      createdAt: new Date('2024-10-20'),
      updatedAt: new Date('2024-11-01'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt2_3.id,
      specific: 88,
      measurable: 85,
      achievable: 82,
      relevant: 90,
      timebound: 88,
      average: 86.6,
      passed: true,
    },
  });

  // Plugins para mt2_3
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt2_3.id,
      pluginId: 'calendar',
      config: JSON.stringify({ enabled: true, frequency: 'daily', alarmTimes: ['08:00', '20:00'], checklistEnabled: true, checklistLabel: 'Completar escritura diaria' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt2_3.id,
      pluginId: 'chart',
      config: JSON.stringify({ enabled: true, chartType: 'bar', metricType: 'páginas-escritas', timeRange: 'week' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt2_3.id,
      pluginId: 'progress-tracker',
      config: JSON.stringify({ enabled: true, targetValue: 25, unit: 'páginas' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt2_3.id,
      pluginId: 'notification',
      config: JSON.stringify({ enabled: true, frequency: 'daily' }),
      enabled: true,
    },
  });

  // Métricas y journal para mt2_3 (últimas 3 semanas - fechas recientes)
  const baseDate2 = new Date(today);
  baseDate2.setDate(baseDate2.getDate() - 21); // Hace 21 días
  
  for (let i = 0; i < 21; i++) {
    const date = new Date(baseDate2);
    date.setDate(date.getDate() + i);
    date.setHours(8, 0, 0, 0); // Normalizar hora
    const pages = i < 7 ? 0.5 + Math.random() * 1.5 : 1 + Math.random() * 2; // Más páginas después de la primera semana
    const totalPages = Math.min(25, pages * (i + 1) / 21 * 25);
    
    await prisma.miniTaskMetric.create({
      data: {
        miniTaskId: mt2_3.id,
        pluginId: 'progress-tracker',
        metricType: 'progress',
        value: JSON.stringify(pages),
        metadata: JSON.stringify({ unit: 'páginas', entryDate: date.toISOString() }),
        recordedAt: date,
      },
    });

    if (i % 2 === 0) { // Entradas cada 2 días
      const dateEntry = new Date(date);
      dateEntry.setHours(0, 0, 0, 0);
      const moods = ['positivo', 'neutral', 'negativo'];
      await prisma.miniTaskJournalEntry.create({
        data: {
          miniTaskId: mt2_3.id,
          entryDate: dateEntry,
          progressValue: pages,
          progressUnit: 'páginas',
          timeSpent: Math.round(pages * 45), // 45 min por página
          notes: `Escribí ${pages.toFixed(1)} páginas hoy. ${totalPages.toFixed(1)} páginas en total.`,
          obstacles: i % 5 === 0 ? 'Bloqueo creativo' : null,
          mood: moods[i % 3],
          checklistCompleted: i % 3 !== 0, // Completado la mayoría de días (ejemplo de checklist)
          metricsData: JSON.stringify({ paginasEscritas: pages, totalPaginas: totalPages }),
        },
      });
    }
  }
  console.log('  ✅ mt2_3: 4 plugins, 21 métricas, 11 entradas journal');

  const mt2_4 = await prisma.miniTask.create({
    data: {
      goalId: goal2.id,
      title: 'Escribir tercer capítulo (30 páginas)',
      description: 'Desarrollar el capítulo sobre organización personal',
      status: 'PENDING',
      deadline: new Date('2025-01-31'),
      order: 3,
      priority: 'medium',
      dependsOn: mt2_3.id, // Depende de completar el segundo capítulo
      schedulingType: 'daily',
      createdAt: new Date('2024-11-01'),
    },
  });

  const mt2_5 = await prisma.miniTask.create({
    data: {
      goalId: goal2.id,
      title: 'Revisar y editar primeros 3 capítulos',
      description: 'Hacer revisión completa de ortografía, gramática y coherencia',
      status: 'DRAFT',
      deadline: new Date('2025-02-28'),
      order: 4,
      priority: 'medium',
      dependsOn: mt2_4.id, // Depende de completar el tercer capítulo
      schedulingType: 'sequential',
      createdAt: new Date('2024-11-15'),
    },
  });


  // Readjustment para goal activa (cambió el deadline)
  await prisma.readjustment.create({
    data: {
      goalId: goal2.id,
      previousSnapshot: JSON.stringify({
        deadline: '2025-05-30',
        description: 'Completar un libro completo sobre técnicas de productividad personal',
      }),
      newSnapshot: JSON.stringify({
        deadline: '2025-06-30',
        description: 'Completar un libro completo sobre técnicas de productividad personal y publicarlo en Amazon',
      }),
      reason: 'Extendí el plazo para incluir tiempo de publicación en Amazon',
      createdAt: new Date('2024-10-15'),
    },
  });

  // SuggestedMiniTasks para goal2
  await prisma.suggestedMiniTask.create({
    data: {
      goalId: goal2.id,
      title: 'Contratar editor profesional',
      description: 'Buscar y contratar un editor para revisar el manuscrito',
      priority: 8,
    },
  });

  await prisma.suggestedMiniTask.create({
    data: {
      goalId: goal2.id,
      title: 'Diseñar portada del libro',
      description: 'Crear o contratar diseño de portada atractiva',
      priority: 7,
    },
  });

  // EVENTO ÚNICO: Preparar materiales (multi-item checklist)
  const mt2_unique = await prisma.miniTask.create({
    data: {
      goalId: goal2.id,
      title: 'Preparar y verificar materiales completos para el primer cuadro antes del inicio',
      description: 'Reunir y comprobar que el lienzo, pinturas y pinceles estén listos y en buen estado antes del 15 de julio de 2024, marcando cada elemento como preparado en una lista de verificación.',
      status: 'IN_PROGRESS',
      deadline: new Date('2024-07-15'),
      unlocked: true,
      order: 5, // Después de las otras minitasks
      priority: 'medium',
      schedulingType: 'scheduled',
      scheduledDate: new Date('2024-07-15'),
      scheduledTime: '09:00',
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date('2024-07-01').toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, checklistEnabled: true, checklistType: 'multi-item', checklistLabel: 'Verificar materiales para el primer cuadro', checklistItems: ['Lienzo', 'Pinturas', 'Pinceles', 'Paleta', 'Diluyente'], alarmTimes: ['09:00'] } },
          { id: 'chart', config: { enabled: true, chartType: 'bar', metricType: 'completitud', timeRange: 'all' } },
        ],
      }),
      createdAt: new Date('2024-07-01'),
      updatedAt: new Date('2024-07-05'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt2_unique.id,
      specific: 95,
      measurable: 90,
      achievable: 100,
      relevant: 95,
      timebound: 85,
      average: 93,
      passed: true,
    },
  });

  // Plugins para mt2_unique
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt2_unique.id,
      pluginId: 'calendar',
      config: JSON.stringify({ enabled: true, checklistEnabled: true, checklistType: 'multi-item', checklistLabel: 'Verificar materiales para el primer cuadro', checklistItems: ['Lienzo', 'Pinturas', 'Pinceles', 'Paleta', 'Diluyente'], alarmTimes: ['09:00'] }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt2_unique.id,
      pluginId: 'chart',
      config: JSON.stringify({ enabled: true, chartType: 'bar', metricType: 'completitud', timeRange: 'all' }),
      enabled: true,
    },
  });

  // Crear items del checklist
  const checklistItems = ['Lienzo', 'Pinturas', 'Pinceles', 'Paleta', 'Diluyente'];
  for (let i = 0; i < checklistItems.length; i++) {
    await prisma.miniTaskChecklistItem.create({
      data: {
        miniTaskId: mt2_unique.id,
        label: checklistItems[i],
        completed: i < 3, // Primeros 3 completados como ejemplo
        completedAt: i < 3 ? new Date('2024-07-05') : null,
        order: i,
      },
    });
  }

  console.log('✅ Goal 2 (ACTIVA) creada con 6 minitasks (2 completadas, 3 pendientes incluyendo evento único, 1 draft), 3 checkins, 1 readjustment y 2 sugerencias');

  // ============================================
  // GOAL 3: ACTIVA - Otra meta en proceso
  // ============================================
  const goal3 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Correr una maratón completa (42.2 km)',
      description: 'Completar una maratón de 42.2 km en menos de 4 horas y 30 minutos',
      status: 'ACTIVE',
      deadline: new Date('2025-04-15'),
      createdAt: new Date('2024-08-01'),
      updatedAt: new Date('2024-11-15'),
    },
  });

  await prisma.smarterScore.create({
    data: {
      goalId: goal3.id,
      specific: 92,
      measurable: 95,
      achievable: 75,
      relevant: 88,
      timebound: 90,
      evaluate: 85,
      readjust: 80,
      average: 86.4,
      passed: true,
    },
  });

  // Minitasks para goal3
  const mt3_1 = await prisma.miniTask.create({
    data: {
      goalId: goal3.id,
      title: 'Correr 5 km sin parar',
      description: 'Alcanzar la capacidad de correr 5 km continuos',
      status: 'COMPLETED',
      deadline: new Date('2024-09-15'),
      order: 0,
      priority: 'high',
      schedulingType: 'parallel',
      createdAt: new Date('2024-08-05'),
      updatedAt: new Date('2024-09-10'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt3_1.id,
      specific: 90,
      measurable: 95,
      achievable: 90,
      relevant: 85,
      timebound: 88,
      average: 89.6,
      passed: true,
    },
  });

  const mt3_2 = await prisma.miniTask.create({
    data: {
      goalId: goal3.id,
      title: 'Correr 10 km sin parar',
      description: 'Aumentar la distancia a 10 km continuos',
      status: 'COMPLETED',
      deadline: new Date('2024-10-15'),
      order: 1,
      priority: 'high',
      dependsOn: mt3_1.id, // Depende de completar 5km primero
      schedulingType: 'sequential',
      createdAt: new Date('2024-09-20'),
      updatedAt: new Date('2024-10-10'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt3_2.id,
      specific: 92,
      measurable: 95,
      achievable: 85,
      relevant: 90,
      timebound: 90,
      average: 90.4,
      passed: true,
    },
  });

  const mt3_3 = await prisma.miniTask.create({
    data: {
      goalId: goal3.id,
      title: 'Correr media maratón (21 km)',
      description: 'Completar una media maratón como preparación',
      status: 'PENDING',
      deadline: new Date('2025-01-31'),
      unlocked: true,
      order: 2,
      priority: 'high',
      dependsOn: mt3_2.id, // Depende de completar 10km primero
      schedulingType: 'daily', // Entrenamiento diario
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date('2024-10-20').toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'weekly', alarmTimes: ['06:00', '18:00'], checklistEnabled: false } },
          { id: 'chart', config: { enabled: true, chartType: 'area', metricType: 'kilómetros-corridos', timeRange: 'month' } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 21, unit: 'km' } },
          { id: 'reminder', config: { enabled: true, reminderTimes: ['06:00'] } },
          { id: 'mobile-push', config: { enabled: true, frequency: 'daily' } },
        ],
      }),
      createdAt: new Date('2024-10-20'),
      updatedAt: new Date('2024-11-01'),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt3_3.id,
      specific: 90,
      measurable: 95,
      achievable: 80,
      relevant: 92,
      timebound: 88,
      average: 89,
      passed: true,
    },
  });

  // Plugins para mt3_3
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt3_3.id,
      pluginId: 'calendar',
      config: JSON.stringify({ enabled: true, frequency: 'weekly', alarmTimes: ['06:00', '18:00'], checklistEnabled: false }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt3_3.id,
      pluginId: 'chart',
      config: JSON.stringify({ enabled: true, chartType: 'area', metricType: 'kilómetros-corridos', timeRange: 'month' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt3_3.id,
      pluginId: 'progress-tracker',
      config: JSON.stringify({ enabled: true, targetValue: 21, unit: 'km' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt3_3.id,
      pluginId: 'reminder',
      config: JSON.stringify({ enabled: true, reminderTimes: ['06:00'] }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt3_3.id,
      pluginId: 'mobile-push',
      config: JSON.stringify({ enabled: true, frequency: 'daily' }),
      enabled: true,
    },
  });

  // Métricas y journal para mt3_3 (últimas 4 semanas - fechas recientes, entrenamiento progresivo)
  const baseDate3 = new Date(today);
  baseDate3.setDate(baseDate3.getDate() - 28); // Hace 28 días
  
  for (let i = 0; i < 28; i++) {
    const date = new Date(baseDate3);
    date.setDate(date.getDate() + i);
    date.setHours(6, 0, 0, 0); // Normalizar hora
    // Progresión: empezar con 5km, llegar a 15km
    const km = 5 + (i / 28) * 10 + (Math.random() - 0.5) * 2;
    const clampedKm = Math.max(3, Math.min(15, km));
    
    if (i % 2 === 0) { // Entrenamientos cada 2 días
      await prisma.miniTaskMetric.create({
        data: {
          miniTaskId: mt3_3.id,
          pluginId: 'progress-tracker',
          metricType: 'progress',
          value: JSON.stringify(clampedKm),
          metadata: JSON.stringify({ unit: 'km', entryDate: date.toISOString() }),
          recordedAt: date,
        },
      });

      const dateEntry = new Date(date);
      dateEntry.setHours(0, 0, 0, 0);
      const moods = ['positivo', 'neutral', 'negativo'];
      await prisma.miniTaskJournalEntry.create({
        data: {
          miniTaskId: mt3_3.id,
          entryDate: dateEntry,
          progressValue: clampedKm,
          progressUnit: 'km',
          timeSpent: Math.round(clampedKm * 6), // 6 min/km promedio
          notes: `Corrí ${clampedKm.toFixed(1)} km hoy. ${i < 7 ? 'Primera semana, me siento bien.' : i < 14 ? 'Aumentando distancia gradualmente.' : 'Buen progreso, llegando a distancias más largas.'}`,
          obstacles: i % 7 === 0 ? 'Cansancio' : null,
          mood: moods[i % 3],
          metricsData: JSON.stringify({ kilometrosCorridos: clampedKm, tiempoTotal: Math.round(clampedKm * 6) }),
        },
      });
    }
  }
  console.log('  ✅ mt3_3: 5 plugins, 14 métricas, 14 entradas journal');

  const mt3_4 = await prisma.miniTask.create({
    data: {
      goalId: goal3.id,
      title: 'Seguir plan de entrenamiento de 16 semanas',
      description: 'Completar todas las sesiones del plan de entrenamiento',
      status: 'PENDING',
      deadline: new Date('2025-03-31'),
      order: 3,
      priority: 'high',
      dependsOn: mt3_3.id, // Depende de completar media maratón
      schedulingType: 'daily',
      createdAt: new Date('2024-11-01'),
    },
  });


  console.log('✅ Goal 3 (ACTIVA) creada con 4 minitasks (2 completadas, 2 pendientes)');

  // ============================================
  // GOAL 4: DRAFT - Sin validar
  // ============================================
  const goal4 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Alcanzar nivel B2 en inglés',
      description: 'Completar curso y certificación de nivel B2 en inglés',
      status: 'DRAFT',
      deadline: new Date('2025-08-31'),
      createdAt: new Date('2024-11-01'),
    },
  });

  // Minitasks en draft para goal4
  const mt4_1 = await prisma.miniTask.create({
    data: {
      goalId: goal4.id,
      title: 'Completar curso de inglés nivel A2',
      description: 'Terminar el curso básico de inglés',
      status: 'DRAFT',
      deadline: new Date('2025-02-28'),
      order: 0,
      priority: 'high',
      schedulingType: 'parallel',
      createdAt: new Date('2024-11-05'),
    },
  });

  const mt4_2 = await prisma.miniTask.create({
    data: {
      goalId: goal4.id,
      title: 'Completar curso de inglés nivel B1',
      description: 'Avanzar al nivel intermedio',
      status: 'DRAFT',
      deadline: new Date('2025-05-31'),
      order: 1,
      priority: 'high',
      dependsOn: mt4_1.id, // Depende de completar A2
      schedulingType: 'sequential',
      createdAt: new Date('2024-11-05'),
    },
  });

  const mt4_3 = await prisma.miniTask.create({
    data: {
      goalId: goal4.id,
      title: 'Aprobar examen B2 oficial',
      description: 'Presentar y aprobar el examen de certificación B2',
      status: 'DRAFT',
      deadline: new Date('2025-08-15'),
      order: 2,
      priority: 'high',
      dependsOn: mt4_2.id, // Depende de completar B1
      schedulingType: 'scheduled',
      scheduledDate: new Date('2025-08-15'),
      scheduledTime: '09:00',
      createdAt: new Date('2024-11-05'),
    },
  });

  console.log('✅ Goal 4 (DRAFT) creada con 3 minitasks en draft');

  // ============================================
  // GOAL 5: DRAFT - Otra meta sin validar
  // ============================================
  const goal5 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Crear un curso online sobre desarrollo web',
      description: 'Desarrollar y lanzar un curso completo de 20 horas sobre desarrollo web moderno',
      status: 'DRAFT',
      deadline: new Date('2025-09-30'),
      createdAt: new Date('2024-11-10'),
    },
  });

  await prisma.miniTask.create({
    data: {
      goalId: goal5.id,
      title: 'Definir estructura del curso',
      description: 'Crear el índice y plan de lecciones',
      status: 'DRAFT',
      deadline: new Date('2025-01-15'),
      order: 0,
      priority: 'high',
      schedulingType: 'parallel',
      createdAt: new Date('2024-11-12'),
    },
  });

  console.log('✅ Goal 5 (DRAFT) creada con 1 minitask en draft');

  // ============================================
  // GOAL 6: GOAL DE UN SOLO DÍA CON HORAS PLANIFICADAS
  // ============================================
  const goal6 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Dedicar 2 horas a estudiar inglés hoy',
      description: 'Completar 2 horas de estudio intensivo de inglés hoy, enfocándome en vocabulario y gramática',
      status: 'ACTIVE',
      deadline: new Date(new Date().setHours(23, 59, 59, 999)), // Hoy a las 23:59
      plannedHours: 2.0,
      isSingleDayGoal: true,
      createdAt: new Date(),
    },
  });

  await prisma.smarterScore.create({
    data: {
      goalId: goal6.id,
      specific: 90,
      measurable: 95,
      achievable: 85,
      relevant: 90,
      timebound: 95,
      evaluate: 88,
      readjust: 85,
      average: 89.7,
      passed: true,
    },
  });

  // Mini-task desbloqueada con horas planificadas
  const mt6_1 = await prisma.miniTask.create({
    data: {
      goalId: goal6.id,
      title: 'Estudiar vocabulario y gramática (2 horas)',
      description: 'Dedicar 2 horas completas a estudiar vocabulario nuevo y repasar reglas gramaticales',
      status: 'IN_PROGRESS',
      deadline: new Date(new Date().setHours(23, 59, 59, 999)),
      unlocked: true,
      plannedHours: 2.0,
      isSingleDayTask: true,
      order: 0,
      priority: 'high',
      schedulingType: 'scheduled',
      scheduledDate: new Date(),
      scheduledTime: '09:00',
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'daily', alarmTimes: ['09:00', '14:00'], plannedHours: 2.0, checklistEnabled: false } },
          { id: 'chart', config: { enabled: true, chartType: 'bar', metricType: 'horas-estudiadas', timeRange: 'day' } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 2.0, unit: 'hours' } },
        ],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt6_1.id,
      specific: 92,
      measurable: 95,
      achievable: 88,
      relevant: 90,
      timebound: 95,
      average: 92,
      passed: true,
    },
  });

  // Plugins para mt6_1
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt6_1.id,
      pluginId: 'calendar',
      config: JSON.stringify({ enabled: true, frequency: 'daily', alarmTimes: ['09:00', '14:00'], plannedHours: 2.0, checklistEnabled: false }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt6_1.id,
      pluginId: 'chart',
      config: JSON.stringify({ enabled: true, chartType: 'bar', metricType: 'horas-estudiadas', timeRange: 'day' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt6_1.id,
      pluginId: 'progress-tracker',
      config: JSON.stringify({ enabled: true, targetValue: 2.0, unit: 'hours' }),
      enabled: true,
    },
  });

  // Entrada del journal con tiempo registrado (1 hora hasta ahora)
  await prisma.miniTaskJournalEntry.create({
    data: {
      miniTaskId: mt6_1.id,
      entryDate: new Date(),
      notes: 'Estudié vocabulario durante 1 hora esta mañana',
      timeSpent: 60, // 60 minutos = 1 hora
      mood: 'positivo',
    },
  });

  console.log('✅ Goal 6 (ACTIVE - Single Day) creada con 1 minitask desbloqueada y horas planificadas');

  // ============================================
  // GOAL 7: OTRO EJEMPLO DE GOAL DE UN SOLO DÍA CON HORAS
  // ============================================
  const goal7 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Pasar 3 horas trabajando en el proyecto de diseño hoy',
      description: 'Dedicar 3 horas completas hoy al proyecto de diseño gráfico, enfocándome en crear los mockups finales',
      status: 'ACTIVE',
      deadline: new Date(new Date().setHours(23, 59, 59, 999)), // Hoy
      plannedHours: 3.0,
      isSingleDayGoal: true,
      createdAt: new Date(),
    },
  });

  await prisma.smarterScore.create({
    data: {
      goalId: goal7.id,
      specific: 88,
      measurable: 92,
      achievable: 85,
      relevant: 90,
      timebound: 95,
      evaluate: 87,
      readjust: 83,
      average: 88.6,
      passed: true,
    },
  });

  // Mini-task desbloqueada con horas planificadas
  const mt7_1 = await prisma.miniTask.create({
    data: {
      goalId: goal7.id,
      title: 'Crear mockups finales del proyecto (3 horas)',
      description: 'Diseñar y completar los mockups finales del proyecto de diseño gráfico, dedicando 3 horas continuas',
      status: 'PENDING',
      deadline: new Date(new Date().setHours(23, 59, 59, 999)),
      unlocked: true,
      plannedHours: 3.0,
      isSingleDayTask: true,
      order: 0,
      priority: 'high',
      schedulingType: 'scheduled',
      scheduledDate: new Date(),
      scheduledTime: '10:00',
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'daily', alarmTimes: ['10:00', '15:00'], plannedHours: 3.0, checklistEnabled: false } },
          { id: 'chart', config: { enabled: true, chartType: 'line', metricType: 'horas-trabajadas', timeRange: 'day' } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 3.0, unit: 'hours' } },
          { id: 'reminder', config: { enabled: true, reminderTimes: ['10:00'] } },
        ],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt7_1.id,
      specific: 90,
      measurable: 93,
      achievable: 87,
      relevant: 92,
      timebound: 94,
      average: 91.2,
      passed: true,
    },
  });

  // Plugins para mt7_1
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt7_1.id,
      pluginId: 'calendar',
      config: JSON.stringify({ enabled: true, frequency: 'daily', alarmTimes: ['10:00', '15:00'], plannedHours: 3.0, checklistEnabled: false }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt7_1.id,
      pluginId: 'chart',
      config: JSON.stringify({ enabled: true, chartType: 'line', metricType: 'horas-trabajadas', timeRange: 'day' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt7_1.id,
      pluginId: 'progress-tracker',
      config: JSON.stringify({ enabled: true, targetValue: 3.0, unit: 'hours' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt7_1.id,
      pluginId: 'reminder',
      config: JSON.stringify({ enabled: true, reminderTimes: ['10:00'] }),
      enabled: true,
    },
  });

  // Entrada del journal con tiempo parcial registrado (1.5 horas hasta ahora)
  await prisma.miniTaskJournalEntry.create({
    data: {
      miniTaskId: mt7_1.id,
      entryDate: new Date(),
      notes: 'Trabajé en los mockups durante 1.5 horas esta mañana. Voy bien encaminado.',
      timeSpent: 90, // 90 minutos = 1.5 horas
      mood: 'positivo',
      progressValue: 1.5,
      progressUnit: 'horas',
    },
  });

  console.log('✅ Goal 7 (ACTIVE - Single Day) creada con 1 minitask desbloqueada y 3 horas planificadas (1.5 horas ya registradas)');

  // ============================================
  // GOAL 8: GOAL CON PLUGIN POMODORO
  // ============================================
  const goal8 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Completar capítulo del libro usando técnica Pomodoro',
      description: 'Leer y tomar notas del capítulo 5 del libro usando sesiones Pomodoro de 25 minutos con descansos estructurados',
      status: 'ACTIVE',
      deadline: new Date(new Date().setDate(new Date().getDate() + 3)),
      createdAt: new Date(),
    },
  });

  await prisma.smarterScore.create({
    data: {
      goalId: goal8.id,
      specific: 88,
      measurable: 90,
      achievable: 85,
      relevant: 92,
      timebound: 88,
      evaluate: 87,
      readjust: 85,
      average: 87.9,
      passed: true,
    },
  });

  // Mini-task desbloqueada con plugin Pomodoro
  const mt8_1 = await prisma.miniTask.create({
    data: {
      goalId: goal8.id,
      title: 'Leer capítulo 5 con técnica Pomodoro',
      description: 'Completar la lectura del capítulo 5 usando sesiones Pomodoro de 25 minutos, registrando progreso automáticamente',
      status: 'IN_PROGRESS',
      deadline: new Date(new Date().setDate(new Date().getDate() + 3)),
      unlocked: true,
      order: 0,
      priority: 'high',
      schedulingType: 'daily', // Tarea diaria con Pomodoro
      scheduledTime: '09:00',
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'daily', alarmTimes: ['09:00', '14:00'], checklistEnabled: false } },
          { id: 'chart', config: { enabled: true, chartType: 'bar', metricType: 'sesiones-pomodoro', timeRange: 'week' } },
          { id: 'pomodoro', config: { enabled: true, workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, sessionsUntilLongBreak: 4, autoLogToJournal: true, soundEnabled: true } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 8, unit: 'sesiones' } },
        ],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.miniTaskScore.create({
    data: {
      miniTaskId: mt8_1.id,
      specific: 90,
      measurable: 92,
      achievable: 88,
      relevant: 90,
      timebound: 90,
      average: 90,
      passed: true,
    },
  });

  // Plugins para mt8_1
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt8_1.id,
      pluginId: 'calendar',
      config: JSON.stringify({ enabled: true, frequency: 'daily', alarmTimes: ['09:00', '14:00'], checklistEnabled: false }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt8_1.id,
      pluginId: 'chart',
      config: JSON.stringify({ enabled: true, chartType: 'bar', metricType: 'sesiones-pomodoro', timeRange: 'week' }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt8_1.id,
      pluginId: 'pomodoro',
      config: JSON.stringify({ 
        enabled: true, 
        workDuration: 25, 
        shortBreakDuration: 5, 
        longBreakDuration: 15, 
        sessionsUntilLongBreak: 4, 
        autoLogToJournal: true, 
        soundEnabled: true 
      }),
      enabled: true,
    },
  });
  await prisma.miniTaskPlugin.create({
    data: {
      miniTaskId: mt8_1.id,
      pluginId: 'progress-tracker',
      config: JSON.stringify({ enabled: true, targetValue: 8, unit: 'sesiones' }),
      enabled: true,
    },
  });

  // Entrada del journal con progreso parcial (en proceso) - 2 sesiones Pomodoro completadas
  await prisma.miniTaskJournalEntry.create({
    data: {
      miniTaskId: mt8_1.id,
      entryDate: new Date(),
      notes: 'Completé 2 sesiones Pomodoro esta mañana. Voy bien encaminado con el capítulo.',
      timeSpent: 50, // 2 sesiones de 25 minutos = 50 minutos
      mood: 'positivo',
      progressValue: 2,
      progressUnit: 'sesiones',
    },
  });

  console.log('✅ Goal 8 (ACTIVE) creada con 1 minitask desbloqueada y plugin Pomodoro (2 sesiones completadas - estado en proceso)');

  console.log('\n📊 Resumen del seed:');
  console.log('  - 1 Goal COMPLETADA (con score, 3 minitasks completadas, 3 checkins)');
  console.log('  - 5 Goals ACTIVAS (con scores, minitasks mixtas, checkins, readjustments)');
  console.log('  - 2 Goals DRAFT (sin validar)');
  console.log('  - Total: 8 goals, 20 minitasks, 8 checkins, 1 readjustment, 2 suggested tasks');
  console.log('  - 2 Goals de un solo día con horas planificadas:');
  console.log('    * goal6: "Dedicar 2 horas a estudiar inglés hoy" (2 horas planificadas, 1 hora registrada)');
  console.log('    * goal7: "Pasar 3 horas trabajando en el proyecto de diseño hoy" (3 horas planificadas, 1.5 horas registradas)');
  console.log('  - 1 Goal con plugin Pomodoro:');
  console.log('    * goal8: "Completar capítulo del libro usando técnica Pomodoro" (2 sesiones completadas - estado en proceso)');
  console.log('  - 7 Minitasks DESBLOQUEADAS con plugins completos:');
  console.log('    * mt1_1: calendar, chart, progress-tracker, reminder (14 días de datos)');
  console.log('    * mt2_3: calendar (checklist diario), chart, progress-tracker, notification (21 días de datos)');
  console.log('    * mt2_unique: calendar (checklist multi-item evento único), chart (evento único)');
  console.log('    * mt3_3: calendar, chart, progress-tracker, reminder, mobile-push (28 días de datos)');
  console.log('    * mt6_1: calendar (con plannedHours: 2h), chart, progress-tracker (seguimiento por horas)');
  console.log('    * mt7_1: calendar (con plannedHours: 3h), chart, progress-tracker, reminder (seguimiento por horas)');
  console.log('    * mt8_1: calendar, chart, pomodoro, progress-tracker (plugin Pomodoro con auto-logging)');
  console.log('  - Entradas del journal con datos variados para visualización');
  console.log('  - Métricas históricas para gráficas en todos los plugins');
  console.log('  - Checklist multi-item con 5 elementos (3 completados) en mt2_unique');
  console.log('  - Estado "en proceso" en calendario: mt8_1 tiene entrada con progreso parcial (2 sesiones de 8)');
  console.log('\n🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
