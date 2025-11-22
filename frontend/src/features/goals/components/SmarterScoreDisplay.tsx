'use client';

import type { SmarterScore } from '@smarter-app/shared';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SmarterScoreDisplayProps {
  score: SmarterScore;
}

const criteriaLabels: Record<string, string> = {
  specific: 'S - Específica',
  measurable: 'M - Medible',
  achievable: 'A - Alcanzable',
  relevant: 'R - Relevante',
  timebound: 'T - Con plazo',
  evaluate: 'E - Evaluable',
  readjust: 'R - Reajustable',
};

export function SmarterScoreDisplay({ score }: SmarterScoreDisplayProps) {
  const criteria = [
    { key: 'specific', value: score.specific },
    { key: 'measurable', value: score.measurable },
    { key: 'achievable', value: score.achievable },
    { key: 'relevant', value: score.relevant },
    { key: 'timebound', value: score.timebound },
    { key: 'evaluate', value: score.evaluate },
    { key: 'readjust', value: score.readjust },
  ];

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Puntuación SMARTER</h3>
        <div className="flex items-center gap-2">
          {score.passed ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-green-600 font-medium">Aprobada</span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-600 font-medium">No aprobada</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {criteria.map(({ key, value }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{criteriaLabels[key]}</span>
              <span className="font-medium">{value.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getScoreColor(value)}`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Promedio</span>
          <span className="text-lg font-bold">{score.average.toFixed(1)}/100</span>
        </div>
      </div>
    </div>
  );
}


