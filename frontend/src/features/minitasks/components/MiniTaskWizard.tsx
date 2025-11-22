'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMiniTaskSchema, type CreateMiniTaskInput } from '@smarter-app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';

interface MiniTaskWizardProps {
  goalId: string;
  onSubmit: (tasks: CreateMiniTaskInput[]) => void;
  isLoading?: boolean;
}

export function MiniTaskWizard({ goalId, onSubmit, isLoading }: MiniTaskWizardProps) {
  const [tasks, setTasks] = useState<Partial<CreateMiniTaskInput>[]>([
    { goalId, title: '', description: '' },
  ]);

  const addTask = () => {
    setTasks([...tasks, { goalId, title: '', description: '' }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof CreateMiniTaskInput, value: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validTasks = tasks.filter(
      (task) => task.title && createMiniTaskSchema.safeParse(task).success
    ) as CreateMiniTaskInput[];
    onSubmit(validTasks);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {tasks.map((task, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">MiniTask {index + 1}</h4>
              {tasks.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTask(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Label>Título *</Label>
              <Input
                value={task.title || ''}
                onChange={(e) => updateTask(index, 'title', e.target.value)}
                placeholder="Ej: Escribir 500 palabras del capítulo 1"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={task.description || ''}
                onChange={(e) => updateTask(index, 'description', e.target.value)}
                placeholder="Descripción opcional..."
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addTask} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Agregar MiniTask
      </Button>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creando...' : 'Crear MiniTasks'}
      </Button>
    </form>
  );
}


