'use client';

export interface ProposalPreviewProps {
  name: string;
  argumentsJson: string;
}

function safeParse(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-left text-xs">
      <span className="text-muted-foreground whitespace-nowrap">{label}</span>
      <span className="break-words font-medium">{value}</span>
    </div>
  );
}

export function ProposalToolPreview({ name, argumentsJson }: ProposalPreviewProps) {
  const a = safeParse(argumentsJson);
  const str = (k: string) => (typeof a[k] === 'string' ? (a[k] as string) : '');
  const num = (k: string) => (typeof a[k] === 'number' ? String(a[k]) : '');
  const bool = (k: string) => (typeof a[k] === 'boolean' ? (a[k] ? 'Sí' : 'No') : '');

  const tool = name;

  return (
    <div className="rounded-lg border bg-card p-2.5 space-y-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{name}</div>
      <div className="space-y-1 border-t border-border/60 pt-2">
        {tool === 'create_goal' && (
          <>
            <Row label="Título" value={str('title')} />
            <Row label="Descripción" value={str('description')} />
            <Row label="Plazo" value={str('deadline')} />
            <Row label="Horas plan." value={num('plannedHours')} />
            <Row label="Un día" value={bool('isSingleDayGoal')} />
          </>
        )}
        {tool === 'update_goal' && (
          <>
            <Row label="Meta ID" value={str('goalId')} />
            <Row label="Título" value={str('title')} />
            <Row label="Estado" value={str('status')} />
            <Row label="Descripción" value={str('description')} />
            <Row label="Plazo" value={str('deadline')} />
          </>
        )}
        {(tool === 'delete_goal' || tool === 'activate_goal') && <Row label="Meta ID" value={str('goalId')} />}
        {tool === 'validate_goal' && (
          <>
            <Row label="Meta ID" value={str('goalId')} />
            <Row label="Fase" value={str('phase')} />
            <Row label="Título aceptado" value={str('acceptedTitle')} />
            {Array.isArray(a.acceptedMiniTasks) ? (
              <Row label="Minitasks" value={`${(a.acceptedMiniTasks as unknown[]).length} ítems`} />
            ) : null}
          </>
        )}
        {tool === 'apply_smarter_worksheet' && (
          <>
            <Row label="Meta ID" value={str('goalId')} />
            <Row label="S" value={str('S')} />
            <Row label="M" value={str('M')} />
            <Row label="A" value={str('A')} />
            <Row label="R" value={str('R')} />
            <Row label="T" value={str('T')} />
            <Row label="E (Evaluable)" value={str('E_evaluable')} />
            <Row label="R (Revisable)" value={str('R_revisable')} />
          </>
        )}
        {tool === 'sync_goals_completion' && <p className="text-xs text-muted-foreground">Sincronizar metas completadas</p>}
        {tool === 'create_minitask' && (
          <>
            <Row label="Meta ID" value={str('goalId') || '(automático)'} />
            <Row label="Título" value={str('title')} />
            <Row label="Descripción" value={str('description')} />
            <Row label="Plazo" value={str('deadline')} />
          </>
        )}
        {tool === 'update_minitask' && (
          <>
            <Row label="Minitask ID" value={str('miniTaskId')} />
            <Row label="Título" value={str('title')} />
            <Row label="Estado" value={str('status')} />
            <Row label="Descripción" value={str('description')} />
          </>
        )}
        {(tool === 'delete_minitask' || tool === 'unlock_minitask') && <Row label="Minitask ID" value={str('miniTaskId')} />}
        {tool === 'upsert_journal_today' && (
          <>
            <Row label="Minitask ID" value={str('miniTaskId')} />
            <Row label="Notas" value={str('notes')} />
            <Row label="Progreso" value={num('progressValue') ? `${num('progressValue')} ${str('progressUnit')}` : ''} />
            <Row label="Checklist" value={bool('checklistCompleted')} />
            <Row label="Ánimo" value={str('mood')} />
            <Row label="Minutos" value={num('timeSpent')} />
          </>
        )}
        {!isKnownTool(name) && (
          <pre className="mt-1 max-h-20 overflow-auto rounded bg-muted/50 p-1 text-[10px]">{argumentsJson}</pre>
        )}
      </div>
    </div>
  );
}

function isKnownTool(name: string): boolean {
  const set = new Set([
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
  ]);
  return set.has(name);
}
