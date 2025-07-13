// apps/web-app/app/api/upload/route.ts

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';
import { getBucketName, getPublicUrl, getR2Client } from '@/lib/r2-client';

export async function POST(request: NextRequest) {
  try {
    // 验证用户是否已登录
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 解析请求体
    const { filename, contentType } = await request.json();
    
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 生成唯一的文件名以避免覆盖
    const fileExt = filename.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    
    // 生成文件的完整路径，按用户ID组织
    const filePath = `uploads/${session.user.id}/${uniqueFileName}`;
    
    // 使用共享 R2 客户端
    const s3Client = await getR2Client();
    const bucketName = getBucketName();
    
    // 创建预签名URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      ContentType: contentType,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1小时有效期
    const fileUrl = getPublicUrl(filePath);
    
    return NextResponse.json({
      success: true,
      url: signedUrl,
      fileUrl: fileUrl,
      fileKey: filePath,
    });
    
  } catch (error) {
    console.error('生成预签名URL失败:', error);
    return NextResponse.json(
      { error: '生成上传链接失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
