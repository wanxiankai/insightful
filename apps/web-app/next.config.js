/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Moved from experimental in Next.js 16
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Moved from experimental.outputFileTracingIncludes in Next.js 16
  outputFileTracingIncludes: {
    '/api/**/*': ['../../packages/database/generated/prisma/**'],
    '/*': ['../../packages/database/generated/prisma/**']
  },
  // Configure Turbopack for monorepo setup (relative path from web-app)
  turbopack: {
    root: '../..',
  },
  transpilePackages: ['database'],
};

export default nextConfig;
