// apps/web-app/app/api/upload/direct/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@repo/database';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getBucketName, getPublicUrl, getR2Client } from '@/app/lib/r2-client';

// 设置更大的请求体大小限制
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // 最大支持50MB的文件
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    // 验证用户是否已登录
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 解析请求体
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '缺少文件' },
        { status: 400 }
      );
    }
    
    // 获取文件信息
    const fileName = file.name;
    const fileType = file.type;
    const fileContent = await file.arrayBuffer();
    
    // 生成唯一的文件名以避免覆盖
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    
    // 生成文件的完整路径，按用户ID组织
    const filePath = `uploads/${session.user.id}/${uniqueFileName}`;
    
    console.log(`开始上传文件: ${fileName} (${fileType}) 到 R2 路径: ${filePath}`);
    
    // 获取 R2 客户端和桶名
    const s3Client = getR2Client();
    const bucketName = getBucketName();
    
    // 上传文件到 R2
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: Buffer.from(fileContent),
      ContentType: fileType,
    });
    
    await s3Client.send(uploadCommand);
    
    console.log('文件上传成功，创建数据库记录...');
    
    // 构建完整的文件URL
    const fileUrl = getPublicUrl(filePath);
    
    // 创建一个新的会议任务记录
    const job = await prisma.meetingJob.create({
      data: {
        fileName: fileName,
        fileUrl: fileUrl,
        userId: session.user.id,
        status: 'PENDING',
      },
    });
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
      fileName: job.fileName,
      fileUrl: job.fileUrl,
    });
    
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { error: '文件上传失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
