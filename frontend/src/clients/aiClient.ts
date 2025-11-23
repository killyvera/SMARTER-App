import OpenAI from 'openai';
import { env } from '@/config/env';
import type { SmarterScore } from '@smarter-app/shared';
import type { UnlockMiniTaskResponse, PluginType } from '@smarter-app/shared';
import type { CoachQueryRequest, CoachQueryResponse, CoachSuggestion, MiniTaskCoachContext } from '@/types/miniTaskJournal';

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
    return env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
  }
  return env.OPENAI_MODEL;
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
  suggestedMiniTasks?: Array<{
    title: string;
    description?: string;
    priority: number;
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
  "suggestedMiniTasks": [
    {
      "title": "<título de minitarea sugerida - debe ser una acción concreta>",
      "description": "<descripción opcional de la minitarea>",
      "priority": <número 1-10>
    }
  ]
}`;

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

export async function validateGoalSmart(
  request: GoalValidationRequest
): Promise<GoalValidationResponse> {
  const prompt = `${GOAL_VALIDATION_PROMPT}

Meta a evaluar:
Título: ${request.title}
${request.description ? `Descripción: ${request.description}` : ''}
${request.deadline ? `Plazo: ${request.deadline}` : ''}
${request.userContext ? `Contexto del usuario: ${request.userContext}` : ''}`;

  try {
    const client = getClient();
    const model = getModel();

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
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No se recibió respuesta del modelo de IA');
    }

    const parsed = JSON.parse(content) as GoalValidationResponse;
    
    console.log('🤖 [AI CLIENT] Respuesta del modelo parseada:', {
      hasScores: !!parsed.scores,
      hasSuggestedTitle: !!parsed.suggestedTitle,
      hasSuggestedDescription: !!parsed.suggestedDescription,
      suggestedMiniTasksLength: parsed.suggestedMiniTasks?.length || 0,
      suggestedTitle: parsed.suggestedTitle,
      suggestedDescription: parsed.suggestedDescription,
      suggestedMiniTasks: parsed.suggestedMiniTasks,
    });
    
    // Validar estructura
    if (!parsed.scores || !parsed.average || typeof parsed.passed !== 'boolean') {
      throw new Error('Respuesta del modelo de IA inválida: faltan scores o average');
    }

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
  } catch (error) {
    console.error('Error en validación de goal con IA:', error);
    
    // Proporcionar mensaje de error más específico
    if (error instanceof Error) {
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
      response_format: { type: 'json_object' },
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
- reminder: Para tareas que necesitan recordatorios en momentos específicos del día
- progress-tracker: Para tareas con progreso numérico medible (horas, páginas, items, etc.) con seguimiento diario/semanal/mensual
- checklist: Para tareas con pasos específicos
- timer: Para tareas con duración específica
- notification: Para alertas del navegador (home)
- mobile-push: Para notificaciones push móviles (dispositivo)
- chart: Para visualizar progreso con gráficas de barras, líneas, etc. usando QuickChart.js

IMPORTANTE - Plugins obligatorios:
- SIEMPRE debes incluir "calendar" (para alarmas y seguimiento temporal)
- SIEMPRE debes incluir "chart" (para visualización de progreso con gráficas)
- Además, selecciona 1-2 plugins adicionales según el tipo de tarea (reminder, progress-tracker, notification, etc.)

Analiza la minitask y:
1. Mejora el título y descripción para que sea más específica y medible
2. Identifica qué métricas son apropiadas para medir el progreso (diario, semanal, mensual, trimestral)
3. Selecciona los plugins (MÍNIMO 2, típicamente 3-4):
   - OBLIGATORIO: calendar (con frecuencia diaria/semanal/mensual según la tarea)
   - OBLIGATORIO: chart (para gráficas de progreso)
   - ADICIONAL: reminder, progress-tracker, notification, etc. según corresponda
4. Configura cada plugin con parámetros apropiados (frecuencia, alarmas, tipos de seguimiento)
5. Realiza un análisis SMARTER completo

Responde SOLO con un JSON válido en este formato exacto:
{
  "improvedTitle": "<título mejorado y más específico>",
  "improvedDescription": "<descripción mejorada con detalles medibles>",
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
        // ... otros campos específicos del plugin
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
      response_format: { type: 'json_object' },
    });

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
          alarmTime: '09:00',
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

export interface MiniTaskCoachContext {
  miniTask: {
    id: string;
    title: string;
    description?: string;
    deadline?: Date;
    status: string;
    unlocked: boolean;
  };
  goal: {
    title: string;
    description?: string;
  };
  plugins?: Array<{
    pluginId: string;
    config: any;
    enabled: boolean;
  }>;
  journalHistory?: Array<{
    entryDate: Date;
    progressValue?: number;
    progressUnit?: string;
    notes?: string;
    obstacles?: string;
    mood?: string;
    timeSpent?: number;
  }>;
  currentMetrics?: {
    totalEntries: number;
    daysWithEntries: number;
    avgProgress: number;
    totalTimeSpent: number;
  };
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

Pregunta del usuario: {query}

Tu tarea:
1. Analizar el progreso según criterios SMARTER
2. Responder la pregunta del usuario de manera específica y útil
3. Proporcionar sugerencias accionables basadas en patrones detectados
4. Ofrecer motivación y apoyo
5. Alertar sobre posibles problemas (bajo progreso, obstáculos recurrentes, etc.)

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
      response_format: { type: 'json_object' },
    });

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
  } catch (error) {
    console.error('Error en consulta al coach con IA:', error);
    
    if (error instanceof Error) {
      throw new Error(`Error al consultar al coach: ${error.message}`);
    }
    
    throw new Error('Error al consultar al coach: Error desconocido');
  }
}


