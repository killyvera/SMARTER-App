/**
 * Evita filtrar claves API en respuestas al cliente y unifica el mensaje de configuración.
 */
export function sanitizeAgentApiErrorForClient(raw: string): string {
  const redacted = raw.replace(/sk-[a-zA-Z0-9_-]{8,}/gi, 'sk-…');
  const lower = raw.toLowerCase();
  const looksLikeProviderAuth =
    lower.includes('incorrect api key') ||
    lower.includes('invalid api key') ||
    lower.includes('api key provided') ||
    (lower.includes('401') && (lower.includes('openai') || lower.includes('api key'))) ||
    lower.includes('invalid_request_error') && lower.includes('api key');

  if (looksLikeProviderAuth || /sk-proj-|sk-live-|sk-test-/i.test(raw)) {
    return 'El agente no puede usar el modelo de IA: la clave no es válida o falta en el servidor. En Netlify: Site configuration → Environment variables → OPENAI_API_KEY (o credenciales de Azure si AI_PROVIDER=azure). Guardá, redeploy y no pegues la clave en el chat.';
  }

  return redacted;
}
