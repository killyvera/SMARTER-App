import { NextResponse } from 'next/server';

// Versión de la aplicación - se actualiza en cada build
// En producción, esto debería venir de una variable de entorno o del package.json
// Usar timestamp del build si está disponible, sino usar timestamp actual
const BUILD_TIMESTAMP = process.env.NEXT_PUBLIC_BUILD_TIME || process.env.BUILD_TIME || Date.now().toString();
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || process.env.APP_VERSION || `v${BUILD_TIMESTAMP}`;
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || process.env.BUILD_TIME || new Date().toISOString();

export async function GET() {
  // Headers para evitar caché
  return NextResponse.json(
    {
      version: APP_VERSION,
      buildTime: BUILD_TIME,
      timestamp: BUILD_TIMESTAMP,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}

