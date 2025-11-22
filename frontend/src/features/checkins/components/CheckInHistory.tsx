'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCheckIns } from '../hooks/useCheckIns';
import type { CheckInResponse } from '@smarter-app/shared';
import { Calendar, TrendingUp } from 'lucide-react';

interface CheckInHistoryProps {
  goalId: string;
}

export function CheckInHistory({ goalId }: CheckInHistoryProps) {
  const { data: checkIns, isLoading } = useCheckIns(goalId);

  if (isLoading) {
    return <div>Cargando check-ins...</div>;
  }

  if (!checkIns || checkIns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay check-ins registrados aún
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Historial de Check-ins</h3>
      <div className="space-y-3">
        {checkIns.map((checkIn) => (
          <CheckInCard key={checkIn.id} checkIn={checkIn} />
        ))}
      </div>
    </div>
  );
}

function CheckInCard({ checkIn }: { checkIn: CheckInResponse }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold">{checkIn.progressPercentage}%</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(checkIn.createdAt), 'dd MMM yyyy', { locale: es })}
          </span>
        </div>
      </div>

      {checkIn.currentValue && (
        <p className="text-sm font-medium mb-2">{checkIn.currentValue}</p>
      )}

      {checkIn.notes && (
        <p className="text-sm text-muted-foreground mb-2">{checkIn.notes}</p>
      )}

      {checkIn.mood && (
        <div className="mt-2">
          <span className="text-xs bg-muted px-2 py-1 rounded">
            {checkIn.mood}
          </span>
        </div>
      )}
    </div>
  );
}


