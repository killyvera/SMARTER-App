'use client';

import { useMemo } from 'react';

interface GoalProgressBarProps {
  completed: number;
  total: number;
  percentage?: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GoalProgressBar({
  completed,
  total,
  percentage: providedPercentage,
  showText = true,
  size = 'md',
  className = '',
}: GoalProgressBarProps) {
  const percentage = useMemo(() => {
    if (providedPercentage !== undefined) {
      return providedPercentage;
    }
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [completed, total, providedPercentage]);

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  const textSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  // Determinar color según porcentaje
  const getProgressColor = () => {
    if (percentage === 100) return 'bg-green-600';
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (total === 0) {
    return (
      <div className={`space-y-1 ${className}`}>
        {showText && (
          <div className={`flex items-center justify-between ${textSizeClass} text-muted-foreground`}>
            <span>Sin minitasks</span>
          </div>
        )}
        <div className={`w-full bg-muted rounded-full ${heightClass} overflow-hidden`}>
          <div className="h-full bg-muted" style={{ width: '0%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {showText && (
        <div className={`flex items-center justify-between ${textSizeClass} text-muted-foreground`}>
          <span>
            {completed} de {total} minitasks completadas
          </span>
          <span className="font-medium">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-muted rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`h-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

