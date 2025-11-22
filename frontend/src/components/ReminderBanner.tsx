'use client';

import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ReminderBannerProps {
  title: string;
  message: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ReminderBanner({
  title,
  message,
  onDismiss,
  action,
}: ReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-md">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-800 mb-1">{title}</h4>
          <p className="text-sm text-yellow-700">{message}</p>
          {action && (
            <Button
              onClick={action.onClick}
              size="sm"
              variant="outline"
              className="mt-2"
            >
              {action.label}
            </Button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-yellow-600 hover:text-yellow-800"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}


