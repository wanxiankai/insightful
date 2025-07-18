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
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    outputFileTracingIncludes: {
      '/api/**/*': ['../../packages/database/generated/prisma/**'],
      '/*': ['../../packages/database/generated/prisma/**']
    }
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@prisma/client': '@prisma/client',
        'prisma': 'prisma'
      });
    }
    return config
  },
  outputFileTracing: true,
  transpilePackages: ['database'],
};

export default nextConfig;