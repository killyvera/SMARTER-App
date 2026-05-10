import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '@/config/env';

const TTL_MS = 15 * 60 * 1000;

export interface ToolApprovalPayload {
  userId: string;
  toolCallId: string;
  name: string;
  arguments: string;
  iat: number;
  exp: number;
}

function approvalSecret(): string {
  return env.JWT_SECRET || env.DATABASE_URL;
}

function signPayload(payload: ToolApprovalPayload): string {
  const body = JSON.stringify({
    userId: payload.userId,
    toolCallId: payload.toolCallId,
    name: payload.name,
    arguments: payload.arguments,
    iat: payload.iat,
    exp: payload.exp,
  });
  return createHmac('sha256', approvalSecret()).update(body).digest('base64url');
}

/**
 * Token transportable al cliente; solo el servidor puede verificar y ejecutar.
 */
export function mintToolApprovalToken(payload: ToolApprovalPayload): string {
  const sig = signPayload(payload);
  const envelope = { ...payload, sig };
  return Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64url');
}

export function verifyToolApprovalToken(
  token: string,
  expectedUserId: string
): ToolApprovalPayload | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as ToolApprovalPayload & { sig?: string };
    const { sig, ...rest } = parsed;
    if (!sig || typeof sig !== 'string') return null;
    const payload = rest as ToolApprovalPayload;
    if (payload.userId !== expectedUserId) return null;
    const now = Date.now();
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    const expected = signPayload(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function defaultApprovalWindow(): { iat: number; exp: number } {
  const iat = Date.now();
  return { iat, exp: iat + TTL_MS };
}
