/** @type {import('next').NextConfig} */
const nextConfig = {
  // 指定哪些环境变量可以在客户端使用
  env: {
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  },
};

export default nextConfig;
