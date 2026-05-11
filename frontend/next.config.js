/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
      } catch {
        return undefined;
      }
    })()
  : undefined;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@smarter-app/shared'],
  ...(supabaseHost && {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: supabaseHost,
          pathname: '/storage/v1/object/public/**',
        },
      ],
    },
  }),
  // Configuración para Netlify
  ...(process.env.NETLIFY && {
    // En Netlify, usar output standalone para mejor compatibilidad
    output: 'standalone',
  }),
  // Deshabilitar cache de TypeScript en producción para evitar detección de secretos
  ...(process.env.NODE_ENV === 'production' && {
    typescript: {
      // No generar .tsbuildinfo en producción
    },
    // Reducir cache de webpack
    webpack: (config, { isServer }) => {
      if (process.env.NETLIFY) {
        // En Netlify, deshabilitar cache de webpack
        config.cache = false;
      }
      return config;
    },
  }),
  // serverComponentsExternalPackages no está disponible en Next.js 14.0.4
  // Next.js maneja automáticamente los paquetes nativos como @prisma/client y bcrypt
};

module.exports = nextConfig;


