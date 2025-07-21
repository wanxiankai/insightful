// apps/web-app/app/api/jobs/route.ts

import { prisma } from '@repo/database';
import { validateUser } from '@/lib/auth-utils';
import { handleApiRoute } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

export async function GET() {
  return handleApiRoute(async () => {
    // 验证用户是否已登录
    const { user, error } = await validateUser();
    if (error) return error;

    // 获取当前用户的所有任务，按创建时间倒序排列
    const jobs = await prisma.meetingJob.findMany({
      where: {
        userId: user.id,
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
  });
}
