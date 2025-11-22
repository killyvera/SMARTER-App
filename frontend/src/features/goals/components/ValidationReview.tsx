'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TitleDescriptionComparison } from './TitleDescriptionComparison';
import { EditableMiniTasksList, type EditableMiniTask } from './EditableMiniTasksList';
import { SmarterScoreDisplay } from './SmarterScoreDisplay';
import { CheckCircle2, Sparkles } from 'lucide-react';
interface ValidationReviewProps {
  goalId: string;
  currentTitle: string;
  currentDescription?: string | null;
  score: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timebound: number;
    evaluate: number;
    readjust: number;
    average: number;
    passed: boolean;
  };
  feedback: string;
  suggestedTitle?: string | null;
  suggestedDescription?: string | null;
  suggestedMiniTasks?: Array<{
    title: string;
    description?: string;
    priority: number;
  }>;
  onConfirm: (data: {
    title: string;
    description?: string;
    miniTasks: Array<{ title: string; description?: string; priority: number }>;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ValidationReview({
  goalId,
  currentTitle,
  currentDescription,
  score,
  feedback,
  suggestedTitle,
  suggestedDescription,
  suggestedMiniTasks = [],
  onConfirm,
  onCancel,
  isLoading = false,
}: ValidationReviewProps) {
  const [finalTitle, setFinalTitle] = useState(currentTitle);
  const [finalDescription, setFinalDescription] = useState(currentDescription || '');
  const [acceptedMiniTasks, setAcceptedMiniTasks] = useState<EditableMiniTask[]>(() =>
    suggestedMiniTasks.map((task, index) => ({
      id: `suggested-${index}`,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'accepted' as const,
      selected: true, // Preseleccionadas por defecto
    }))
  );

  // Actualizar cuando cambien las sugerencias
  useEffect(() => {
    setAcceptedMiniTasks(
      suggestedMiniTasks.map((task, index) => ({
        id: `suggested-${index}`,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: 'accepted' as const,
        selected: true, // Preseleccionadas por defecto
      }))
    );
  }, [suggestedMiniTasks]);

  const handleTitleDescriptionAccept = (title: string, description?: string) => {
    setFinalTitle(title);
    setFinalDescription(description || '');
  };

  const handleTitleDescriptionReject = () => {
    // Mantener valores actuales
    setFinalTitle(currentTitle);
    setFinalDescription(currentDescription || '');
  };

  const handleConfirm = async () => {
    // Solo guardar las minitasks que estén seleccionadas
    const miniTasksToSave = acceptedMiniTasks
      .filter(task => task.selected)
      .map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
      }));

    console.log('ValidationReview - Minitasks a guardar:', {
      total: acceptedMiniTasks.length,
      selected: acceptedMiniTasks.filter(t => t.selected).length,
      toSave: miniTasksToSave,
    });

    await onConfirm({
      title: finalTitle,
      description: finalDescription || undefined,
      miniTasks: miniTasksToSave,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Resultados de Validación SMARTER
          </CardTitle>
          <CardDescription>
            Revisa las sugerencias de IA y confirma los cambios antes de validar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmarterScoreDisplay score={score} />
          {feedback && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Feedback:</p>
              <p className="text-sm">{feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <TitleDescriptionComparison
        currentTitle={currentTitle}
        currentDescription={currentDescription}
        suggestedTitle={suggestedTitle}
        suggestedDescription={suggestedDescription}
        onAccept={handleTitleDescriptionAccept}
        onReject={handleTitleDescriptionReject}
      />

      {suggestedMiniTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>MiniTasks Sugeridas</CardTitle>
            <CardDescription>
              Revisa, edita o elimina las minitasks sugeridas por IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditableMiniTasksList
              suggestedTasks={suggestedMiniTasks}
              onTasksChange={setAcceptedMiniTasks}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={isLoading}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {isLoading ? 'Validando...' : 'Validar Finalmente'}
        </Button>
      </div>
    </div>
  );
}

