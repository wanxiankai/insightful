import { auth } from '@/auth';
import { getPublicUrl } from '@/lib/r2-client';
import { prisma } from '@repo/database';
import { Client } from '@upstash/qstash';
import { NextResponse } from 'next/server';
import { generateUniqueId } from '@/lib/api-utils';

// 初始化 QStash 客户端
const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(req: Request) {
  try {
    // 1. 身份认证
    const session = await auth();
    
    if (!session?.user?.id) {
      console.error('Upload complete: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 验证用户是否存在于数据库中
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    
    if (!userExists) {
      console.error(`Upload complete: User not found - ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. 输入验证
    const body = await req.json();
    const { fileKey, fileName, fileUrl, tempId } = body;

    console.log('Upload complete request:', { fileKey, fileName, fileUrl, tempId, userId });

    if (!fileKey || !fileName) {
      console.error('Upload complete: Missing required fields', { fileKey, fileName });
      return NextResponse.json(
        { error: 'Missing fileKey or fileName' },
        { status: 400 }
      );
    }

    // 3. 数据库操作 - 使用临时ID（如果提供）或生成新ID
    const jobId = tempId || generateUniqueId('job');
    
    // 生成完整的公共 URL
    const fullFileUrl = fileUrl || getPublicUrl(fileKey);
    
    console.log('Creating job with:', { jobId, userId, fullFileUrl, fileName, fileKey });

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
    
    console.log('Job created successfully:', newJob.id);
    
    // 强制同步操作，确保数据写入
    await prisma.$queryRaw`SELECT 1`;

    // 4. 任务派发到 QStash
    const qstashUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker`;
    // const qstashUrl = `https://ab9bd1d0ff2e.ngrok-free.app/api/worker`;
    console.log('Dispatching to QStash:', qstashUrl);

    await qstashClient.publishJSON({
      // URL 指向我们的 worker API
      url: qstashUrl,
      // 消息体只包含任务ID
      body: {
        jobId: newJob.id,
      },
    });

    console.log('Job dispatched to QStash successfully');

    // 5. 返回响应
    return NextResponse.json({
      message: 'Upload complete, job created and dispatched.',
      jobId: newJob.id,
    });
  } catch (error) {
    console.error('Upload complete error:', error);
    
    // 返回更详细的错误信息（仅在开发环境）
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        ...(isDev && { details: error instanceof Error ? error.message : String(error) })
      },
      { status: 500 }
    );
  }
}