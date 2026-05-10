import type OpenAI from 'openai';

export const AGENT_TOOL_NAMES = [
  'create_goal',
  'update_goal',
  'delete_goal',
  'activate_goal',
  'validate_goal',
  'apply_smarter_worksheet',
  'sync_goals_completion',
  'create_minitask',
  'update_minitask',
  'delete_minitask',
  'upsert_journal_today',
  'unlock_minitask',
] as const;

export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

export const AGENT_TOOL_NAME_SET = new Set<string>(AGENT_TOOL_NAMES);

export const GLOBAL_AGENT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_goal',
      description: 'Crea una nueva meta (goal) en estado DRAFT. Equivale a POST /api/goals.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Titulo de la meta' },
          description: { type: 'string' },
          deadline: { type: 'string', description: 'ISO date o YYYY-MM-DDTHH:mm' },
          plannedHours: { type: 'number' },
          isSingleDayGoal: { type: 'boolean' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_goal',
      description: 'Actualiza una meta existente. Equivale a PATCH /api/goals/:id.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string' },
          plannedHours: { type: 'number' },
          isSingleDayGoal: { type: 'boolean' },
          status: {
            type: 'string',
            enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
            description: 'Nuevo estado de la meta',
          },
        },
        required: ['goalId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_goal',
      description:
        'Elimina permanentemente una meta y sus datos en cascada (minitasks, etc.). Equivale a borrado en BD; usar con cuidado.',
      parameters: {
        type: 'object',
        properties: { goalId: { type: 'string' } },
        required: ['goalId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'activate_goal',
      description:
        'Activa una meta DRAFT ya validada con score SMARTER aprobado. Equivale a PATCH /api/goals/:id/activate.',
      parameters: {
        type: 'object',
        properties: { goalId: { type: 'string' } },
        required: ['goalId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_goal',
      description:
        'Validacion SMARTER con IA del servidor. NO la llames en el mismo turno en que el usuario solo dijo "si", "dale" o "adelante" a una invitacion generica a validar: antes debe existir un bucle breve de coaching en el chat (minimo 2 intercambios: vos preguntas SMARTER, el usuario responde, repetir o resumir). Excepciones: el usuario pide explicitamente "ejecuta validate_goal preview", "solo el preview", o ya completo el cuestionario SMARTER (widget/grid) en esta conversacion. phase=preview: sugerencias y score sin confirm final. phase=confirm: persiste titulo/descripcion/minitasks aceptadas.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          phase: { type: 'string', enum: ['preview', 'confirm'] },
          acceptedTitle: { type: 'string' },
          acceptedDescription: { type: 'string' },
          acceptedMiniTasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                order: { type: 'number' },
                dependsOn: { type: 'string' },
                schedulingType: { type: 'string' },
                scheduledDate: { type: 'string' },
                scheduledTime: { type: 'string' },
              },
              required: ['title'],
            },
          },
        },
        required: ['goalId', 'phase'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_smarter_worksheet',
      description:
        'Fusiona en la meta DRAFT las respuestas del grid SMARTER extendido (S,M,A,R,T + Evaluable + Revisable) en la descripción, bajo un bloque fijo. Usalo cuando el usuario completó el cuestionario por criterio o dictó respuestas claras por letra. Luego conviene validate_goal preview.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          S: { type: 'string', description: 'Específico' },
          M: { type: 'string', description: 'Medible' },
          A: { type: 'string', description: 'Alcanzable' },
          R: { type: 'string', description: 'Relevante' },
          T: { type: 'string', description: 'Temporal / plazo' },
          E_evaluable: { type: 'string', description: 'Evaluable — cómo revisar progreso' },
          R_revisable: { type: 'string', description: 'Revisable — cómo ajustar si falla' },
        },
        required: ['goalId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sync_goals_completion',
      description: 'Revisa todas las metas ACTIVE y marca COMPLETED si todas sus minitasks estan completas. Equivale a POST /api/goals/check-completion.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_minitask',
      description:
        'Crea una minitask. goalId opcional: si falta o es invalido, el servidor usa la primera meta ACTIVE, si no DRAFT, si no cualquiera. Si no hay metas, falla hasta que exista create_goal.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string', description: 'Opcional. ID exacto del snapshot; si no, se infiere.' },
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string' },
          plannedHours: { type: 'number' },
          isSingleDayTask: { type: 'boolean' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_minitask',
      description: 'Actualiza campos de una minitask. Equivale a PATCH /api/minitasks/:id.',
      parameters: {
        type: 'object',
        properties: {
          miniTaskId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string' },
          status: {
            type: 'string',
            enum: ['DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          },
          plannedHours: { type: 'number' },
          isSingleDayTask: { type: 'boolean' },
        },
        required: ['miniTaskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_minitask',
      description: 'Elimina una minitask permanentemente (si pertenece al usuario).',
      parameters: {
        type: 'object',
        properties: { miniTaskId: { type: 'string' } },
        required: ['miniTaskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'upsert_journal_today',
      description: 'Crea o actualiza la entrada de journal de hoy. Equivale a POST /api/minitasks/:id/journal.',
      parameters: {
        type: 'object',
        properties: {
          miniTaskId: { type: 'string' },
          notes: { type: 'string' },
          progressValue: { type: 'number' },
          progressUnit: { type: 'string' },
          checklistCompleted: { type: 'boolean' },
          mood: { type: 'string', enum: ['positivo', 'neutral', 'negativo'] },
          timeSpent: { type: 'integer' },
        },
        required: ['miniTaskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'unlock_minitask',
      description:
        'Desbloquea una minitask DRAFT con pipeline de IA (validacion SMARTER). Equivale a POST /api/minitasks/:id/unlock. Puede tardar y consumir cuota de IA.',
      parameters: {
        type: 'object',
        properties: { miniTaskId: { type: 'string' } },
        required: ['miniTaskId'],
      },
    },
  },
];
