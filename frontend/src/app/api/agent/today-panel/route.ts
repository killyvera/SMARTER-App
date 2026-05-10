import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { buildTodayPanelPayload } from '@/services/agentTodayPanelService';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const userId = await getUserId(request);
    const payload = await buildTodayPanelPayload(userId);
    const duration = Date.now() - start;
    logApiRequest('GET', '/api/agent/today-panel', 200, duration);
    return NextResponse.json(payload);
  } catch (error) {
    const duration = Date.now() - start;
    logApiError('GET', '/api/agent/today-panel', error);
    const msg = error instanceof Error ? error.message : 'Error al cargar panel hoy';
    const status =
      typeof msg === 'string' &&
      (msg.includes('Token') || msg.includes('autenticación') || msg.includes('No autorizado'))
        ? 401
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
