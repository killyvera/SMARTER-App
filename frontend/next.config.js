/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@smarter-app/shared'],
  serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
};

module.exports = nextConfig;


