export const SMARTER_WORKSHEET_MARKER = '## Autoevaluación SMARTER (cuestionario)';

export type SmarterWorksheetAnswers = {
  S?: string;
  M?: string;
  A?: string;
  R?: string;
  T?: string;
  /** Evaluable (SMARTER extendido) */
  E_evaluable?: string;
  /** Revisable / ajustable */
  R_revisable?: string;
};

const LABELS: Array<{ key: keyof SmarterWorksheetAnswers; heading: string }> = [
  { key: 'S', heading: 'S — Específico' },
  { key: 'M', heading: 'M — Medible' },
  { key: 'A', heading: 'A — Alcanzable' },
  { key: 'R', heading: 'R — Relevante' },
  { key: 'T', heading: 'T — Temporal' },
  { key: 'E_evaluable', heading: 'E — Evaluable' },
  { key: 'R_revisable', heading: 'R — Revisable' },
];

/** Bloque markdown para guardar en la descripción de la meta. */
export function formatSmarterWorksheetBlock(answers: SmarterWorksheetAnswers): string {
  const parts: string[] = [SMARTER_WORKSHEET_MARKER, ''];
  for (const { key, heading } of LABELS) {
    const t = (answers[key] || '').trim();
    if (t) parts.push(`**${heading}:** ${t}`, '');
  }
  if (parts.length <= 2) return '';
  return parts.join('\n').trimEnd();
}

/** Reemplaza una sección previa del cuestionario o la añade al final. */
export function mergeSmarterSectionIntoDescription(
  existing: string | null | undefined,
  worksheetBlock: string
): string {
  const block = worksheetBlock.trim();
  if (!block) return (existing || '').trim();
  const ex = (existing || '').trimEnd();
  const idx = ex.indexOf(SMARTER_WORKSHEET_MARKER);
  const base = idx >= 0 ? ex.slice(0, idx).trimEnd() : ex;
  return base ? `${base}\n\n${block}` : block;
}
