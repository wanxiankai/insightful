// apps/web-app/app/lib/r2-client.ts

import { S3Client } from '@aws-sdk/client-s3';

// 创建一个共享的 R2 客户端实例，确保所有API路由使用相同的配置
export async function getR2Client() {
  // 获取环境变量
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  
  // 确保端点配置正确
  if (!endpoint) {
    throw new Error('R2 endpoint not configured');
  }
  
  // 确保凭证存在
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }
  
  // 创建并返回 S3 客户端
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

// 获取存储桶名称
export function getBucketName() {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('R2 bucket name not configured');
  }
  return bucketName;
}

// 生成公共访问URL
export function getPublicUrl(key: string) {
  const publicUrlBase = process.env.R2_PUBLIC_URL;
  if (!publicUrlBase) {
    throw new Error('R2 public URL not configured');
  }
  
  // 确保URL格式正确
  // 去掉可能的末尾斜杠
  const base = publicUrlBase.endsWith('/') 
    ? publicUrlBase.slice(0, -1) 
    : publicUrlBase;
  
  // 确保 key 没有前导斜杠
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  
  return `${base}/${cleanKey}`;
}
