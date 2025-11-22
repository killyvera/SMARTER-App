import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { InstallBanner } from '@/components/InstallBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smarter App - Gestión de Metas',
  description: 'Aplicación para gestión de metas basada en el método SMARTER',
  manifest: '/manifest.webmanifest',
  themeColor: '#222222',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smarter App',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <InstallBanner />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => console.log('Service Worker registrado:', reg))
                    .catch((err) => console.error('Error registrando Service Worker:', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
