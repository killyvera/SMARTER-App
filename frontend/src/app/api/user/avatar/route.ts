import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getUserId } from '@/lib/auth/getUserId';
import { findUserById, updateUserProfile } from '@/repositories/userRepository';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logApiRequest, logApiError } from '@/lib/api-logger';

const BUCKET = 'avatars';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

function extractAvatarsStoragePath(publicUrl: string): string | null {
  try {
    const u = new URL(publicUrl);
    const prefix = `/storage/v1/object/public/${BUCKET}/`;
    if (!u.pathname.startsWith(prefix)) return null;
    return decodeURIComponent(u.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const userId = await getUserId(request);
    const formData = await request.formData();
    const raw = formData.get('file');
    if (!raw || typeof raw === 'string') {
      return NextResponse.json({ error: 'Falta el archivo (campo file)' }, { status: 400 });
    }

    const file = raw as File;
    const type = file.type || '';
    const ext = ALLOWED.get(type);
    if (!ext) {
      return NextResponse.json(
        { error: 'Formato no permitido. Usá JPEG, PNG, WebP o GIF.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'La imagen no puede superar 5 MB' }, { status: 400 });
    }

    let admin;
    try {
      admin = getSupabaseAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Supabase no configurado';
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const oldPath = user.avatarUrl ? extractAvatarsStoragePath(user.avatarUrl) : null;
    if (oldPath && oldPath.startsWith(`${userId}/`)) {
      await admin.storage.from(BUCKET).remove([oldPath]);
    }

    const objectPath = `${userId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from(BUCKET).upload(objectPath, buffer, {
      contentType: type,
      upsert: false,
    });
    if (upErr) {
      console.error('[avatar] storage upload', upErr);
      return NextResponse.json({ error: 'No se pudo subir la imagen' }, { status: 500 });
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(objectPath);
    const publicUrl = pub.publicUrl;

    await updateUserProfile(userId, { avatarUrl: publicUrl });

    logApiRequest('POST', '/api/user/avatar', 200, Date.now() - start);
    return NextResponse.json({ avatarUrl: publicUrl });
  } catch (error) {
    logApiError('POST', '/api/user/avatar', error);
    const msg = error instanceof Error ? error.message : 'Error al subir avatar';
    const isAuth =
      typeof msg === 'string' &&
      (msg.includes('Token') ||
        msg.includes('autenticación') ||
        msg.includes('authentication') ||
        msg.includes('No autorizado'));
    return NextResponse.json({ error: msg }, { status: isAuth ? 401 : 500 });
  }
}

/** Quita avatar en Storage (si aplica) y deja avatarUrl en null. */
export async function DELETE(request: NextRequest) {
  const start = Date.now();
  try {
    const userId = await getUserId(request);
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const oldPath = user.avatarUrl ? extractAvatarsStoragePath(user.avatarUrl) : null;
    if (oldPath && oldPath.startsWith(`${userId}/`)) {
      try {
        const admin = getSupabaseAdmin();
        await admin.storage.from(BUCKET).remove([oldPath]);
      } catch {
        /* sin service_role o fallo Storage: igual limpiamos la URL en BD */
      }
    }

    await updateUserProfile(userId, { avatarUrl: null });
    logApiRequest('DELETE', '/api/user/avatar', 200, Date.now() - start);
    return NextResponse.json({ avatarUrl: null });
  } catch (error) {
    logApiError('DELETE', '/api/user/avatar', error);
    const msg = error instanceof Error ? error.message : 'Error al quitar avatar';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
