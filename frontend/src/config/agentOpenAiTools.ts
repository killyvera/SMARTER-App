import type OpenAI from 'openai';

export const AGENT_TOOL_NAMES = [
  'create_goal',
  'update_goal',
  'delete_goal',
  'activate_goal',
  'validate_goal',
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
        'Validacion SMARTER con IA. phase=preview: sugerencias sin guardar minitasks finales. phase=confirm: guarda titulo/descripcion/minitasks aceptadas (misma semantica que POST /api/goals/:id/validate).',
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
      name: 'sync_goals_completion',
      description: 'Revisa todas las metas ACTIVE y marca COMPLETED si todas sus minitasks estan completas. Equivale a POST /api/goals/check-completion.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_minitask',
      description: 'Crea una minitask bajo una meta. Equivale a POST /api/minitasks.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string' },
          plannedHours: { type: 'number' },
          isSingleDayTask: { type: 'boolean' },
        },
        required: ['goalId', 'title'],
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
