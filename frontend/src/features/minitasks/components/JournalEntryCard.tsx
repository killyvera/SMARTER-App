'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, TrendingUp, Edit, Trash2, Smile, Meh, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MiniTaskJournalEntry } from '@/types/miniTaskJournal';

interface JournalEntryCardProps {
  entry: MiniTaskJournalEntry;
  onEdit?: (entry: MiniTaskJournalEntry) => void;
  onDelete?: (entryId: string) => void;
  canEdit?: boolean;
}

const moodIcons = {
  positivo: Smile,
  neutral: Meh,
  negativo: Frown,
};

const moodColors = {
  positivo: 'text-green-600',
  neutral: 'text-yellow-600',
  negativo: 'text-red-600',
};

export function JournalEntryCard({
  entry,
  onEdit,
  onDelete,
  canEdit = true,
}: JournalEntryCardProps) {
  const MoodIcon = entry.mood ? moodIcons[entry.mood as keyof typeof moodIcons] : null;
  const moodColor = entry.mood ? moodColors[entry.mood as keyof typeof moodColors] : '';

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {format(new Date(entry.entryDate), 'dd MMM yyyy', { locale: es })}
          </span>
        </div>
        {canEdit && (onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(entry)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {entry.progressValue !== null && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <span className="text-lg font-bold">{entry.progressValue}</span>
              {entry.progressUnit && (
                <span className="text-sm text-muted-foreground ml-1">
                  {entry.progressUnit}
                </span>
              )}
            </div>
          </div>
        )}

        {entry.timeSpent !== null && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {entry.timeSpent} min
            </span>
          </div>
        )}
      </div>

      {entry.mood && MoodIcon && (
        <div className="flex items-center gap-2">
          <MoodIcon className={`h-4 w-4 ${moodColor}`} />
          <span className="text-sm capitalize">{entry.mood}</span>
        </div>
      )}

      {entry.notes && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Notas:</p>
          <p className="text-sm">{entry.notes}</p>
        </div>
      )}

      {entry.obstacles && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Obstáculos:</p>
          <p className="text-sm text-orange-600">{entry.obstacles}</p>
        </div>
      )}

      {entry.coachQuery && entry.coachResponse && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-1">Consulta al Coach:</p>
          <p className="text-sm font-medium mb-2">{entry.coachQuery}</p>
          <p className="text-sm text-muted-foreground">{entry.coachResponse}</p>
        </div>
      )}
    </div>
  );
}

