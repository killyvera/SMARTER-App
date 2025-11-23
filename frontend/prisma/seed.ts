import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');
  console.log('🗑️  Limpiando base de datos...');

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
  await prisma.checkIn.deleteMany({});
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
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date('2024-01-20').toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'daily', alarmTime: '09:00' } },
          { id: 'chart', config: { enabled: true, chartType: 'line', metricType: 'horas-estudiadas', timeRange: 'week' } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 40, unit: 'horas' } },
          { id: 'reminder', config: { enabled: true, times: ['09:00', '18:00'] } },
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
      config: JSON.stringify({ enabled: true, frequency: 'daily', alarmTime: '09:00' }),
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
      config: JSON.stringify({ enabled: true, times: ['09:00', '18:00'] }),
      enabled: true,
    },
  });

  // Métricas históricas para mt1_1 (últimas 2 semanas - fechas recientes)
  const today = new Date();
  const baseDate1 = new Date(today);
  baseDate1.setDate(baseDate1.getDate() - 14); // Hace 14 días
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(baseDate1);
    date.setDate(date.getDate() + i);
    date.setHours(9, 0, 0, 0); // Normalizar hora
    const hours = 1.5 + Math.random() * 2.5; // Entre 1.5 y 4 horas
    await prisma.miniTaskMetric.create({
      data: {
        miniTaskId: mt1_1.id,
        pluginId: 'progress-tracker',
        metricType: 'progress',
        value: JSON.stringify(hours),
        metadata: JSON.stringify({ unit: 'horas', entryDate: date.toISOString() }),
        recordedAt: date,
      },
    });
  }

  // Entradas del journal para mt1_1
  for (let i = 0; i < 14; i++) {
    const date = new Date(baseDate1);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    const hours = 1.5 + Math.random() * 2.5;
    const moods = ['positivo', 'neutral', 'negativo'];
    const obstacles = i % 3 === 0 ? 'Falta de tiempo, Distracciones' : null;
    
    await prisma.miniTaskJournalEntry.create({
      data: {
        miniTaskId: mt1_1.id,
        entryDate: date,
        progressValue: hours,
        progressUnit: 'horas',
        timeSpent: Math.round(hours * 60),
        notes: i % 2 === 0 ? `Estudié ${hours.toFixed(1)} horas hoy. ${i % 3 === 0 ? 'Fue un día productivo.' : 'Avancé bien con los ejercicios.'}` : null,
        obstacles: obstacles,
        mood: moods[i % 3],
        metricsData: JSON.stringify({ horasEstudiadas: hours, ejerciciosCompletados: Math.floor(hours * 2) }),
      },
    });
  }
  console.log('  ✅ mt1_1: 4 plugins, 14 métricas, 14 entradas journal');

  const mt1_2 = await prisma.miniTask.create({
    data: {
      goalId: goal1.id,
      title: 'Completar módulo de Next.js App Router',
      description: 'Dominar el App Router, Server Components y Data Fetching',
      status: 'COMPLETED',
      deadline: new Date('2024-04-15'),
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

  const mt1_3 = await prisma.miniTask.create({
    data: {
      goalId: goal1.id,
      title: 'Aprobar examen de certificación',
      description: 'Presentar y aprobar el examen final con más del 85%',
      status: 'COMPLETED',
      deadline: new Date('2024-11-10'),
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

  // CheckIns para goal completado
  await prisma.checkIn.create({
    data: {
      goalId: goal1.id,
      progressPercentage: 25,
      currentValue: 'Módulo 1 completado',
      notes: 'Buen progreso, entendiendo bien los conceptos',
      mood: 'motivado',
      createdAt: new Date('2024-02-20'),
    },
  });

  await prisma.checkIn.create({
    data: {
      goalId: goal1.id,
      progressPercentage: 60,
      currentValue: 'Módulo 2 completado, empezando módulo 3',
      notes: 'App Router es más complejo de lo esperado pero avanzando bien',
      mood: 'determinado',
      createdAt: new Date('2024-04-12'),
    },
  });

  await prisma.checkIn.create({
    data: {
      goalId: goal1.id,
      progressPercentage: 100,
      currentValue: 'Certificación obtenida con 92%',
      notes: '¡Meta completada! Muy satisfecho con el resultado',
      mood: 'feliz',
      createdAt: new Date('2024-11-12'),
    },
  });

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
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date('2024-10-20').toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'daily', alarmTime: '08:00' } },
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
      config: JSON.stringify({ enabled: true, frequency: 'daily', alarmTime: '08:00' }),
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
      createdAt: new Date('2024-11-15'),
    },
  });

  // CheckIns para goal activa
  await prisma.checkIn.create({
    data: {
      goalId: goal2.id,
      progressPercentage: 15,
      currentValue: 'Investigación completada, primer capítulo en progreso',
      notes: 'Buen inicio, encontré excelentes recursos',
      mood: 'entusiasmado',
      createdAt: new Date('2024-09-25'),
    },
  });

  await prisma.checkIn.create({
    data: {
      goalId: goal2.id,
      progressPercentage: 30,
      currentValue: 'Primer capítulo completado (20 páginas)',
      notes: 'Progreso constante, escribiendo 2-3 páginas por día',
      mood: 'motivado',
      createdAt: new Date('2024-10-18'),
    },
  });

  await prisma.checkIn.create({
    data: {
      goalId: goal2.id,
      progressPercentage: 45,
      currentValue: 'Segundo capítulo al 60%',
      notes: 'Algunos días sin escribir, necesito retomar el ritmo',
      mood: 'determinado',
      createdAt: new Date('2024-11-20'),
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

  console.log('✅ Goal 2 (ACTIVA) creada con 5 minitasks (2 completadas, 2 pendientes, 1 draft), 3 checkins, 1 readjustment y 2 sugerencias');

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
      metricsConfig: JSON.stringify({
        unlocked: true,
        unlockedAt: new Date('2024-10-20').toISOString(),
        plugins: [
          { id: 'calendar', config: { enabled: true, frequency: 'weekly', alarmTime: '06:00' } },
          { id: 'chart', config: { enabled: true, chartType: 'area', metricType: 'kilómetros-corridos', timeRange: 'month' } },
          { id: 'progress-tracker', config: { enabled: true, targetValue: 21, unit: 'km' } },
          { id: 'reminder', config: { enabled: true, times: ['06:00'] } },
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
      config: JSON.stringify({ enabled: true, frequency: 'weekly', alarmTime: '06:00' }),
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
      config: JSON.stringify({ enabled: true, times: ['06:00'] }),
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
      createdAt: new Date('2024-11-01'),
    },
  });

  // CheckIns para goal3
  await prisma.checkIn.create({
    data: {
      goalId: goal3.id,
      progressPercentage: 20,
      currentValue: '5 km completados sin parar',
      notes: 'Me siento bien, el entrenamiento está funcionando',
      mood: 'motivado',
      createdAt: new Date('2024-09-12'),
    },
  });

  await prisma.checkIn.create({
    data: {
      goalId: goal3.id,
      progressPercentage: 40,
      currentValue: '10 km completados, empezando entrenamiento de resistencia',
      notes: 'Progreso constante, aumentando distancia gradualmente',
      mood: 'determinado',
      createdAt: new Date('2024-10-18'),
    },
  });

  console.log('✅ Goal 3 (ACTIVA) creada con 4 minitasks (2 completadas, 2 pendientes) y 2 checkins');

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
  await prisma.miniTask.create({
    data: {
      goalId: goal4.id,
      title: 'Completar curso de inglés nivel A2',
      description: 'Terminar el curso básico de inglés',
      status: 'DRAFT',
      deadline: new Date('2025-02-28'),
      createdAt: new Date('2024-11-05'),
    },
  });

  await prisma.miniTask.create({
    data: {
      goalId: goal4.id,
      title: 'Completar curso de inglés nivel B1',
      description: 'Avanzar al nivel intermedio',
      status: 'DRAFT',
      deadline: new Date('2025-05-31'),
      createdAt: new Date('2024-11-05'),
    },
  });

  await prisma.miniTask.create({
    data: {
      goalId: goal4.id,
      title: 'Aprobar examen B2 oficial',
      description: 'Presentar y aprobar el examen de certificación B2',
      status: 'DRAFT',
      deadline: new Date('2025-08-15'),
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
      createdAt: new Date('2024-11-12'),
    },
  });

  console.log('✅ Goal 5 (DRAFT) creada con 1 minitask en draft');

  console.log('\n📊 Resumen del seed:');
  console.log('  - 1 Goal COMPLETADA (con score, 3 minitasks completadas, 3 checkins)');
  console.log('  - 2 Goals ACTIVAS (con scores, minitasks mixtas, checkins, readjustments)');
  console.log('  - 2 Goals DRAFT (sin validar)');
  console.log('  - Total: 5 goals, 16 minitasks, 8 checkins, 1 readjustment, 2 suggested tasks');
  console.log('  - 3 Minitasks DESBLOQUEADAS con plugins completos:');
  console.log('    * mt1_1: calendar, chart, progress-tracker, reminder (14 días de datos)');
  console.log('    * mt2_3: calendar, chart, progress-tracker, notification (21 días de datos)');
  console.log('    * mt3_3: calendar, chart, progress-tracker, reminder, mobile-push (28 días de datos)');
  console.log('  - Entradas del journal con datos variados para visualización');
  console.log('  - Métricas históricas para gráficas en todos los plugins');
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
