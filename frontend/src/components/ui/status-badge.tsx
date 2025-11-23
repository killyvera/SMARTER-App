'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Circle, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface StatusBadgeProps {
  status: TaskStatus | string;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; className: string }> = {
  DRAFT: {
    label: 'Borrador',
    variant: 'outline',
    icon: FileText,
    className: 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900 dark:border-gray-700',
  },
  PENDING: {
    label: 'Pendiente',
    variant: 'secondary',
    icon: Clock,
    className: 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950 dark:border-yellow-800',
  },
  IN_PROGRESS: {
    label: 'En Progreso',
    variant: 'default',
    icon: Clock,
    className: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950 dark:border-blue-800',
  },
  COMPLETED: {
    label: 'Completada',
    variant: 'default',
    icon: CheckCircle2,
    className: 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-800',
  },
  CANCELLED: {
    label: 'Cancelada',
    variant: 'destructive',
    icon: XCircle,
    className: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-800',
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: 'outline' as const,
    icon: Circle,
    className: 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900 dark:border-gray-700',
  };

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 font-medium border',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{config.label}</span>
    </Badge>
  );
}

