'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCheckInSchema, type CreateCheckInInput } from '@smarter-app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CheckInFormProps {
  goalId: string;
  onSubmit: (data: CreateCheckInInput) => void;
  isLoading?: boolean;
}

export function CheckInForm({ goalId, onSubmit, isLoading }: CheckInFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCheckInInput>({
    resolver: zodResolver(createCheckInSchema),
    defaultValues: {
      goalId,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="progressPercentage">Progreso (%) *</Label>
        <Input
          id="progressPercentage"
          type="number"
          min="0"
          max="100"
          {...register('progressPercentage', { valueAsNumber: true })}
        />
        {errors.progressPercentage && (
          <p className="text-sm text-destructive mt-1">
            {errors.progressPercentage.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="currentValue">Valor Actual</Label>
        <Input
          id="currentValue"
          {...register('currentValue')}
          placeholder="Ej: 3 capítulos completados"
        />
        {errors.currentValue && (
          <p className="text-sm text-destructive mt-1">
            {errors.currentValue.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Describe tu progreso, desafíos, logros..."
          rows={4}
        />
        {errors.notes && (
          <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="mood">Estado de ánimo</Label>
        <Input
          id="mood"
          {...register('mood')}
          placeholder="Ej: motivado, cansado, entusiasmado..."
        />
        {errors.mood && (
          <p className="text-sm text-destructive mt-1">{errors.mood.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Guardando...' : 'Registrar Check-in'}
      </Button>
    </form>
  );
}


