'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SmarterMark } from '@/components/brand/SmarterMark';
import { cn } from '@/lib/utils';

const PNG = '/icon-192x192.png';
const ENV_LOGO = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_LOGO_URL?.trim() : '';

/**
 * Icono del menú: NEXT_PUBLIC_APP_LOGO_URL, luego PNG público, fallback SVG SmarterMark.
 */
export function AppMenuButtonIcon({ className }: { className?: string }) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <SmarterMark className={cn('h-8 w-8', className)} />;
  }

  if (ENV_LOGO) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ENV_LOGO}
        alt=""
        width={32}
        height={32}
        className={cn('rounded-lg object-cover', className)}
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <Image
      src={PNG}
      alt=""
      width={32}
      height={32}
      className={cn('rounded-lg', className)}
      unoptimized
      priority
      onError={() => setUseFallback(true)}
    />
  );
}
