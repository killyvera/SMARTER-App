'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SMARTER_GRID_ITEMS } from '@/features/agent/smarterGridConfig';
import {
  formatSmarterWorksheetBlock,
  mergeSmarterSectionIntoDescription,
  type SmarterWorksheetAnswers,
} from '@/features/agent/smarterWorksheetFormat';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

type GoalOpt = { id: string; title: string; status: string };

export interface SmarterWorksheetWidgetProps {
  disabled?: boolean;
  onAfterApply: (userFollowUp: string) => void;
}

export function SmarterWorksheetWidget({ disabled, onAfterApply }: SmarterWorksheetWidgetProps) {
  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => apiRequest<GoalOpt[]>('/goals', { method: 'GET' }),
  });

  const draftGoals = useMemo(
    () => (goals || []).filter((g) => g.status === 'DRAFT'),
    [goals]
  );

  const [goalId, setGoalId] = useState<string>('');
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SMARTER_GRID_ITEMS.map((x) => [x.key, x.key === 'S']))
  );
  const [answers, setAnswers] = useState<SmarterWorksheetAnswers>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setField = (key: keyof SmarterWorksheetAnswers, v: string) => {
    setAnswers((a) => ({ ...a, [key]: v }));
  };

  const apply = async () => {
    setErr(null);
    if (!goalId) {
      setErr('Elegí una meta en borrador o creá una con el agente antes.');
      return;
    }
    const block = formatSmarterWorksheetBlock(answers);
    if (!block) {
      setErr('Completá al menos un criterio del grid SMARTER.');
      return;
    }
    setBusy(true);
    try {
      const goal = await apiRequest<{ description: string | null }>(`/goals/${goalId}`, { method: 'GET' });
      const merged = mergeSmarterSectionIntoDescription(goal.description, block);
      await apiRequest(`/goals/${goalId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: merged }),
      });
      const title = goals?.find((g) => g.id === goalId)?.title ?? 'tu meta';
      onAfterApply(
        `Ya guardé mi cuestionario SMARTER (grid S/M/A/R/T + Evaluable + Revisable) en la meta DRAFT "${title}" (id: ${goalId}). Ejecutá validate_goal con phase preview para esa meta, comentame el feedback y las minitasks sugeridas.`
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 text-left">
      <p className="text-[11px] text-muted-foreground leading-snug">
        Completá por criterio; se guarda en la descripción de la meta para que{' '}
        <strong>validate_goal</strong> use el contexto. Podés pedirle al agente una meta nueva si no tenés
        borradores.
      </p>

      {loadingGoals ? (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando metas…
        </p>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="smarter-ws-goal" className="text-xs">
            Meta en borrador (DRAFT)
          </Label>
          <select
            id="smarter-ws-goal"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            disabled={disabled || busy}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">Seleccionar meta…</option>
            {draftGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          {draftGoals.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">No hay metas DRAFT. Pedile al agente que cree una.</p>
          ) : null}
        </div>
      )}

      <div className="space-y-2 max-h-[min(50vh,22rem)] overflow-y-auto pr-1">
        {SMARTER_GRID_ITEMS.map((item) => {
          const isOpen = open[item.key];
          return (
            <div key={item.key} className="rounded-lg border border-border/80 bg-background/60">
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => setOpen((o) => ({ ...o, [item.key]: !o[item.key] }))}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs font-medium"
              >
                {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary">
                  {item.letter}
                </span>
                <span>
                  {item.title}
                  <span className="block font-normal text-[10px] text-muted-foreground">{item.short}</span>
                </span>
              </button>
              {isOpen ? (
                <div className="border-t border-border/60 px-2.5 pb-2 pt-1">
                  <p className="mb-1 text-[10px] text-muted-foreground">{item.hint}</p>
                  <Textarea
                    value={answers[item.key] || ''}
                    onChange={(e) => setField(item.key, e.target.value)}
                    disabled={disabled || busy}
                    rows={3}
                    className="text-xs min-h-[72px] resize-y"
                    placeholder="Tu respuesta…"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {err ? <p className="text-xs text-destructive">{err}</p> : null}

      <Button
        type="button"
        size="sm"
        className={cn('w-full')}
        disabled={disabled || busy || !goalId}
        onClick={() => void apply()}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar en la meta y pedir validación preview'}
      </Button>
    </div>
  );
}
