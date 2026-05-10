/**
 * Atajos / plantillas: envían un mensaje de usuario estructurado para disparar herramientas del agente.
 */
export type AgentChatShortcut = {
  id: string;
  title: string;
  hint: string;
  /** Texto que se envía como mensaje del usuario (visible en el hilo). */
  prompt: string;
};

export const AGENT_CHAT_SHORTCUTS: AgentChatShortcut[] = [
  {
    id: 'flow_new_goal',
    title: 'Nueva meta',
    hint: 'Preguntas SMARTER y create_goal',
    prompt: `[Plantilla — nueva meta] Quiero crear una meta en borrador. Haceme 2–4 preguntas breves sobre S/M/A/R/T y sobre Evaluable y Revisable (SMARTER extendido). Después proponé create_goal con el título acordado y validate_goal en fase preview. No actives la meta hasta que yo confirme las propuestas.`,
  },
  {
    id: 'flow_validate_activate',
    title: 'Validar y activar',
    hint: 'Preguntas SMARTER → preview → confirm',
    prompt: `[Plantilla — validar meta] Tengo una meta en DRAFT para validar. Primero haceme el bucle de coaching: varias preguntas SMARTER (una o dos por turno) hasta cerrar criterios; podés usar update_goal o pedirme el Grid SMARTER. Recién cuando yo diga que listo para la validación automática, proponé validate_goal phase preview, después confirm y activate_goal si aplica. Si no digo el goalId, usá el contexto o preguntame cuál DRAFT.`,
  },
  {
    id: 'flow_minitask_unlock',
    title: 'Minitask + IA',
    hint: 'unlock_minitask y plugins',
    prompt: `[Plantilla — minitask] Quiero una minitask con plugins y bitácora: orientame a unlock_minitask. Si ya tengo una minitask en DRAFT sin desbloquear, proponé unlock_minitask con su id. Si no, create_minitask con título y descripción clara y luego unlock_minitask.`,
  },
];
