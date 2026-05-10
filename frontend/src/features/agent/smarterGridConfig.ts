/**
 * Grid SMARTER extendido (alineado con la guía /smarter).
 * Cada ítem enlaza con el cuestionario y con apply_smarter_worksheet / validate_goal.
 */
export const SMARTER_GRID_ITEMS = [
  {
    key: 'S' as const,
    letter: 'S',
    title: 'Específico',
    short: '¿Qué exactamente querés lograr?',
    hint: 'Concreto, sin vaguedades; podés mencionar resultado y contexto.',
  },
  {
    key: 'M' as const,
    letter: 'M',
    title: 'Medible',
    short: '¿Cómo vas a medir el avance?',
    hint: 'Números, fechas o indicadores claros de “listo”.',
  },
  {
    key: 'A' as const,
    letter: 'A',
    title: 'Alcanzable',
    short: '¿Es realista con tus recursos y tiempo?',
    hint: 'Honestidad sobre límites y apoyos.',
  },
  {
    key: 'R' as const,
    letter: 'R',
    title: 'Relevante',
    short: '¿Por qué importa ahora?',
    hint: 'Encaje con valores, trabajo o vida.',
  },
  {
    key: 'T' as const,
    letter: 'T',
    title: 'Temporal',
    short: '¿Cuándo o en qué plazo?',
    hint: 'Fecha o hito revisable.',
  },
  {
    key: 'E_evaluable' as const,
    letter: 'E',
    title: 'Evaluable',
    short: '¿Cómo vas a revisar si va bien?',
    hint: 'Criterios de revisión, ritmo de chequeo.',
  },
  {
    key: 'R_revisable' as const,
    letter: 'R²',
    title: 'Revisable',
    short: '¿Cómo vas a ajustar si algo falla?',
    hint: 'Plan B, flexibilidad, quién decide el cambio.',
  },
] as const;

export type SmarterGridKey = (typeof SMARTER_GRID_ITEMS)[number]['key'];
