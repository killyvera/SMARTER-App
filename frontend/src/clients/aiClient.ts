import OpenAI from 'openai';
import { env } from '@/config/env';
import type { SmarterScore } from '@smarter-app/shared';

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

IMPORTANTE: Además de evaluar, debes:
1. Analizar el título y sugerir una versión mejorada que sea más específica, medible y clara
2. Analizar la descripción y sugerir mejoras si es necesario
3. Generar minitareas sugeridas que ayuden a alcanzar la meta

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
  "suggestedTitle": "<título mejorado que sea más específico y medible, o null si el título actual es óptimo>",
  "suggestedDescription": "<descripción mejorada con más detalles, o null si la descripción actual es óptima>",
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
    
    // Validar estructura
    if (!parsed.scores || !parsed.average || typeof parsed.passed !== 'boolean') {
      throw new Error('Respuesta del modelo de IA inválida');
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


