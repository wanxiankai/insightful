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
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 重要：确保 Prisma 查询引擎被正确打包
      config.externals = config.externals || [];
      config.externals.push({
        '@prisma/client': '@prisma/client',
        'prisma': 'prisma'
      });
    }
    return config
  },
  outputFileTracing: true,
  // 添加这个配置来确保 monorepo 中的文件被正确追踪
  transpilePackages: ['database'],
};

export default nextConfig;