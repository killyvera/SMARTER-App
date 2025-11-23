'use client';

import { useState, useEffect } from 'react';
import { Check, X, Calendar as CalendarIcon, ListChecks } from 'lucide-react';
import { format, isToday, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useMiniTaskJournal, useCreateMiniTaskJournalEntry, useUpdateMiniTaskJournalEntry } from '../hooks/useMiniTaskJournal';
import { ChecklistItemManager } from './ChecklistItemManager';
import type { MiniTaskJournalEntry } from '@/types/miniTaskJournal';

interface ChecklistViewProps {
  miniTaskId: string;
  checklistLabel?: string;
  checklistType?: 'single' | 'daily' | 'multi-item';
  checklistItems?: string[]; // Items iniciales para multi-item
  journalEntries?: MiniTaskJournalEntry[];
}

export function ChecklistView({ 
  miniTaskId, 
  checklistLabel, 
  checklistType = 'daily',
  checklistItems = [],
  journalEntries = [] 
}: ChecklistViewProps) {
  const today = startOfDay(new Date());
  const { data: allEntries } = useMiniTaskJournal(miniTaskId);
  const createEntry = useCreateMiniTaskJournalEntry();
  const updateEntry = useUpdateMiniTaskJournalEntry();

  // Encontrar entrada de hoy
  const todayEntry = allEntries?.find(entry => 
    isSameDay(new Date(entry.entryDate), today)
  );

  const isChecked = todayEntry?.checklistCompleted ?? false;

  // Para eventos únicos (single o multi-item), mostrar ChecklistItemManager
  if (checklistType === 'single' || checklistType === 'multi-item') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            {checklistType === 'single' ? 'Checklist' : 'Checklist de Elementos'}
            {checklistLabel && (
              <span className="text-sm font-normal text-muted-foreground">
                - {checklistLabel}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChecklistItemManager 
            miniTaskId={miniTaskId}
            checklistType={checklistType}
            initialItems={checklistItems}
          />
        </CardContent>
      </Card>
    );
  }

  // Historial de últimos 7 días
  const recentEntries = (allEntries || [])
    .filter(entry => {
      const entryDate = startOfDay(new Date(entry.entryDate));
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff < 7;
    })
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  const handleToggle = async () => {
    const newValue = !isChecked;
    
    try {
      if (todayEntry) {
        // Actualizar entrada existente
        await updateEntry.mutateAsync({
          miniTaskId,
          entryId: todayEntry.id,
          data: { checklistCompleted: newValue },
        });
      } else {
        // Crear nueva entrada solo con el checklist
        await createEntry.mutateAsync({
          miniTaskId,
          data: {
            entryDate: today,
            checklistCompleted: newValue,
          },
        });
      }
    } catch (error) {
      console.error('Error al actualizar checklist:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Checklist Diario
          {checklistLabel && (
            <span className="text-sm font-normal text-muted-foreground">
              - {checklistLabel}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checkbox principal para hoy */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-card">
          <Checkbox
            id="checklist-today"
            checked={isChecked}
            onCheckedChange={handleToggle}
            disabled={createEntry.isPending || updateEntry.isPending}
            className="h-5 w-5"
          />
          <label
            htmlFor="checklist-today"
            className="flex-1 cursor-pointer"
          >
            <div className="font-medium">
              {isToday(today) ? 'Hoy' : format(today, 'EEEE, d MMMM', { locale: es })}
            </div>
            <div className="text-sm text-muted-foreground">
              {checklistLabel || 'Marcar como completado'}
            </div>
          </label>
          {isChecked && (
            <div className="text-green-600">
              <Check className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Historial de últimos días */}
        {recentEntries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Historial (últimos 7 días)</h4>
            <div className="space-y-1">
              {recentEntries.map(entry => {
                const entryDate = startOfDay(new Date(entry.entryDate));
                const isEntryToday = isSameDay(entryDate, today);
                
                if (isEntryToday) return null; // Ya se muestra arriba
                
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${
                      entry.checklistCompleted
                        ? 'bg-green-50 text-green-900'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {entry.checklistCompleted ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="flex-1">
                      {isToday(entryDate)
                        ? 'Hoy'
                        : format(entryDate, 'EEEE, d MMMM', { locale: es })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

