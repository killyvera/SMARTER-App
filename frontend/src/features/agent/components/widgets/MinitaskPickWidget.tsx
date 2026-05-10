'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type MinitaskPickItem = { title: string; description?: string };

export interface MinitaskPickWidgetProps {
  goalId: string;
  feedback?: string;
  items: MinitaskPickItem[];
  disabled?: boolean;
  onRequestConfirm: (prompt: string) => void;
}

export function MinitaskPickWidget({
  goalId,
  feedback,
  items,
  disabled,
  onRequestConfirm,
}: MinitaskPickWidgetProps) {
  const [sel, setSel] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(items.map((_, i) => [i, true]))
  );
  const [busy, setBusy] = useState(false);

  const toggle = (i: number) => setSel((s) => ({ ...s, [i]: !s[i] }));

  const buildPrompt = () => {
    const picked = items.filter((_, i) => sel[i]);
    if (picked.length === 0) return '';
    const lines = picked.map((t) => {
      const d = t.description?.trim();
      return d ? `- ${t.title}: ${d}` : `- ${t.title}`;
    });
    return [
      `Quiero confirmar validate_goal (fase confirm) para la meta goalId=${goalId} con estas minitasks aceptadas:`,
      ...lines,
      `Usá la herramienta validate_goal con phase confirm y acceptedMiniTasks con título (y descripción si aplica) por ítem. Si hace falta ajustá acceptedTitle o acceptedDescription según el último preview.`,
    ].join('\n');
  };

  const submit = () => {
    const p = buildPrompt();
    if (!p) return;
    setBusy(true);
    try {
      onRequestConfirm(p);
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        No hay minitasks sugeridas en este preview. Pedile al agente otro validate_goal preview.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-left">
      {feedback ? (
        <div className="rounded-md border border-sky-500/25 bg-sky-500/5 px-2.5 py-2 text-[11px] text-foreground/90">
          <span className="font-medium text-sky-900 dark:text-sky-100">Feedback (resumen)</span>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{feedback}</p>
        </div>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        Elegí qué sugerencias incluir en la confirmación SMARTER. Se enviará un mensaje para que el agente proponga{' '}
        <code className="text-[10px]">validate_goal</code> confirm.
      </p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li
            key={i}
            className={cn(
              'flex gap-2 rounded-lg border px-2 py-2 text-xs',
              sel[i] ? 'border-primary/40 bg-primary/5' : 'border-border/60 opacity-80'
            )}
          >
            <Checkbox
              id={`mt-pick-${i}`}
              checked={Boolean(sel[i])}
              onCheckedChange={() => toggle(i)}
              disabled={disabled || busy}
              className="mt-0.5"
            />
            <Label htmlFor={`mt-pick-${i}`} className="flex-1 cursor-pointer font-normal leading-snug">
              <span className="font-medium">{it.title}</span>
              {it.description ? (
                <span className="mt-0.5 block text-[10px] text-muted-foreground">{it.description}</span>
              ) : null}
            </Label>
          </li>
        ))}
      </ul>
      <Button type="button" size="sm" className="w-full" disabled={disabled || busy} onClick={submit}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar selección al agente (confirm)'}
      </Button>
    </div>
  );
}
