// apps/web-app/app/api/jobs/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@repo/database';

export async function GET() {
  try {
    // 验证用户是否已登录
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 获取当前用户的所有任务，按创建时间倒序排列
    const jobs = await prisma.meetingJob.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        status: true,
        createdAt: true,
      },
    });
    
    // 序列化日期对象
    const serializedJobs = jobs.map(job => ({
      ...job,
      createdAt: job.createdAt.toISOString(),
    }));
    
    return NextResponse.json(serializedJobs);
    
  } catch (error) {
    console.error('获取任务列表失败:', error);
    return NextResponse.json(
      { error: '获取任务列表失败' },
      { status: 500 }
    );
  }
}
