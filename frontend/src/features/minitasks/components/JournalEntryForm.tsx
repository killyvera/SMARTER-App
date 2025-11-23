'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import type { CreateMiniTaskJournalEntryInput } from '@/types/miniTaskJournal';

interface JournalEntryFormProps {
  miniTaskId: string;
  onSubmit: (data: CreateMiniTaskJournalEntryInput) => Promise<void>;
  onCancel?: () => void;
  initialData?: CreateMiniTaskJournalEntryInput;
  isLoading?: boolean;
}

export function JournalEntryForm({
  miniTaskId,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: JournalEntryFormProps) {
  const [entryDate, setEntryDate] = useState(
    initialData?.entryDate
      ? typeof initialData.entryDate === 'string'
        ? initialData.entryDate.split('T')[0]
        : new Date(initialData.entryDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const predefinedUnits = ['horas', 'páginas', 'items', '%', 'minutos', 'ejercicios', 'lecciones', 'sesiones', 'veces'];
  const initialUnit = initialData?.progressUnit || '';
  const isInitialCustom = initialUnit && !predefinedUnits.includes(initialUnit);
  
  const [progressValue, setProgressValue] = useState(initialData?.progressValue?.toString() || '');
  const [progressUnit, setProgressUnit] = useState(isInitialCustom ? '' : initialUnit);
  const [customUnit, setCustomUnit] = useState(isInitialCustom ? initialUnit : '');
  const [isCustomUnit, setIsCustomUnit] = useState(isInitialCustom);
  const [timeSpent, setTimeSpent] = useState(initialData?.timeSpent?.toString() || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [obstacles, setObstacles] = useState(initialData?.obstacles || '');
  const [mood, setMood] = useState<'' | 'positivo' | 'neutral' | 'negativo'>(initialData?.mood || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalUnit = isCustomUnit ? customUnit : progressUnit;
    
    // Crear fecha correctamente desde el string YYYY-MM-DD para evitar problemas de zona horaria
    // Si solo tenemos la fecha (sin hora), crear la fecha en zona horaria local
    const [year, month, day] = entryDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    await onSubmit({
      entryDate: dateObj,
      progressValue: progressValue ? parseFloat(progressValue) : undefined,
      progressUnit: finalUnit || undefined,
      timeSpent: timeSpent ? parseInt(timeSpent) : undefined,
      notes: notes || undefined,
      obstacles: obstacles || undefined,
      mood: mood || undefined,
    });
    
    // Reset form
    if (!initialData) {
      setProgressValue('');
      setProgressUnit('');
      setCustomUnit('');
      setIsCustomUnit(false);
      setTimeSpent('');
      setNotes('');
      setObstacles('');
      setMood('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="entryDate">Fecha</Label>
          <Input
            id="entryDate"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="mood">Estado de ánimo</Label>
          <select
            id="mood"
            value={mood}
            onChange={(e) => setMood(e.target.value as typeof mood)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Seleccionar...</option>
            <option value="positivo">Positivo</option>
            <option value="neutral">Neutral</option>
            <option value="negativo">Negativo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="progressValue">Progreso</Label>
          <div className="flex gap-2">
            <Input
              id="progressValue"
              type="number"
              step="0.1"
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
              placeholder="0"
              className="flex-1"
            />
            {!isCustomUnit ? (
              <select
                value={progressUnit}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomUnit(true);
                    setProgressUnit('');
                  } else {
                    setProgressUnit(e.target.value);
                  }
                }}
                className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Unidad...</option>
                <option value="horas">horas</option>
                <option value="páginas">páginas</option>
                <option value="items">items</option>
                <option value="%">%</option>
                <option value="minutos">minutos</option>
                <option value="ejercicios">ejercicios</option>
                <option value="lecciones">lecciones</option>
                <option value="sesiones">sesiones</option>
                <option value="veces">veces</option>
                <option value="custom">Personalizada...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="especificar unidad"
                  className="w-32"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCustomUnit(false);
                    setCustomUnit('');
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          {(progressUnit || (isCustomUnit && customUnit)) && (
            <p className="text-xs text-muted-foreground mt-1">
              Unidad: <span className="font-medium">{isCustomUnit ? customUnit : progressUnit}</span>
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="timeSpent">Tiempo dedicado (minutos)</Label>
          <Input
            id="timeSpent"
            type="number"
            min="0"
            value={timeSpent}
            onChange={(e) => setTimeSpent(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="¿Qué hiciste hoy? ¿Cómo te sentiste?"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="obstacles">Obstáculos encontrados</Label>
        <Textarea
          id="obstacles"
          value={obstacles}
          onChange={(e) => setObstacles(e.target.value)}
          placeholder="¿Qué dificultades encontraste?"
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          <Check className="h-4 w-4 mr-2" />
          {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}

