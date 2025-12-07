import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { prisma } from '@/lib/prisma/client';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    
    // Borrar en cascada (orden importante por foreign keys)
    await prisma.suggestedMiniTask.deleteMany({
      where: {
        goal: {
          userId,
        },
      },
    });
    
    await prisma.readjustment.deleteMany({
      where: {
        goal: {
          userId,
        },
      },
    });
    
    await prisma.miniTask.deleteMany({
      where: {
        goal: {
          userId,
        },
      },
    });
    
    await prisma.smarterScore.deleteMany({
      where: {
        goal: {
          userId,
        },
      },
    });
    
    await prisma.goal.deleteMany({
      where: {
        userId,
      },
    });
    
    const duration = Date.now() - startTime;
    logApiRequest('DELETE', '/api/user/delete-all', 200, duration);
    
    return NextResponse.json({ success: true, message: 'Todos los datos han sido eliminados' });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('DELETE', '/api/user/delete-all', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar datos' },
      { status: 500 }
    );
  }
}


