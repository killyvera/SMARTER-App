/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@smarter-app/shared'],
  // serverComponentsExternalPackages no está disponible en Next.js 14.0.4
  // Next.js maneja automáticamente los paquetes nativos como @prisma/client y bcrypt
};

module.exports = nextConfig;


