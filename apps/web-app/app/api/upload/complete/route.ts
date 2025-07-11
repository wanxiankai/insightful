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

    // 2. 输入验证
    const body = await req.json();
    const { fileKey, fileName, fileUrl } = body;

    if (!fileKey || !fileName) {
      return NextResponse.json(
        { error: 'Missing fileKey or fileName' },
        { status: 400 }
      );
    }

    // 3. 数据库操作
    const newJob = await prisma.meetingJob.create({
      data: {
        userId,
        fileUrl,
        fileName,
        status: 'PENDING',
      },
    });

    // 4. 任务派发到 QStash
    await qstashClient.publishJSON({
      // URL 指向我们的 worker API
      // url: `${process.env.NEXT_PUBLIC_APP_URL}/api/worker`,
      url: `https://d4b4b1840b37.ngrok-free.app/api/worker`,
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
