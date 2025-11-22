import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuario local por defecto
  const defaultEmail = 'user@local';
  const defaultPassword = 'password123'; // Cambiar en producción

  const existingUser = await prisma.user.findUnique({
    where: { email: defaultEmail },
  });

  let user;
  if (existingUser) {
    console.log('✅ Usuario local ya existe');
    user = existingUser;
  } else {
    const passwordHash = await hashPassword(defaultPassword);
    user = await prisma.user.create({
      data: {
        email: defaultEmail,
        passwordHash,
      },
    });
    console.log('✅ Usuario local creado:', user.email);
  }

  // Eliminar goals existentes para recrearlos con más datos
  const existingGoals = await prisma.goal.findMany({
    where: { userId: user.id },
  });

  if (existingGoals.length > 0) {
    console.log(`🗑️  Eliminando ${existingGoals.length} goals existentes...`);
    // Eliminar en cascada (minitasks y checkins se eliminan automáticamente)
    await prisma.goal.deleteMany({
      where: { userId: user.id },
    });
  }

  // Crear goals de ejemplo
  if (existingGoals.length === 0 || existingGoals.length < 4) {
    // Goal 1: Escribir libro
    const goal1 = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Escribir un libro de 200 páginas sobre productividad',
        description: 'Completar un libro completo sobre técnicas de productividad personal',
        status: 'DRAFT',
        deadline: new Date('2024-12-31'),
      },
    });

    // Goal 2: Aprender React/Next.js
    const goal2 = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Aprender React y Next.js avanzado',
        description: 'Dominar React Server Components, Suspense y otras características avanzadas',
        status: 'DRAFT',
        deadline: new Date('2024-06-30'),
      },
    });

    // Goal 3: Ejercicio físico
    const goal3 = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Correr una maratón completa',
        description: 'Completar una maratón de 42.2 km en menos de 4 horas',
        status: 'DRAFT',
        deadline: new Date('2024-10-15'),
      },
    });

    // Goal 4: Aprender idioma
    const goal4 = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Alcanzar nivel B2 en inglés',
        description: 'Completar curso y certificación de nivel B2 en inglés',
        status: 'DRAFT',
        deadline: new Date('2024-08-31'),
      },
    });

    console.log('✅ Goals de ejemplo creados (4 goals)');

    // Minitasks para Goal 1
    await prisma.miniTask.create({
      data: {
        goalId: goal1.id,
        title: 'Escribir el primer capítulo (20 páginas)',
        description: 'Completar la introducción y el primer capítulo del libro',
        status: 'DRAFT',
        deadline: new Date('2024-02-28'),
      },
    });

    await prisma.miniTask.create({
      data: {
        goalId: goal1.id,
        title: 'Investigar técnicas de productividad',
        description: 'Revisar 10 libros y artículos sobre productividad',
        status: 'DRAFT',
        deadline: new Date('2024-02-15'),
      },
    });

    await prisma.miniTask.create({
      data: {
        goalId: goal1.id,
        title: 'Escribir segundo capítulo (25 páginas)',
        description: 'Desarrollar el capítulo sobre gestión del tiempo',
        status: 'DRAFT',
        deadline: new Date('2024-03-31'),
      },
    });

    // Minitasks para Goal 2
    await prisma.miniTask.create({
      data: {
        goalId: goal2.id,
        title: 'Completar curso de Next.js 14',
        description: 'Terminar el curso oficial de Next.js 14',
        status: 'DRAFT',
        deadline: new Date('2024-03-15'),
      },
    });

    await prisma.miniTask.create({
      data: {
        goalId: goal2.id,
        title: 'Construir proyecto práctico con Server Components',
        description: 'Crear una app completa usando Server Components',
        status: 'DRAFT',
        deadline: new Date('2024-04-30'),
      },
    });

    await prisma.miniTask.create({
      data: {
        goalId: goal2.id,
        title: 'Aprender Suspense y Streaming',
        description: 'Dominar el uso de Suspense para loading states',
        status: 'DRAFT',
        deadline: new Date('2024-04-15'),
      },
    });

    // Minitasks para Goal 3
    await prisma.miniTask.create({
      data: {
        goalId: goal3.id,
        title: 'Correr 5 km sin parar',
        description: 'Alcanzar la capacidad de correr 5 km continuos',
        status: 'DRAFT',
        deadline: new Date('2024-03-31'),
      },
    });

    await prisma.miniTask.create({
      data: {
        goalId: goal3.id,
        title: 'Correr 10 km sin parar',
        description: 'Aumentar la distancia a 10 km',
        status: 'DRAFT',
        deadline: new Date('2024-05-31'),
      },
    });

    await prisma.miniTask.create({
      data: {
        goalId: goal3.id,
        title: 'Correr media maratón (21 km)',
        description: 'Completar una media maratón como preparación',
        status: 'DRAFT',
        deadline: new Date('2024-08-31'),
      },
    });

    // Minitasks para Goal 4
    await prisma.miniTask.create({
      data: {
        goalId: goal4.id,
        title: 'Completar curso de inglés nivel A2',
        description: 'Terminar el curso básico de inglés',
        status: 'DRAFT',
        deadline: new Date('2024-04-30'),
      },
    });

    await prisma.miniTask.create({
      data: {
        goalId: goal4.id,
        title: 'Completar curso de inglés nivel B1',
        description: 'Avanzar al nivel intermedio',
        status: 'DRAFT',
        deadline: new Date('2024-06-30'),
      },
    });

    await prisma.miniTask.create({
      data: {
        goalId: goal4.id,
        title: 'Aprobar examen B2 oficial',
        description: 'Presentar y aprobar el examen de certificación B2',
        status: 'DRAFT',
        deadline: new Date('2024-08-15'),
      },
    });

    console.log('✅ MiniTasks de ejemplo creadas (12 minitasks en total)');

    // Crear check-ins de ejemplo
    await prisma.checkIn.create({
      data: {
        goalId: goal1.id,
        progressPercentage: 15,
        currentValue: '3 capítulos completados',
        notes: 'Buen progreso en la primera semana',
        mood: 'motivado',
      },
    });

    await prisma.checkIn.create({
      data: {
        goalId: goal2.id,
        progressPercentage: 30,
        currentValue: 'Curso al 30%',
        notes: 'Aprendiendo Server Components',
        mood: 'entusiasmado',
      },
    });

    console.log('✅ Check-ins de ejemplo creados');
  } else {
    console.log('✅ Ya existen goals de ejemplo');
  }

  console.log('🎉 Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


