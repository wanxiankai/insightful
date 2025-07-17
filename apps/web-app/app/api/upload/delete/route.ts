// apps/web-app/app/api/upload/delete/route.ts
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { requireAuth } from '@/lib/auth-utils';
import { handleApiRoute, apiErrors, createSuccessResponse } from '@/lib/api-utils';

// 初始化 S3 客户端（用于访问 Cloudflare R2）
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `${process.env.R2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // 强制使用路径样式而非虚拟主机样式
});

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    // 1. 验证用户身份
    await requireAuth();

    // 2. 从请求体中获取文件键
    const body = await request.json();
    const { fileKey } = body;

    if (!fileKey) {
      return apiErrors.badRequest('Missing fileKey parameter');
    }

    // 3. 删除 R2 中的文件
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileKey,
    });

    await s3Client.send(deleteCommand);
    
    return createSuccessResponse();
  });
}
