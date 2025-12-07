import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { InstallBanner } from '@/components/InstallBanner';

const inter = Inter({ subsets: ['latin'] });
const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smarter App - Gestión de Metas',
  description: 'Aplicación para gestión de metas basada en el método SMARTER',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smarter App',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#222222',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#222222" />
      </head>
      <body className={`${inter.className} ${orbitron.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Inicializar tema antes de renderizar para evitar FOUC
              (function() {
                const savedTheme = localStorage.getItem('theme') || 'light';
                const root = document.documentElement;
                root.classList.remove('light', 'dark', 'cyberpunk');
                root.classList.add(savedTheme);
              })();
            `,
          }}
        />
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
                    .then((reg) => {
                      console.log('Service Worker registrado:', reg);
                      
                      // Verificar actualizaciones periódicamente
                      setInterval(() => {
                        reg.update();
                      }, 60 * 60 * 1000); // Cada hora
                      
                      // Escuchar cambios en el service worker
                      reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              // Hay una nueva versión disponible
                              console.log('Nueva versión del Service Worker disponible');
                              // El componente UpdateBanner se encargará de mostrar la notificación
                            }
                          });
                        }
                      });
                    })
                    .catch((err) => console.error('Error registrando Service Worker:', err));
                });
                
                // Escuchar mensajes del service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                  if (event.data && event.data.type === 'SW_ACTIVATED') {
                    console.log('Service Worker activado con versión:', event.data.version);
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
