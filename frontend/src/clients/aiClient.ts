import OpenAI from 'openai';
import { env } from '@/config/env';
import type { SmarterScore } from '@smarter-app/shared';
import type { UnlockMiniTaskResponse, PluginType } from '@smarter-app/shared';
import type { CoachQueryRequest, CoachQueryResponse, CoachSuggestion, MiniTaskCoachContext } from '@/types/miniTaskJournal';

// Importar servicios de protección
import { checkAllRateLimits, RateLimitError } from '@/services/aiRateLimiter';
import { checkCircuitBreakerState, recordSuccess, recordFailure, CircuitBreakerError } from '@/services/aiCircuitBreaker';
import { executeOpenAICallWithTimeout, TimeoutError } from '@/services/aiTimeoutHandler';
import { validateInput, sanitizeInput, ValidationError } from '@/services/aiInputValidator';
import { getCachedResult, cacheResult } from '@/services/aiRequestDeduplicator';
import { retry } from '@/services/aiRetryHandler';
import { checkLoop, LoopDetectionError } from '@/services/aiLoopDetector';
import { enqueue } from '@/services/aiRequestQueue';
import { trackRequest } from '@/services/aiRequestTracker';
import { createHash } from 'crypto';
import { GLOBAL_AGENT_TOOLS, AGENT_TOOL_NAME_SET } from '@/config/agentOpenAiTools';
import { AGENT_API_CATALOG } from '@/config/agentApiCatalog';

export interface SuggestedMiniTask {
  title: string;
  description?: string;
  priority: number;
}

// Cliente OpenAI (default)
let openaiClient: OpenAI | null = null;

// Cliente Azure OpenAI (opcional)
let azureClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

function getAzureClient(): OpenAI {
  if (!azureClient) {
    if (!env.AZURE_OPENAI_ENDPOINT || !env.AZURE_OPENAI_API_KEY) {
      throw new Error('Credenciales de Azure OpenAI no están configuradas');
    }
    azureClient = new OpenAI({
      apiKey: env.AZURE_OPENAI_API_KEY,
      baseURL: `${env.AZURE_OPENAI_ENDPOINT}openai/deployments/${env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': env.AZURE_OPENAI_API_VERSION },
      defaultHeaders: {
        'api-key': env.AZURE_OPENAI_API_KEY,
      },
    });
  }
  return azureClient;
}

function getClient(): OpenAI {
  if (env.AI_PROVIDER === 'azure') {
    return getAzureClient();
  }
  return getOpenAIClient();
}

function getModel(): string {
  if (env.AI_PROVIDER === 'azure') {
    return env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.OPENAI_MODEL || 'gpt-4';
  }
  return env.OPENAI_MODEL;
}

/**
 * Determina si el modelo soporta response_format: json_object
 * Los modelos que soportan json_object son generalmente los más recientes:
 * - gpt-4-turbo, gpt-4-1106-preview, gpt-4o, gpt-4o-mini
 * - gpt-3.5-turbo-1106 o versiones más recientes
 * Los modelos más antiguos como gpt-4, gpt-3.5-turbo (sin versión) no lo soportan
 */
function supportsJsonObjectFormat(model: string): boolean {
  const modelLower = model.toLowerCase();
  
  // Modelos que soportan json_object
  const supportedModels = [
    'gpt-4-turbo',
    'gpt-4-1106',
    'gpt-4-0125',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo-0125',
  ];
  
  // Verificar si el modelo está en la lista de soportados
  for (const supported of supportedModels) {
    if (modelLower.includes(supported)) {
      return true;
    }
  }
  
  // Para Azure OpenAI, generalmente los deployments más recientes lo soportan
  // Pero es más seguro asumir que no lo soporta a menos que se especifique
  if (env.AI_PROVIDER === 'azure') {
    // Si el deployment name contiene indicadores de modelos recientes, asumir soporte
    return modelLower.includes('turbo') || modelLower.includes('gpt-4o') || modelLower.includes('1106') || modelLower.includes('0125');
  }
  
  // Por defecto, no usar json_object para evitar errores
  return false;
}

/**
 * Obtiene el objeto response_format si el modelo lo soporta
 * @returns response_format object o undefined
 */
function getResponseFormat(model: string): { type: 'json_object' } | undefined {
  if (supportsJsonObjectFormat(model)) {
    return { type: 'json_object' };
  }
  return undefined;
}

export interface GoalValidationRequest {
  title: string;
  description?: string;
  deadline?: string;
  userContext?: string;
}

export interface GoalValidationResponse {
  scores: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timebound: number;
    evaluate: number;
    readjust: number;
  };
  average: number;
  passed: boolean;
  feedback: string;
  suggestedTitle?: string | null;
  suggestedDescription?: string | null;
  isSingleDayGoal?: boolean;
  plannedHours?: number;
  suggestedMiniTasks?: Array<{
    title: string;
    description?: string;
    priority: string; // 'high' | 'medium' | 'low'
    order?: number;
    dependsOn?: string | null; // Título de la minitask dependiente
    schedulingType?: string | null; // 'sequential' | 'parallel' | 'daily' | 'scheduled'
    scheduledDate?: string | null; // ISO date string
    scheduledTime?: string | null; // HH:mm format
  }>;
}

export interface MiniTaskValidationRequest {
  title: string;
  description?: string;
  deadline?: string;
  goalContext: {
    title: string;
    description?: string;
  };
}

export interface MiniTaskValidationResponse {
  scores: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timebound: number;
  };
  average: number;
  passed: boolean;
  feedback: string;
  isAction: boolean;
}

const GOAL_VALIDATION_PROMPT = `Eres un experto en metodología SMARTER para evaluación de metas. 
Evalúa la siguiente meta y proporciona puntuaciones del 0 al 100 para cada criterio SMARTER:

S (Specific - Específica): ¿Es la meta clara y específica?
M (Measurable - Medible): ¿Se puede medir el progreso?
A (Achievable - Alcanzable): ¿Es realista y alcanzable?
R (Relevant - Relevante): ¿Es relevante para el usuario?
T (Time-bound - Con plazo): ¿Tiene un plazo definido?
E (Evaluate - Evaluable): ¿Se puede evaluar el progreso?
R (Readjust - Reajustable): ¿Se puede reajustar si es necesario?

IMPORTANTE - DEBES SIEMPRE GENERAR:
1. Analizar el título y SIEMPRE sugerir una versión mejorada (aunque sea mínima) que sea más específica, medible y clara. Si el título es perfecto, sugiere una versión alternativa igualmente válida.
2. Analizar la descripción y SIEMPRE sugerir mejoras (aunque sean mínimas) con más detalles medibles. Si la descripción es perfecta, agrega detalles adicionales útiles.
3. SIEMPRE generar al menos 3-5 minitareas sugeridas que ayuden a alcanzar la meta. Cada minitarea debe ser una acción concreta y medible.

NUNCA retornes null para suggestedTitle, suggestedDescription o un array vacío para suggestedMiniTasks. Siempre proporciona sugerencias útiles.

Responde SOLO con un JSON válido en este formato exacto:
{
  "scores": {
    "specific": <número 0-100>,
    "measurable": <número 0-100>,
    "achievable": <número 0-100>,
    "relevant": <número 0-100>,
    "timebound": <número 0-100>,
    "evaluate": <número 0-100>,
    "readjust": <número 0-100>
  },
  "average": <promedio de los 7 scores>,
  "passed": <true si S, M, A, R, T >= 60 y average >= 70, false en caso contrario>,
  "feedback": "<comentario breve sobre la meta>",
  "suggestedTitle": "<título mejorado que sea más específico y medible - SIEMPRE proporciona una sugerencia>",
  "suggestedDescription": "<descripción mejorada con más detalles medibles - SIEMPRE proporciona una sugerencia>",
  "isSingleDayGoal": <true|false opcional, true si es goal de un solo día>,
  "plannedHours": <número opcional, horas planificadas si es de un solo día>,
  "suggestedMiniTasks": [
    {
      "title": "<título de minitarea sugerida - debe ser una acción concreta>",
      "description": "<descripción opcional de la minitarea>",
      "priority": "<high|medium|low> - prioridad de la minitarea",
      "order": <número 0-N> - orden sugerido (0 = primera, 1 = segunda, etc.),
      "dependsOn": "<id de otra minitask o null> - si esta minitask depende de otra",
      "schedulingType": "<sequential|parallel|daily|scheduled> - tipo de scheduling",
      "scheduledDate": "<fecha ISO opcional> - si es scheduled, fecha específica",
      "scheduledTime": "<HH:mm opcional> - si es scheduled, hora específica"
    }
  ]
}

IMPORTANTE - ORDEN Y PRIORIDAD DE MINITASKS:
- Analiza las minitareas sugeridas y asigna un orden lógico (order: 0, 1, 2...)
- Considera dependencias naturales: algunas tareas deben completarse antes que otras
- Asigna prioridad (high, medium, low) basada en importancia y urgencia
- Determina schedulingType:
  * sequential: debe completarse una tras otra
  * parallel: pueden trabajarse en paralelo
  * daily: tarea diaria repetitiva
  * scheduled: fecha/hora específica
- Si hay dependencias, indica dependsOn con el título de la minitask dependiente (el sistema la resolverá)`;

const MINITASK_VALIDATION_PROMPT = `Eres un experto en metodología SMARTER para evaluación de minitareas. 
Evalúa la siguiente minitarea y verifica que sea una ACCIÓN CONCRETA (no un resultado abstracto).

Criterios SMARTER (sin E y R):
S (Specific - Específica): ¿Es la acción clara y específica?
M (Measurable - Medible): ¿Se puede medir si se completó?
A (Achievable - Alcanzable): ¿Es realista completarla?
R (Relevant - Relevante): ¿Es relevante para la meta?
T (Time-bound - Con plazo): ¿Tiene un plazo definido?

IMPORTANTE: La minitarea DEBE ser una acción concreta (ej: "Escribir 500 palabras del capítulo 1") 
NO un resultado abstracto (ej: "Tener el capítulo 1 escrito").

Responde SOLO con un JSON válido en este formato exacto:
{
  "scores": {
    "specific": <número 0-100>,
    "measurable": <número 0-100>,
    "achievable": <número 0-100>,
    "relevant": <número 0-100>,
    "timebound": <número 0-100>
  },
  "average": <promedio de los 5 scores>,
  "passed": <true si todos los scores >= 60 y average >= 70, false en caso contrario>,
  "feedback": "<comentario breve sobre la minitarea>",
  "isAction": <true si es una acción concreta, false si es un resultado abstracto>
}`;

/**
 * Helper para crear hash del input (para tracking y deduplicación)
 */
function createInputHash(input: any): string {
  const inputString = JSON.stringify(input);
  return createHash('sha256').update(inputString).digest('hex').substring(0, 16);
}

/**
 * Wrapper protegido para llamadas a OpenAI
 */
async function protectedAICall<T>(
  operation: string,
  userId: string,
  input: any,
  callFn: (signal: AbortSignal) => Promise<T>,
  ip?: string
): Promise<T> {
  const startTime = Date.now();
  const inputHash = createInputHash(input);
  let status: 'success' | 'failure' | 'timeout' | 'rate_limited' | 'circuit_open' = 'success';
  
  try {
    // 1. Validar input
    await validateInput(operation, input);
    
    // 2. Sanitizar input
    const sanitizedInput = sanitizeInput(input);
    
    // 3. Verificar rate limits
    try {
      await checkAllRateLimits(operation, userId, ip);
    } catch (error) {
      if (error instanceof RateLimitError) {
        status = 'rate_limited';
        await trackRequest(operation, status, userId, Date.now() - startTime, inputHash, error);
        throw error;
      }
      throw error;
    }
    
    // 4. Verificar circuit breaker
    try {
      await checkCircuitBreakerState(operation);
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        status = 'circuit_open';
        await trackRequest(operation, status, userId, Date.now() - startTime, inputHash, error);
        throw error;
      }
      throw error;
    }
    
    // 5. Verificar deduplicación
    const cached = await getCachedResult<T>(operation, userId, sanitizedInput);
    if (cached) {
      await trackRequest(operation, 'success', userId, Date.now() - startTime, inputHash);
      return cached;
    }
    
    // 6. Verificar loop detection
    try {
      await checkLoop(operation, userId, sanitizedInput);
    } catch (error) {
      if (error instanceof LoopDetectionError) {
        status = 'failure';
        await trackRequest(operation, status, userId, Date.now() - startTime, inputHash, error);
        throw error;
      }
      throw error;
    }
    
    // 7. Ejecutar con timeout y retry
    const result = await retry(
      async () => {
        try {
          return await executeOpenAICallWithTimeout(operation, callFn);
        } catch (error: any) {
          if (error instanceof TimeoutError) {
            status = 'timeout';
          }
          throw error;
        }
      },
      undefined,
      { maxAttempts: 3, baseDelay: 1000 }
    );
    
    // 8. Cachear resultado
    await cacheResult(operation, userId, sanitizedInput, result);
    
    // 9. Registrar éxito
    const duration = Date.now() - startTime;
    await trackRequest(operation, 'success', userId, duration, inputHash);
    
    // 10. Registrar éxito en circuit breaker
    await recordSuccess(operation);
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Determinar status final
    if (error instanceof TimeoutError) {
      status = 'timeout';
    } else if (error instanceof RateLimitError) {
      status = 'rate_limited';
    } else if (error instanceof CircuitBreakerError) {
      status = 'circuit_open';
    } else {
      status = 'failure';
    }
    
    // Registrar fallo
    await trackRequest(operation, status, userId, duration, inputHash, error);
    
    // Registrar fallo en circuit breaker (excepto para timeouts esperados)
    if (status !== 'timeout') {
      await recordFailure(operation);
    }
    
    // Re-lanzar error
    throw error;
  }
}

function extractJsonFromModelContent(content: string): string {
  const trimmed = content.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im.exec(trimmed);
  if (fence) {
    return fence[1].trim();
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function toScoreNumber(value: unknown, label: string): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Respuesta del modelo de IA inválida: score "${label}" no es un número válido`);
  }
  return n;
}

function normalizeGoalValidationScores(raw: unknown): GoalValidationResponse['scores'] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respuesta del modelo de IA inválida: faltan scores');
  }
  const s = raw as Record<string, unknown>;
  const scores: GoalValidationResponse['scores'] = {
    specific: toScoreNumber(s.specific, 'specific'),
    measurable: toScoreNumber(s.measurable, 'measurable'),
    achievable: toScoreNumber(s.achievable, 'achievable'),
    relevant: toScoreNumber(s.relevant, 'relevant'),
    timebound: toScoreNumber(s.timebound, 'timebound'),
    evaluate: 0,
    readjust: 0,
  };
  const meanSmart =
    (scores.specific +
      scores.measurable +
      scores.achievable +
      scores.relevant +
      scores.timebound) /
    5;
  const evaluateRaw = s.evaluate ?? s.evaluable;
  const readjustRaw = s.readjust ?? s.readjustable ?? s.reajustable;
  scores.evaluate =
    evaluateRaw !== undefined && evaluateRaw !== null
      ? toScoreNumber(evaluateRaw, 'evaluate')
      : meanSmart;
  scores.readjust =
    readjustRaw !== undefined && readjustRaw !== null
      ? toScoreNumber(readjustRaw, 'readjust')
      : meanSmart;
  return scores;
}

export async function validateGoalSmart(
  request: GoalValidationRequest
): Promise<GoalValidationResponse> {
  // Extraer userId del request si está disponible, sino usar 'anonymous'
  const userId = (request as any).userId || 'anonymous';
  const ip = (request as any).ip;
  
  const prompt = `${GOAL_VALIDATION_PROMPT}

Meta a evaluar:
Título: ${request.title}
${request.description ? `Descripción: ${request.description}` : ''}
${request.deadline ? `Plazo: ${request.deadline}` : ''}
${request.userContext ? `Contexto del usuario: ${request.userContext}` : ''}`;

  try {
    const client = getClient();
    const model = getModel();

    const result = await protectedAICall<GoalValidationResponse>(
      'validateGoal',
      userId,
      request,
      async (signal) => {
        const responseFormat = getResponseFormat(model);
        const response = await client.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente experto en metodología SMARTER. Responde SOLO con JSON válido, sin texto adicional.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          ...(responseFormat && { response_format: responseFormat }),
        }, { signal });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No se recibió respuesta del modelo de IA');
        }

        let parsed: GoalValidationResponse;
        try {
          parsed = JSON.parse(extractJsonFromModelContent(content)) as GoalValidationResponse;
        } catch {
          throw new Error('Respuesta del modelo de IA no es JSON válido');
        }

        if (typeof parsed.passed !== 'boolean') {
          throw new Error('Respuesta del modelo de IA inválida: falta passed booleano');
        }
        if (typeof parsed.average !== 'number' || Number.isNaN(parsed.average)) {
          throw new Error('Respuesta del modelo de IA inválida: falta average numérico');
        }
        parsed.scores = normalizeGoalValidationScores(parsed.scores);

        console.log('🤖 [AI CLIENT] Respuesta del modelo parseada:', {
          hasScores: !!parsed.scores,
          hasSuggestedTitle: !!parsed.suggestedTitle,
          hasSuggestedDescription: !!parsed.suggestedDescription,
          suggestedMiniTasksLength: parsed.suggestedMiniTasks?.length || 0,
          suggestedTitle: parsed.suggestedTitle,
          suggestedDescription: parsed.suggestedDescription,
          suggestedMiniTasks: parsed.suggestedMiniTasks,
        });

        // Asegurar que siempre haya sugerencias (si el modelo no las proporcionó, usar valores por defecto)
        if (!parsed.suggestedTitle) {
          console.warn('⚠️ [AI CLIENT] El modelo no proporcionó suggestedTitle, usando título actual como sugerencia');
          parsed.suggestedTitle = null; // Permitimos null pero lo manejamos en el frontend
        }
        
        if (!parsed.suggestedDescription) {
          console.warn('⚠️ [AI CLIENT] El modelo no proporcionó suggestedDescription');
          parsed.suggestedDescription = null;
        }
        
        if (!parsed.suggestedMiniTasks || parsed.suggestedMiniTasks.length === 0) {
          console.warn('⚠️ [AI CLIENT] El modelo no proporcionó suggestedMiniTasks o el array está vacío');
          parsed.suggestedMiniTasks = [];
        }

        return parsed;
      },
      ip
    );

    return result;
  } catch (error) {
    console.error('Error en validación de goal con IA:', error);
    
    // Proporcionar mensaje de error más específico
    if (error instanceof Error) {
      // Si es un error de protección, mantener el mensaje original
      if (error instanceof RateLimitError || error instanceof CircuitBreakerError || 
          error instanceof TimeoutError || error instanceof ValidationError || 
          error instanceof LoopDetectionError) {
        throw error;
      }
      // Si es un error de configuración, mostrarlo claramente
      if (error.message.includes('no está configurada') || error.message.includes('no está configurado')) {
        throw new Error(`Configuración de IA faltante: ${error.message}`);
      }
      // Si es un error de API, mostrar el mensaje original
      if (error.message.includes('API') || error.message.includes('key')) {
        throw new Error(`Error de API de IA: ${error.message}`);
      }
      // Para otros errores, incluir el mensaje original
      throw new Error(`Error al validar goal con IA: ${error.message}`);
    }
    
    throw new Error('Error al validar goal con IA: Error desconocido');
  }
}

export async function validateMiniTaskSmart(
  request: MiniTaskValidationRequest
): Promise<MiniTaskValidationResponse> {
  const prompt = `${MINITASK_VALIDATION_PROMPT}

Minitarea a evaluar:
Título: ${request.title}
${request.description ? `Descripción: ${request.description}` : ''}
${request.deadline ? `Plazo: ${request.deadline}` : ''}

Contexto de la meta:
Título: ${request.goalContext.title}
${request.goalContext.description ? `Descripción: ${request.goalContext.description}` : ''}`;

  try {
    const client = getClient();
    const model = getModel();

    const responseFormat = getResponseFormat(model);
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente experto en metodología SMARTER. Responde SOLO con JSON válido, sin texto adicional.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      ...(responseFormat && { response_format: responseFormat }),
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No se recibió respuesta del modelo de IA');
    }

    const parsed = JSON.parse(content) as MiniTaskValidationResponse;
    
    // Validar estructura
    if (!parsed.scores || !parsed.average || typeof parsed.passed !== 'boolean') {
      throw new Error('Respuesta del modelo de IA inválida');
    }

    return parsed;
  } catch (error) {
    console.error('Error en validación de minitask con IA:', error);
    throw new Error('Error al validar minitask con IA');
  }
}

export interface UnlockMiniTaskRequest {
  title: string;
  description?: string;
  deadline?: string;
  goalContext: {
    title: string;
    description?: string;
  };
}

const UNLOCK_MINITASK_PROMPT = `Eres un experto en metodología SMARTER y gestión de tareas. Tu tarea es analizar una minitask y generar una versión mejorada con métricas específicas y plugins de seguimiento.

Plugins disponibles:
- calendar: Para tareas con fechas específicas, requiere recordatorios diarios/semanales/mensuales/trimestrales. Genera alarmas y alertas. 
  * Soporta múltiples alarmas al día (alarmTimes: array de horas HH:mm)
  * Puede incluir checklist diario (checklistEnabled: true) con etiqueta personalizada (checklistLabel)
  * El checklist es ideal para tareas que se completan con una acción simple (ej: "Lavar trastes", "Tomar medicamento", "Completar escritura diaria")
  * Para tareas repetitivas diarias, activa checklistEnabled con una etiqueta descriptiva
  * Para tareas que requieren múltiples acciones al día, configura múltiples alarmas (ej: medicamentos 2 veces al día)
- reminder: Para tareas que necesitan recordatorios en momentos específicos del día
  * Soporta múltiples horas de recordatorio (reminderTimes: array de horas HH:mm)
  * Útil para recordatorios sin seguimiento de progreso numérico
- progress-tracker: Para tareas con progreso numérico medible (horas, páginas, items, etc.) con seguimiento diario/semanal/mensual
- checklist: Para tareas con pasos específicos (NOTA: El checklist diario está integrado en calendar, usa calendar con checklistEnabled)
- timer: Para tareas con duración específica
- notification: Para alertas del navegador (home)
- mobile-push: Para notificaciones push móviles (dispositivo)
- chart: Para visualizar progreso con gráficas de barras, líneas, etc. usando Recharts

INTERCONEXIÓN PLUGINS-JOURNAL:
Los plugins están interconectados con el sistema de journal (diario de seguimiento). Cuando el usuario crea o actualiza una entrada del journal, los plugins reaccionan automáticamente:
- calendar: Las entradas del journal actualizan el estado visual del calendario. Cuando se completa un día en el journal, el calendario muestra ese día como completado.
- progress-tracker: Las entradas del journal con progressValue crean métricas automáticamente. El plugin rastrea el progreso numérico registrado en el journal.
- chart: Visualiza datos combinados de métricas históricas y entradas recientes del journal. Los datos del journal tienen prioridad sobre métricas antiguas para mostrar información actualizada.
- checklist: Los checklists completados crean automáticamente entradas del journal con checklistCompleted=true. Para checklists diarios, cada día completado genera una entrada del journal. Para eventos únicos, cuando todos los items están completados, se crea una entrada del journal.

Flujo de datos:
1. Usuario crea/actualiza entrada del journal → Plugins son notificados automáticamente
2. Usuario completa checklist → Se crea/actualiza entrada del journal → Plugins son notificados
3. Los plugins siempre reflejan el estado actual del journal para mantener sincronización

IMPORTANTE - Plugins obligatorios:
- SIEMPRE debes incluir "calendar" (para alarmas y seguimiento temporal)
- SIEMPRE debes incluir "chart" (para visualización de progreso con gráficas)
- Además, selecciona 1-2 plugins adicionales según el tipo de tarea (reminder, progress-tracker, notification, etc.)

Analiza la minitask y:
1. Mejora el título y descripción para que sea más específica y medible
2. Identifica qué métricas son apropiadas para medir el progreso (diario, semanal, mensual, trimestral)
3. DETECTA SI ES UNA TAREA DE UN SOLO DÍA CON HORAS PLANIFICADAS:
   - Si el título/descripción menciona "hoy", "dedicar X horas", "2 horas a...", "pasar X horas", etc.
   - Si el deadline es el mismo día o muy cercano (dentro de 1-2 días)
   - Si menciona horas específicas a dedicar (ej: "Dedicar 2 horas a estudiar inglés hoy")
   - ENTONCES: marca isSingleDayTask: true y extrae plannedHours del texto (convierte a número decimal)
   - Ejemplos:
     * "Dedicar 2 horas a estudiar inglés hoy" → isSingleDayTask: true, plannedHours: 2.0
     * "Quiero pasar 1.5 horas trabajando en el proyecto hoy" → isSingleDayTask: true, plannedHours: 1.5
     * "Hoy voy a dedicar 3 horas a leer" → isSingleDayTask: true, plannedHours: 3.0
4. Determina si la tarea es un EVENTO ÚNICO o TAREA REPETITIVA:
   
   EVENTOS ÚNICOS (se completan una vez):
   - Tareas que se realizan una sola vez antes de una fecha límite (ej: "Preparar materiales", "Verificar documentos", "Configurar equipo")
   - Para eventos únicos simples (un solo elemento): checklistType: 'single', checklistEnabled: true, NO usar frequency: 'daily'
   - Para eventos únicos con múltiples elementos: checklistType: 'multi-item', checklistEnabled: true, checklistItems: ["Elemento 1", "Elemento 2", ...], NO usar frequency: 'daily'
   - Ejemplos:
     * "Preparar materiales para el primer cuadro" → checklistType: 'multi-item', checklistItems: ["Lienzo", "Pinturas", "Pinceles", "Paleta"]
     * "Apagar la luz" → checklistType: 'single', checklistLabel: "Apagar la luz"
   
   TAREAS REPETITIVAS DIARIAS (se repiten cada día):
   - Tareas que se realizan diariamente y requieren confirmación cada día (ej: "Lavar trastes", "Tomar medicamento", "Hacer ejercicio")
   - Para tareas diarias: checklistType: 'daily', checklistEnabled: true, frequency: 'daily', checklistLabel temático
   - Si requiere múltiples acciones al día: configura múltiples alarmas en alarmTimes (ej: ['08:00', '20:00'])
   - El checklistLabel debe ser temático y descriptivo (ej: "Lavar trastes", "Completar escritura diaria", NO usar ejemplos genéricos)
   
   IMPORTANTE:
   - Tareas con progreso medible numéricamente (horas, páginas, items) → usa progress-tracker en lugar de checklist
   - Eventos únicos NUNCA deben tener frequency: 'daily', solo usan deadline
   - Tareas diarias SIEMPRE deben tener frequency: 'daily' y checklistType: 'daily'
   - TAREAS DE UN SOLO DÍA CON HORAS:
     * Si detectaste isSingleDayTask: true y plannedHours:
       - Configura calendar con frequency: 'daily' pero deadline del mismo día
       - Configura progress-tracker con targetValue igual a plannedHours y unit: 'hours'
       - Agrega plannedHours al config de calendar también
       - Configura alarmTimes apropiadas para recordar al usuario (ej: ['09:00', '14:00'])
5. Selecciona los plugins (MÍNIMO 2, típicamente 3-4):
   - OBLIGATORIO: calendar
     * Para EVENTOS ÚNICOS:
       - checklistType: 'single' (un elemento) o 'multi-item' (múltiples elementos)
       - checklistEnabled: true
       - checklistItems: array de strings si es 'multi-item' (ej: ["Lienzo", "Pinturas"])
       - checklistLabel: etiqueta descriptiva
       - NO usar frequency: 'daily', solo deadline
     * Para TAREAS DIARIAS:
       - checklistType: 'daily'
       - checklistEnabled: true
       - frequency: 'daily'
       - checklistLabel: etiqueta temática
       - alarmTimes: array de horas si requiere múltiples alarmas
     * Para tareas sin checklist: solo alarmas, sin checklistEnabled
   - OBLIGATORIO: chart (para gráficas de progreso)
   - ADICIONAL: reminder (si necesita recordatorios adicionales), progress-tracker (si hay progreso numérico), notification, etc.
6. Configura cada plugin con parámetros apropiados:
   - calendar: frequency, alarmTimes (array), checklistEnabled (boolean), checklistLabel (string opcional), plannedHours (número opcional si es de un solo día)
   - reminder: reminderTimes (array de horas HH:mm)
   - progress-tracker: targetValue (usar plannedHours si existe), unit ('hours' si es seguimiento por horas)
   - chart: chartType, metricType, timeRange
7. Realiza un análisis SMARTER completo

Responde SOLO con un JSON válido en este formato exacto:
{
  "improvedTitle": "<título mejorado y más específico>",
  "improvedDescription": "<descripción mejorada con detalles medibles>",
  "isSingleDayTask": <true|false opcional, true si es tarea de un solo día>,
  "plannedHours": <número opcional, horas planificadas si es de un solo día>,
  "metrics": [
    {
      "type": "<tipo de métrica, ej: progreso, completitud, tiempo>",
      "description": "<descripción de la métrica>",
      "target": <número objetivo opcional>,
      "unit": "<unidad de medida, ej: horas, páginas, items>"
    }
  ],
  "plugins": [
    {
      "id": "<calendar|reminder|progress-tracker|checklist|timer|notification|mobile-push|chart>",
      "reason": "<razón por la que este plugin es apropiado>",
      "config": {
        "enabled": true,
        "frequency": "<daily|weekly|monthly|custom>",
        // Para calendar: 
        //   - alarmTimes (array de horas HH:mm)
        //   - checklistEnabled (boolean)
        //   - checklistType ("single"|"daily"|"multi-item")
        //   - checklistLabel (string opcional, temático a la tarea)
        //   - checklistItems (array de strings, solo para "multi-item")
        //   - IMPORTANTE: eventos únicos NO deben tener frequency: "daily"
        // Para reminder: reminderTimes (array de horas HH:mm)
        // Para progress-tracker: targetValue (number), unit (string)
        // Para chart: chartType (bar|line|pie|area), metricType (string), timeRange (day|week|month|all)
      }
    }
  ],
  "smarterAnalysis": {
    "specific": <0-100>,
    "measurable": <0-100>,
    "achievable": <0-100>,
    "relevant": <0-100>,
    "timebound": <0-100>,
    "average": <promedio>,
    "passed": <true|false>,
    "feedback": "<comentario sobre la minitask mejorada>"
  }
}`;

export async function unlockMiniTask(
  request: UnlockMiniTaskRequest
): Promise<UnlockMiniTaskResponse> {
  // Extraer userId del request si está disponible
  const userId = (request as any).userId || 'anonymous';
  const ip = (request as any).ip;
  
  const prompt = `${UNLOCK_MINITASK_PROMPT}

Minitarea a analizar:
Título: ${request.title}
${request.description ? `Descripción: ${request.description}` : ''}
${request.deadline ? `Plazo: ${request.deadline}` : ''}

Contexto de la meta:
Título: ${request.goalContext.title}
${request.goalContext.description ? `Descripción: ${request.goalContext.description}` : ''}`;

  try {
    const client = getClient();
    const model = getModel();

    const result = await protectedAICall<UnlockMiniTaskResponse>(
      'unlockMiniTask',
      userId,
      request,
      async (signal) => {
        const responseFormat = getResponseFormat(model);
        const response = await client.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente experto en metodología SMARTER y gestión de tareas. Responde SOLO con JSON válido, sin texto adicional.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          ...(responseFormat && { response_format: responseFormat }),
        }, { signal });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No se recibió respuesta del modelo de IA');
        }

        const parsed = JSON.parse(content) as UnlockMiniTaskResponse;
    
    // Validar estructura básica
    if (!parsed.improvedTitle || !parsed.plugins || !parsed.smarterAnalysis) {
      throw new Error('Respuesta del modelo de IA inválida: faltan campos requeridos');
    }

    // Validar que los plugins tengan IDs válidos
    const validPluginIds = ['calendar', 'reminder', 'progress-tracker', 'checklist', 'timer', 'notification', 'mobile-push', 'chart'];
    for (const plugin of parsed.plugins) {
      if (!validPluginIds.includes(plugin.id)) {
        throw new Error(`Plugin ID inválido: ${plugin.id}`);
      }
      
      // Migrar alarmTime a alarmTimes para calendar plugins
      if (plugin.id === 'calendar' && plugin.config) {
        if (plugin.config.alarmTime && !plugin.config.alarmTimes) {
          plugin.config.alarmTimes = [plugin.config.alarmTime];
          delete plugin.config.alarmTime;
        }
        
        // Validar y corregir configuración de checklist
        if (plugin.config.checklistEnabled) {
          // Si no tiene checklistType, inferirlo
          if (!plugin.config.checklistType) {
            if (plugin.config.checklistItems && plugin.config.checklistItems.length > 0) {
              plugin.config.checklistType = 'multi-item';
            } else if (plugin.config.frequency === 'daily') {
              plugin.config.checklistType = 'daily';
            } else {
              plugin.config.checklistType = 'single';
            }
          }
          
          // Para eventos únicos, asegurar que NO tenga frequency 'daily'
          if ((plugin.config.checklistType === 'single' || plugin.config.checklistType === 'multi-item') && plugin.config.frequency === 'daily') {
            console.warn('⚠️ [UNLOCK] Evento único con frequency daily, removiendo frequency');
            delete plugin.config.frequency;
          }
          
          // Si tiene checklistItems pero checklistType no es 'multi-item', corregirlo
          if (plugin.config.checklistItems && plugin.config.checklistItems.length > 0 && plugin.config.checklistType !== 'multi-item') {
            console.warn('⚠️ [UNLOCK] checklistItems presente pero checklistType incorrecto, corrigiendo a multi-item');
            plugin.config.checklistType = 'multi-item';
          }
          
          // Si tiene checklistLabel pero no checklistItems y es single, está bien
          // Si no tiene checklistLabel, agregar uno genérico
          if (!plugin.config.checklistLabel) {
            if (plugin.config.checklistType === 'multi-item') {
              plugin.config.checklistLabel = 'Completar elementos';
            } else {
              plugin.config.checklistLabel = 'Completar tarea';
            }
          }
        }
      }
      
      // Migrar times a reminderTimes para reminder plugins
      if (plugin.id === 'reminder' && plugin.config) {
        if (plugin.config.times && !plugin.config.reminderTimes) {
          plugin.config.reminderTimes = plugin.config.times;
          delete plugin.config.times;
        }
      }
    }

    // Asegurar que siempre haya al menos calendar y chart
    const pluginIds = parsed.plugins.map(p => p.id);
    if (!pluginIds.includes('calendar')) {
      console.warn('⚠️ [UNLOCK] IA no incluyó calendar, agregándolo automáticamente');
      parsed.plugins.push({
        id: 'calendar',
        reason: 'Plugin obligatorio para alarmas y seguimiento temporal',
        config: {
          enabled: true,
          frequency: 'daily',
          alarmTimes: ['09:00'],
          checklistEnabled: false,
        },
      });
    }
    if (!pluginIds.includes('chart')) {
      console.warn('⚠️ [UNLOCK] IA no incluyó chart, agregándolo automáticamente');
      parsed.plugins.push({
        id: 'chart',
        reason: 'Plugin obligatorio para visualización de progreso',
        config: {
          enabled: true,
          chartType: 'bar',
          metricType: 'progreso',
          timeRange: 'week',
        },
      });
    }

        console.log('✅ [UNLOCK] Plugins finales asignados:', {
          count: parsed.plugins.length,
          plugins: parsed.plugins.map(p => p.id),
        });

        return parsed;
      },
      ip
    );

    return result;
  } catch (error) {
    console.error('Error en unlock de minitask con IA:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('no está configurada') || error.message.includes('no está configurado')) {
        throw new Error(`Configuración de IA faltante: ${error.message}`);
      }
      throw new Error(`Error al desbloquear minitask con IA: ${error.message}`);
    }
    
    throw new Error('Error al desbloquear minitask con IA: Error desconocido');
  }
}

const COACH_PROMPT = `Eres un coach experto en metodología SMARTER. Tu rol es ayudar al usuario a alcanzar sus minitasks proporcionando feedback constructivo, análisis de progreso y sugerencias accionables.

Contexto de la minitask:
- Título: {title}
- Descripción: {description}
- Estado: {status}
- Deadline: {deadline}
- Plugins configurados: {plugins}

Historial reciente del journal (últimas entradas):
{journalHistory}

Métricas actuales:
- Total de entradas: {totalEntries}
- Días con actividad: {daysWithEntries}
- Progreso promedio: {avgProgress}
- Tiempo total dedicado: {totalTimeSpent} minutos

INTERCONEXIÓN PLUGINS-JOURNAL:
Los plugins están interconectados con el journal y reaccionan automáticamente a cambios:
- Cuando se crea/actualiza una entrada del journal, los plugins se actualizan automáticamente:
  * calendar: El estado visual del calendario refleja las entradas del journal
  * progress-tracker: Las entradas con progressValue crean métricas automáticamente
  * chart: Visualiza datos combinados de métricas y entradas del journal (journal tiene prioridad)
  * checklist: Los checklists completados crean entradas del journal automáticamente
- El estado de todos los plugins está sincronizado con el journal
- Al analizar el progreso, considera el estado de todos los plugins activos y cómo se relacionan con las entradas del journal

Pregunta del usuario: {query}

Tu tarea:
1. Analizar el progreso según criterios SMARTER considerando el estado de todos los plugins
2. Responder la pregunta del usuario de manera específica y útil
3. Proporcionar sugerencias accionables basadas en patrones detectados en el journal y plugins
4. Ofrecer motivación y apoyo
5. Alertar sobre posibles problemas (bajo progreso, obstáculos recurrentes, desincronización entre plugins, etc.)
6. Considerar cómo los plugins están funcionando en conjunto con el journal para dar feedback más preciso

Responde SOLO con un JSON válido en este formato exacto:
{
  "feedback": "<análisis general del progreso y respuesta a la pregunta del usuario>",
  "smarterEvaluation": {
    "specific": <0-100, qué tan específico es el progreso registrado>,
    "measurable": <0-100, qué tan medible es el progreso>,
    "achievable": <0-100, qué tan alcanzable parece el objetivo>,
    "relevant": <0-100, qué tan relevante es el progreso para la meta>,
    "timebound": <0-100, qué tan bien se está cumpliendo el plazo>,
    "average": <promedio de los 5 scores>,
    "passed": <true si average >= 70, false en caso contrario>
  },
  "suggestions": [
    {
      "type": "<improvement|warning|encouragement|action>",
      "title": "<título de la sugerencia>",
      "description": "<descripción detallada y accionable>",
      "priority": "<high|medium|low>"
    }
  ],
  "encouragement": "<mensaje motivacional personalizado>",
  "warnings": ["<alerta 1 si hay problemas>", "<alerta 2 si hay problemas>"]
}`;

export async function queryMiniTaskCoach(
  context: MiniTaskCoachContext,
  query: string
): Promise<CoachQueryResponse> {
  // Extraer userId del context si está disponible
  const userId = (context as any).userId || 'anonymous';
  const ip = (context as any).ip;
  
  const journalHistoryText = context.journalHistory && context.journalHistory.length > 0
    ? context.journalHistory
        .slice(-14) // Últimas 14 entradas
        .map((entry, idx) => {
          const date = new Date(entry.entryDate).toLocaleDateString('es-ES');
          return `Entrada ${idx + 1} (${date}):
- Progreso: ${entry.progressValue || 0} ${entry.progressUnit || ''}
- Tiempo: ${entry.timeSpent || 0} minutos
- Estado de ánimo: ${entry.mood || 'no registrado'}
- Notas: ${entry.notes || 'sin notas'}
- Obstáculos: ${entry.obstacles || 'ninguno'}`;
        })
        .join('\n\n')
    : 'Aún no hay entradas en el journal.';

  const pluginsText = context.plugins && context.plugins.length > 0
    ? context.plugins
        .filter(p => p.enabled)
        .map(p => `- ${p.pluginId}: ${JSON.stringify(p.config)}`)
        .join('\n')
    : 'No hay plugins configurados.';

  const metricsText = context.currentMetrics
    ? `- Total de entradas: ${context.currentMetrics.totalEntries}
- Días con actividad: ${context.currentMetrics.daysWithEntries}
- Progreso promedio: ${context.currentMetrics.avgProgress.toFixed(2)}
- Tiempo total dedicado: ${context.currentMetrics.totalTimeSpent} minutos`
    : 'No hay métricas disponibles aún.';

  const prompt = COACH_PROMPT
    .replace('{title}', context.miniTask.title)
    .replace('{description}', context.miniTask.description || 'Sin descripción')
    .replace('{status}', context.miniTask.status)
    .replace('{deadline}', context.miniTask.deadline ? new Date(context.miniTask.deadline).toLocaleDateString('es-ES') : 'Sin deadline')
    .replace('{plugins}', pluginsText)
    .replace('{journalHistory}', journalHistoryText)
    .replace('{totalEntries}', context.currentMetrics?.totalEntries.toString() || '0')
    .replace('{daysWithEntries}', context.currentMetrics?.daysWithEntries.toString() || '0')
    .replace('{avgProgress}', context.currentMetrics?.avgProgress.toFixed(2) || '0')
    .replace('{totalTimeSpent}', context.currentMetrics?.totalTimeSpent.toString() || '0')
    .replace('{query}', query);

  try {
    const client = getClient();
    const model = getModel();

    const requestInput = { context, query };
    
    const result = await protectedAICall<CoachQueryResponse>(
      'queryCoach',
      userId,
      requestInput,
      async (signal) => {
        const responseFormat = getResponseFormat(model);
        const response = await client.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'Eres un coach experto en metodología SMARTER. Responde SOLO con JSON válido, sin texto adicional.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          ...(responseFormat && { response_format: responseFormat }),
        }, { signal });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No se recibió respuesta del modelo de IA');
        }

        const parsed = JSON.parse(content) as CoachQueryResponse;
        
        // Validar estructura
        if (!parsed.feedback || !parsed.smarterEvaluation || !parsed.suggestions) {
          throw new Error('Respuesta del modelo de IA inválida: faltan campos requeridos');
        }

        return parsed;
      },
      ip
    );

    return result;
  } catch (error) {
    console.error('Error en consulta al coach con IA:', error);
    
    if (error instanceof Error) {
      // Si es un error de protección, mantener el mensaje original
      if (error instanceof RateLimitError || error instanceof CircuitBreakerError || 
          error instanceof TimeoutError || error instanceof ValidationError || 
          error instanceof LoopDetectionError) {
        throw error;
      }
      throw new Error(`Error al consultar al coach: ${error.message}`);
    }
    
    throw new Error('Error al consultar al coach: Error desconocido');
  }
}

const GLOBAL_AGENT_SYSTEM = `Eres el agente coach Smarter de la app de productividad. Hablas español, tono claro, empático y profesional.
Debajo tenés el catálogo de rutas REST internas (/api) y un snapshot JSON del usuario (metas, minitasks, stats, alarmas).

CONSISTENCIA DEL SNAPSHOT (obligatorio):
- El JSON de este turno es la fuente de verdad del servidor. Para estado de metas usá siempre goals[].status tal cual viene (DRAFT, ACTIVE, COMPLETED, etc.): no lo contradigas ni lo “corrijas” por lo que diga el historial del chat.
- Una meta puede estar ACTIVE en la app y aun así estar en medio del flujo SMARTER en esta conversación. Si smarterValidated es false, podés decir que falta cerrar la validación SMARTER (preview/confirm) o el score persistido; si smarterValidated es true, el score ya está guardado.
- Si el usuario pregunta “¿ya está activa?” o similar, respondé según goals[].status del JSON (sí/no explícito) y aclarà smarterValidated solo si aporta al siguiente paso.
- Si listás minitasks de una meta (p. ej. “¿cuáles quedaron?”), incluí todas las de miniTasks[] con ese goalId, agrupadas por status, sin omitir filas.

COMPORTAMIENTO COACH (siempre):
- Tu rol es acompañar: preguntas cortas, una o dos a la vez, para alinear la meta o la tarea con el marco SMARTER extendido (S/M/A/R/T + Evaluable + Revisable).

BUCLE ANTES DE validate_goal (obligatorio salvo excepciones abajo):
- Si preguntaste algo como "¿Validamos esta meta?" o "¿Te gustaría validar?" y el usuario responde solo con afirmación vaga ("sí", "ok", "dale", "adelante", "por favor"): NO uses herramientas en esa respuesta. Respondé en texto con la PRIMERA o SEGUNDA pregunta concreta del coach (por ejemplo Specific + Medible, o plazo + métrica). El objetivo es cerrar criterios en diálogo antes del validador IA.
- Antes de proponer validate_goal phase preview deben existir al menos DOS turnos en los que vos hiciste preguntas SMARTER y el usuario respondió (contá solo después de que la meta ya figure en goals[] del snapshot, con cualquier status). Si aún no hay dos respuestas del usuario en ese sub-hilo, seguí preguntando o proponé que use el botón "Grid SMARTER" del chat.
- Podés usar update_goal o apply_smarter_worksheet durante el bucle para guardar lo acordado; eso no reemplaza el diálogo si la meta sigue ambigua.
- Recién cuando el usuario diga que ya está listo para la validación automática ("listo para el preview", "validá con IA", "ejecutá validate_goal preview", "cerramos criterios") O ya hubo el bucle completo + resumen tuyo, proponé validate_goal phase preview.
- Excepción: si el usuario ordena explícitamente saltar el coach ("solo ejecutá el preview ya", "sin más preguntas") o ya declaró que completó el grid SMARTER en esta sesión, podés ir directo a validate_goal preview.

- Para una NUEVA meta: no saltes a activate_goal. Flujo típico: (1) aclarar título y contexto con preguntas SMARTER, (2) proponer create_goal en DRAFT si hace falta, (3) bucle de validación anterior, (4) validate_goal fase preview, (5) minitasks sugeridas y confirm, (6) activate_goal si corresponde.
- Para una NUEVA minitask: antes de llamar create_minitask, ofrecé en texto 2–3 ideas concretas de minitasks alineadas a la meta; preguntá en qué meta guardarla si hay varias DRAFT/ACTIVE. Si el snapshot no tiene ninguna meta, primero create_goal o pedí que elijan crear una.
- Tras validate_goal (preview), mencioná explícitamente las minitasks sugeridas por el sistema y preguntá si quiere crearlas, editarlas o priorizar.
- Para hábitos, métricas o seguimiento diario, orientá a unlock_minitask (plugins, checklist, gráficos) en lugar de solo create_minitask plana.
- Usá siempre goalId y miniTaskId del snapshot cuando el usuario nombre algo que coincida.

SEGUIMIENTO Y CONTINUIDAD (cuando preguntan "¿cómo voy?", "estado", "qué hago hoy", "resumen"):
- Anclá la respuesta al snapshot JSON: stats (metas activas, progreso medio), pendingToday, y minitasks por estado/plazo.
- Referenciá el panel "Hoy" del chat del agente (alarmas, checklist, pistas de bitácora/métricas) como apoyo visual en la app.
- Ofrecé 1–2 próximos pasos concretos (p. ej. upsert_journal_today en una minitask medible, revisar una meta con deadline cercano, o confirmar una propuesta pendiente).
- Si hay desvío respecto al plazo o pocas entradas de journal en tareas Evaluables, aplicá Revisable: proponé ajustar alcance, usar readjustments si aplica, o una minitask de corrección antes de seguir acumulando tareas.

HERRAMIENTAS Y FLUJOS (intención → tool):
- Borrador de meta nueva: create_goal (título mínimo), luego enriquecé con preguntas o apply_smarter_worksheet cuando el usuario aporte criterios.
- Cuestionario por criterio (S,M,A,R,T,Evaluable,Revisable): apply_smarter_worksheet con goalId y los campos que el usuario dictó o completó en el widget; alternativa: update_goal description.
- Primera validación IA + sugerencias de minitasks: validate_goal phase preview (solo tras el bucle de preguntas o excepción explícita del usuario; obligatorio antes de confirm).
- Cerrar validación y persistir score + minitasks aceptadas: validate_goal phase confirm con acceptedTitle/acceptedDescription/acceptedMiniTasks según lo acordado en el chat.
- Activar meta ya validada: activate_goal. Si en el snapshot la meta ya tiene status ACTIVE, no propongas activate_goal salvo que el usuario lo pida explícitamente; aclará que en la app ya está activa y seguí con el siguiente paso (p. ej. minitasks o journal).
- Minitask: create_minitask; hábitos/métricas: unlock_minitask.
- create_minitask: title requerido; goalId opcional (servidor infiere ACTIVE→DRAFT).
- activate_goal solo tras validate_goal confirm y score SMARTER válido en servidor.
- Interpretá lenguaje natural: si el usuario dice "quiero pasar el borrador a activa", guiá preview → confirm → activate sin saltear pasos.`;

const GLOBAL_AGENT_COACH_EXTRA_DIALOGUE = `
Modo coach reforzado: extendé el diálogo antes de cualquier herramienta que ejecute validación IA (validate_goal). Nunca abras el flujo de confirmación de validate_goal en la primera respuesta a un "sí" genérico: primero 1–2 preguntas SMARTER concretas.`;

const GLOBAL_AGENT_COACH_STRICT_HINT = `
Ejecución estricta activada: no propongas activate_goal sin validate_goal confirm; para minitasks ambiciosas pedí descripción concreta o unlock_minitask.`;

export type GlobalAgentChatRole = 'user' | 'assistant' | 'system';

export interface GlobalAgentClientMessage {
  role: GlobalAgentChatRole;
  content: string;
}

export type GlobalAgentModelOutcome =
  | { kind: 'text'; content: string }
  | {
      kind: 'tool_calls';
      content: string | null;
      toolCalls: Array<{ id: string; name: string; arguments: string }>;
    };

export async function runGlobalAgentTurn(
  userId: string,
  contextBlock: string,
  messages: GlobalAgentClientMessage[],
  ip?: string,
  coach?: { coachMode?: boolean; coachStrict?: boolean }
): Promise<GlobalAgentModelOutcome> {
  const requestInput = { messages, contextBlock };

  return protectedAICall<GlobalAgentModelOutcome>(
    'globalAgent',
    userId,
    requestInput,
    async (signal) => {
      const client = getClient();
      const model = getModel();

      let coachBlock = '';
      if (coach?.coachMode) coachBlock += `\n\n${GLOBAL_AGENT_COACH_EXTRA_DIALOGUE}`;
      if (coach?.coachStrict) coachBlock += `\n\n${GLOBAL_AGENT_COACH_STRICT_HINT}`;

      const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `${GLOBAL_AGENT_SYSTEM}${coachBlock}\n\n${AGENT_API_CATALOG}\n\n${contextBlock}`,
        },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const response = await client.chat.completions.create(
        {
          model,
          messages: apiMessages,
          tools: GLOBAL_AGENT_TOOLS,
          tool_choice: 'auto',
          temperature: 0.35,
        },
        { signal }
      );

      const msg = response.choices[0]?.message;
      const toolCalls = msg?.tool_calls;

      if (toolCalls?.length) {
        const mapped = toolCalls
          .filter((tc): tc is typeof tc & { type: 'function' } => tc.type === 'function')
          .map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments || '{}',
          }))
          .filter((tc) => AGENT_TOOL_NAME_SET.has(tc.name));

        if (mapped.length > 0) {
          return {
            kind: 'tool_calls',
            content: msg?.content ?? null,
            toolCalls: mapped,
          };
        }
      }

      const text = (msg?.content || '').trim() || 'No pude generar una respuesta.';
      return { kind: 'text', content: text };
    },
    ip
  );
}

