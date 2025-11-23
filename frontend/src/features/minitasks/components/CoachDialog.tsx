'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { useQueryCoach } from '../hooks/useMiniTaskJournal';
import type { CoachSuggestion } from '@/types/miniTaskJournal';

interface CoachDialogProps {
  miniTaskId: string;
  open: boolean;
  onClose: () => void;
}

export function CoachDialog({ miniTaskId, open, onClose }: CoachDialogProps) {
  const [query, setQuery] = useState('');
  const queryCoach = useQueryCoach();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      await queryCoach.mutateAsync({
        miniTaskId,
        query: query.trim(),
        includeHistory: true,
      });
    } catch (error) {
      console.error('Error al consultar al coach:', error);
    }
  };

  const suggestionIcons = {
    improvement: TrendingUp,
    warning: AlertTriangle,
    encouragement: Lightbulb,
    action: Sparkles,
  };

  const suggestionColors = {
    improvement: 'text-blue-600',
    warning: 'text-orange-600',
    encouragement: 'text-green-600',
    action: 'text-purple-600',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Coach SMARTER
          </DialogTitle>
          <DialogDescription>
            Haz una pregunta sobre tu progreso y recibe feedback personalizado basado en metodología SMARTER
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="coach-query">Tu pregunta</Label>
            <Textarea
              id="coach-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: ¿Cómo voy con esta tarea? ¿Qué debería hacer hoy? ¿Estoy en el camino correcto?"
              rows={3}
              disabled={queryCoach.isPending}
            />
          </div>

          <Button
            type="submit"
            disabled={!query.trim() || queryCoach.isPending}
            className="w-full"
          >
            {queryCoach.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Consultando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Consultar Coach
              </>
            )}
          </Button>
        </form>

        {queryCoach.data && (
          <div className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Feedback</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {queryCoach.data.feedback}
                </p>
              </CardContent>
            </Card>

            {queryCoach.data.suggestions && queryCoach.data.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Sugerencias</h4>
                <div className="space-y-2">
                  {queryCoach.data.suggestions.map((suggestion: CoachSuggestion, index: number) => {
                    const Icon = suggestionIcons[suggestion.type] || Sparkles;
                    const color = suggestionColors[suggestion.type] || 'text-gray-600';
                    
                    return (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <Icon className={`h-5 w-5 ${color} mt-0.5 flex-shrink-0`} />
                            <div className="flex-1">
                              <h5 className="font-medium mb-1">{suggestion.title}</h5>
                              <p className="text-sm text-muted-foreground">
                                {suggestion.description}
                              </p>
                              {suggestion.priority && (
                                <span className="text-xs text-muted-foreground mt-1 inline-block">
                                  Prioridad: {suggestion.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {queryCoach.data.encouragement && (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-green-600 mt-0.5" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {queryCoach.data.encouragement}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {queryCoach.data.warnings && queryCoach.data.warnings.length > 0 && (
              <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-orange-700 dark:text-orange-300 mb-2">
                        Alertas
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-orange-700 dark:text-orange-300">
                        {queryCoach.data.warnings.map((warning: string, index: number) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {queryCoach.data.smarterEvaluation && (
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-3">Evaluación SMARTER</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Específica</p>
                      <p className="text-lg font-bold">{queryCoach.data.smarterEvaluation.specific}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Medible</p>
                      <p className="text-lg font-bold">{queryCoach.data.smarterEvaluation.measurable}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alcanzable</p>
                      <p className="text-lg font-bold">{queryCoach.data.smarterEvaluation.achievable}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Relevante</p>
                      <p className="text-lg font-bold">{queryCoach.data.smarterEvaluation.relevant}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Con plazo</p>
                      <p className="text-lg font-bold">{queryCoach.data.smarterEvaluation.timebound}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Promedio:</span>
                      <span className="text-lg font-bold">
                        {queryCoach.data.smarterEvaluation.average.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium">Estado:</span>
                      <span
                        className={`text-sm font-bold ${
                          queryCoach.data.smarterEvaluation.passed
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }`}
                      >
                        {queryCoach.data.smarterEvaluation.passed ? '✓ Aprobado' : '⚠ Necesita mejora'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {queryCoach.error && (
          <Card className="bg-destructive/10 border-destructive">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive">
                Error: {queryCoach.error instanceof Error ? queryCoach.error.message : 'Error desconocido'}
              </p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}

