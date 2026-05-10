'use client';

import { cn } from '@/lib/utils';

/** Marca vectorial local (no depende de CDN ni del optimizador de imágenes). */
export function SmarterMark({ className, title = 'Smarter' }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="smarterMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4a574" />
          <stop offset="100%" stopColor="#8b6914" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#smarterMarkGrad)" />
      <path
        d="M14 32V16h4l4 10 4-10h4v16h-3.5V22l-3.5 8h-2l-3.5-8v10H14z"
        fill="#fffef8"
        opacity="0.95"
      />
      <circle cx="36" cy="14" r="5" fill="#fffef8" opacity="0.35" />
    </svg>
  );
}
