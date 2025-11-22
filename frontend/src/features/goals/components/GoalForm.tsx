'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGoalSchema, type CreateGoalInput } from '@smarter-app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface GoalFormProps {
  onSubmit: (data: CreateGoalInput) => void;
  isLoading?: boolean;
  defaultValues?: Partial<CreateGoalInput>;
}

export function GoalForm({ onSubmit, isLoading, defaultValues }: GoalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues,
  });

  // Transformar el deadline de datetime-local a ISO string antes de enviar
  const handleFormSubmit = (data: CreateGoalInput) => {
    // Si hay deadline en formato datetime-local, convertirlo a ISO string
    if (data.deadline && typeof data.deadline === 'string' && data.deadline.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      // Convertir datetime-local (YYYY-MM-DDTHH:mm) a ISO string
      const isoString = new Date(data.deadline).toISOString();
      onSubmit({ ...data, deadline: isoString });
    } else {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Ej: Escribir un libro de 200 páginas"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe tu meta en detalle..."
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-destructive mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="deadline">Fecha límite</Label>
        <Input
          id="deadline"
          type="datetime-local"
          {...register('deadline')}
        />
        {errors.deadline && (
          <p className="text-sm text-destructive mt-1">
            {errors.deadline.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Guardando...' : 'Crear Meta'}
      </Button>
    </form>
  );
}


