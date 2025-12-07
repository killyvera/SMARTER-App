import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { findUserById, updateUserProfile } from '@/repositories/userRepository';
import { updateProfileSchema, userProfileResponseSchema } from '@smarter-app/shared';
import { logApiRequest, logApiError } from '@/lib/api-logger';

// GET /api/user/profile - Obtener perfil del usuario
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const user = await findUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    const profile = userProfileResponseSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      biometricEnabled: user.biometricEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    
    const duration = Date.now() - startTime;
    logApiRequest('GET', '/api/user/profile', 200, duration);
    
    return NextResponse.json(profile);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('GET', '/api/user/profile', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/profile - Actualizar perfil del usuario
export async function PATCH(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    // Solo validar y actualizar campos que están presentes en el body
    const updateData: { name?: string | null; phone?: string | null; avatarUrl?: string | null } = {};
    
    if ('name' in body) {
      if (body.name === '' || body.name === null) {
        updateData.name = null;
      } else if (typeof body.name === 'string' && body.name.length > 0) {
        updateData.name = body.name;
      }
    }
    
    if ('phone' in body) {
      if (body.phone === '' || body.phone === null) {
        updateData.phone = null;
      } else if (typeof body.phone === 'string' && body.phone.length > 0) {
        updateData.phone = body.phone;
      }
    }
    
    if ('avatarUrl' in body) {
      if (body.avatarUrl === '' || body.avatarUrl === null) {
        updateData.avatarUrl = null;
      } else if (typeof body.avatarUrl === 'string' && body.avatarUrl.length > 0) {
        updateData.avatarUrl = body.avatarUrl;
      }
    }
    
    // Validar solo los campos que se van a actualizar
    if (Object.keys(updateData).length > 0) {
      updateProfileSchema.partial().parse(updateData);
    }
    
    const updatedUser = await updateUserProfile(userId, updateData);
    
    const profile = userProfileResponseSchema.parse({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      biometricEnabled: updatedUser.biometricEnabled,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
    
    const duration = Date.now() - startTime;
    logApiRequest('PATCH', '/api/user/profile', 200, duration);
    
    return NextResponse.json(profile);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('PATCH', '/api/user/profile', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}

