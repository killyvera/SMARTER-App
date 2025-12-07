import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { findUserById, updateUserPassword } from '@/repositories/userRepository';
import { changePasswordSchema } from '@smarter-app/shared';
import { logApiRequest, logApiError } from '@/lib/api-logger';
import bcrypt from 'bcryptjs';

// PATCH /api/user/password - Cambiar contraseña del usuario
export async function PATCH(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    const data = changePasswordSchema.parse(body);
    
    // Obtener usuario actual
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash
    );
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 401 }
      );
    }
    
    // Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);
    
    // Actualizar contraseña
    await updateUserPassword(userId, newPasswordHash);
    
    const duration = Date.now() - startTime;
    logApiRequest('PATCH', '/api/user/password', 200, duration);
    
    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('PATCH', '/api/user/password', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al cambiar contraseña' },
      { status: 500 }
    );
  }
}

