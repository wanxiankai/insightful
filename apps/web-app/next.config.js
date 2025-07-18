/** @type {import('next').NextConfig} */
const nextConfig = {
  // 指定哪些环境变量可以在客户端使用
  env: {
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  },
  /* config options here */
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
    serverComponentsExternalPackages: ['@prisma/client']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  // 确保 Prisma 二进制文件被正确复制
  outputFileTracing: true,

};

export default nextConfig;
