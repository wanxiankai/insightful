// apps/web-app/app/api/upload/presigned-url/route.ts

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getBucketName, getR2Client } from '@/lib/r2-client';
import { requireAuth } from '@/lib/auth-utils';
import { handleApiRoute, apiErrors, createSuccessResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  return handleApiRoute(async () => {
    // 验证用户是否已登录
    const { user } = await requireAuth();

    // 解析请求体
    const { fileName, fileType } = await request.json();
    
    if (!fileName || !fileType) {
      return apiErrors.badRequest('缺少必要参数');
    }
    
    // 生成唯一的文件名以避免覆盖
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    
    // 生成文件的完整路径，按用户ID组织
    const filePath = `uploads/${user.id}/${uniqueFileName}`;
    
    // 使用共享 R2 客户端
    const s3Client = await getR2Client();
    const bucketName = getBucketName();
    
    // 创建预签名URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      ContentType: fileType,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1小时有效期
    
    return createSuccessResponse({
      presignedUrl: signedUrl,
      fileKey: filePath, // 前端需要记住这个 key，用于后续通知
    });
  });
}
