// apps/web-app/app/api/upload/delete/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
  try {
    // 1. 获取用户身份
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 从请求体中获取文件键
    const body = await request.json();
    const { fileKey } = body;

    if (!fileKey) {
      return NextResponse.json(
        { error: 'Missing fileKey parameter' },
        { status: 400 }
      );
    }

    console.log(`API Route - Deleting file from R2: ${fileKey}`);
    console.log(`API Route - Bucket name: ${process.env.R2_BUCKET_NAME}`);

    // 3. 删除 R2 中的文件
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileKey,
      });

      const result = await s3Client.send(deleteCommand);
      console.log('R2 delete result:', result);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error in R2 delete operation:', error);
      // 记录所有可以访问的错误属性
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      return NextResponse.json(
        { error: 'Failed to delete file from R2', message: String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in delete file API route:', error);
    return NextResponse.json(
      { error: 'Failed to process delete request', message: String(error) },
      { status: 500 }
    );
  }
}
