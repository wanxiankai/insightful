// apps/web-app/app/api/job/[id]/rename/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { validateUser } from '@/lib/auth-utils';
import { handleApiRoute, apiErrors } from '@/lib/api-utils';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return handleApiRoute(async () => {
    // 1. 验证用户身份
    const { user, error } = await validateUser();
    if (error) return error;

    const jobId = params.id;

    // 2. 解析请求体
    let body;
    try {
      body = await request.json();
    } catch {
      return apiErrors.badRequest('Invalid JSON in request body');
    }

    const { fileName } = body;

    // 3. 验证输入
    if (!fileName || typeof fileName !== 'string') {
      return apiErrors.badRequest('fileName is required and must be a string');
    }

    const trimmedFileName = fileName.trim();
    if (!trimmedFileName) {
      return apiErrors.badRequest('fileName cannot be empty');
    }

    if (trimmedFileName.length > 100) {
      return apiErrors.badRequest('fileName cannot exceed 100 characters');
    }

    // 4. 查询任务并验证所有权
    const job = await prisma.meetingJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        userId: true,
        fileName: true,
        status: true,
      },
    });

    if (!job) {
      return apiErrors.notFound('Job');
    }

    // 5. 验证所有权
    if (job.userId !== user.id) {
      return apiErrors.forbidden();
    }

    // 6. 验证任务状态 - 只有COMPLETED状态的任务可以重命名
    if (job.status !== 'COMPLETED') {
      return apiErrors.badRequest('Only completed jobs can be renamed');
    }

    // 7. 检查是否真的需要更新
    if (job.fileName === trimmedFileName) {
      return NextResponse.json({
        success: true,
        message: 'No changes needed',
        job: {
          id: job.id,
          fileName: job.fileName,
        },
      });
    }

    // 8. 更新任务名称
    const updatedJob = await prisma.meetingJob.update({
      where: { id: jobId },
      data: { fileName: trimmedFileName },
      select: {
        id: true,
        fileName: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job renamed successfully',
      job: {
        ...updatedJob,
        createdAt: updatedJob.createdAt.toISOString(),
      },
    });
  });
}