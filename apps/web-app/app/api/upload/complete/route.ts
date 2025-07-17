// apps/web-app/app/api/upload/complete/route.ts

import { auth } from '@/auth';
import { getPublicUrl } from '@/lib/r2-client';
import { PrismaClient } from '@repo/database';
import { Client } from '@upstash/qstash';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// 初始化 QStash 客户端
const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(req: Request) {
  try {
    // 1. 身份认证
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 验证用户是否存在于数据库中
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    
    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. 输入验证
    const body = await req.json();
    const { fileKey, fileName, fileUrl, tempId } = body;

    if (!fileKey || !fileName) {
      return NextResponse.json(
        { error: 'Missing fileKey or fileName' },
        { status: 400 }
      );
    }

    // 3. 数据库操作 - 使用临时ID（如果提供）或生成新ID
    const jobId = tempId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 生成完整的公共 URL
    const fullFileUrl = fileUrl || getPublicUrl(fileKey);
    
    const newJob = await prisma.meetingJob.create({
      data: {
        id: jobId, // 使用前端传来的临时ID或生成新ID
        userId,
        fileUrl: fullFileUrl, // 存储完整的公共 URL
        fileName,
        fileKey,
        status: 'PENDING',
      },
    });
    
    // 强制同步操作，确保数据写入
    await prisma.$queryRaw`SELECT 1`;

    // 4. 任务派发到 QStash
    await qstashClient.publishJSON({
      // URL 指向我们的 worker API
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/worker`,
      // 消息体只包含任务ID
      body: {
        jobId: newJob.id,
      },
    });

    // 5. 返回响应
    return NextResponse.json({
      message: 'Upload complete, job created and dispatched.',
      jobId: newJob.id,
    });
  } catch (error) {
    console.error('Error in /api/upload/complete:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
