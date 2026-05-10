/**
 * Evita filtrar claves API en respuestas al cliente y unifica el mensaje de configuración.
 */
export function sanitizeAgentApiErrorForClient(raw: string): string {
  let redacted = raw.replace(/sk-[a-zA-Z0-9_-]{10,}/gi, 'sk-…');
  redacted = redacted.replace(/sk-proj-[a-zA-Z0-9_-]{6,}/gi, 'sk-proj-…');
  redacted = redacted.replace(/Bearer\s+[^\s]+/gi, 'Bearer …');
  const lower = redacted.toLowerCase();
  const looksLikeProviderAuth =
    lower.includes('incorrect api key') ||
    lower.includes('invalid api key') ||
    lower.includes('api key provided') ||
    lower.includes('authentication_error') ||
    lower.includes('invalid_request_error') ||
    (lower.includes('401') && (lower.includes('openai') || lower.includes('api key') || lower.includes('azure'))) ||
    lower.includes('wrong api key') ||
    lower.includes('no api key');

  if (looksLikeProviderAuth || /sk-proj-|sk-live-|sk-test-/i.test(raw)) {
    return 'El agente no puede usar el modelo de IA: la clave no es válida o falta en el servidor. En Netlify: Site configuration → Environment variables → OPENAI_API_KEY (o credenciales de Azure si AI_PROVIDER=azure). Guardá, redeploy y no pegues la clave en el chat.';
  }

  return redacted;
}

/** Mensajes técnicos del servidor → texto útil para el usuario en el chat. */
export function friendlyAgentToolMessage(raw: string): string {
  const t = raw.trim();
  const low = t.toLowerCase();
  if (low.includes('goal no encontrado') || low.includes('meta no encontrad') || low.includes('foreign key')) {
    return 'No se pudo crear la tarea: falta una meta válida o el identificador de meta no coincide con tu cuenta. Pedile al agente que cree una meta en borrador o que elijas una desde Metas, y después volvé a crear la minitask.';
  }
  if (low.includes('no tenés ninguna meta')) {
    return t;
  }
  return t;
}
