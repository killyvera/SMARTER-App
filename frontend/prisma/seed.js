import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth.js';
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
    }
    else {
        const passwordHash = await hashPassword(defaultPassword);
        user = await prisma.user.create({
            data: {
                email: defaultEmail,
                passwordHash,
            },
        });
        console.log('✅ Usuario local creado:', user.email);
    }
    // Crear goals de ejemplo
    const goals = await prisma.goal.findMany({
        where: { userId: user.id },
    });
    if (goals.length === 0) {
        const goal1 = await prisma.goal.create({
            data: {
                userId: user.id,
                title: 'Escribir un libro de 200 páginas sobre productividad',
                description: 'Completar un libro completo sobre técnicas de productividad personal',
                status: 'DRAFT',
                deadline: new Date('2024-12-31'),
            },
        });
        const goal2 = await prisma.goal.create({
            data: {
                userId: user.id,
                title: 'Aprender React y Next.js avanzado',
                description: 'Dominar React Server Components, Suspense y otras características avanzadas',
                status: 'DRAFT',
                deadline: new Date('2024-06-30'),
            },
        });
        console.log('✅ Goals de ejemplo creados');
        // Crear minitasks de ejemplo
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
                goalId: goal2.id,
                title: 'Completar curso de Next.js 14',
                description: 'Terminar el curso oficial de Next.js 14',
                status: 'DRAFT',
                deadline: new Date('2024-03-15'),
            },
        });
        console.log('✅ MiniTasks de ejemplo creadas');
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
    }
    else {
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
