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

    // 3. 数据库操作 - 处理重复ID的情况
    let jobId = tempId || generateUniqueId('job');

    // 生成完整的公共 URL
    const fullFileUrl = fileUrl || getPublicUrl(fileKey);

    console.log('Creating job with:', { jobId, userId, fullFileUrl, fileName, fileKey });

    let newJob;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // 首先检查是否已存在相同ID的job
        const existingJob = await prisma.meetingJob.findUnique({
          where: { id: jobId }
        });

        if (existingJob) {
          console.log(`Job with ID ${jobId} already exists, generating new ID`);
          jobId = generateUniqueId('job');
          retryCount++;
          continue;
        }

        // 尝试创建新job
        newJob = await prisma.meetingJob.create({
          data: {
            id: jobId,
            userId,
            fileUrl: fullFileUrl,
            fileName,
            fileKey,
            status: 'PENDING',
          },
        });

        console.log('Job created successfully:', newJob.id);
        break; // 成功创建，退出循环

      } catch (error: any) {
        const prismaError = error as any;
        if (prismaError?.code === 'P2002' && prismaError?.meta?.target?.includes('id')) {
          // 唯一约束冲突，生成新ID重试
          console.log(`Unique constraint violation for ID ${jobId}, retrying with new ID`);
          jobId = generateUniqueId('job');
          retryCount++;

          if (retryCount >= maxRetries) {
            console.error('Max retries reached for job creation');
            throw new Error('Failed to create job after multiple attempts due to ID conflicts');
          }
        } else {
          // 其他错误，直接抛出
          throw error;
        }
      }
    }

    if (!newJob) {
      throw new Error('Failed to create job');
    }

    console.log('Job created successfully:', newJob.id);

    // 强制同步操作，确保数据写入
    await prisma.$queryRaw`SELECT 1`;

    // 4. 任务派发到 QStash
    const qstashUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker`;
    // const qstashUrl = `https://8373dfffbe63.ngrok-free.app/api/worker`;
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