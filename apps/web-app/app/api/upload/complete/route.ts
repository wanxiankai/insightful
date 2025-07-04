// apps/web-app/app/api/upload/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@repo/database';
import { getPublicUrl } from '@/app/lib/r2-client';

export async function POST(request: NextRequest) {
  try {
    // 验证用户是否已登录
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 解析请求体
    const { fileKey, fileName } = await request.json();
    
    if (!fileKey) {
      return NextResponse.json(
        { error: '缺少文件标识' },
        { status: 400 }
      );
    }
    
    // 构建完整的文件URL
    const fileUrl = getPublicUrl(fileKey);
    
    // 创建一个新的会议任务记录
    const job = await prisma.meetingJob.create({
      data: {
        fileName: fileName || fileKey.split('/').pop(),
        fileUrl: fileUrl,
        userId: session.user.id,
        status: 'PENDING',
      },
    });
    
    // 这里可以添加任务入队逻辑
    // 例如：将任务ID发送到消息队列，或者触发后台处理
    // await queueMeetingJobForProcessing(job.id);
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
    });
    
  } catch (error) {
    console.error('处理上传完成通知失败:', error);
    return NextResponse.json(
      { error: '处理上传完成通知失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
