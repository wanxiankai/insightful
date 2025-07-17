// apps/web-app/app/api/job/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

// 删除一个任务及其相关资源
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 获取用户身份
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const jobId = params.id;
    
    // 2. 查询任务信息，以获取文件路径和验证所有权
    const job = await prisma.meetingJob.findUnique({
      where: { id: jobId },
      include: { analysisResult: true }
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // 3. 验证所有权 - 只有任务创建者才能删除
    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // 4. 从 R2 存储桶中删除源文件
    // 使用数据库中存储的 fileKey，而不是从 URL 解析
    if (job.fileKey) {
      try {
        // 导入 R2 客户端函数
        const { getR2Client, getBucketName } = await import('@/lib/r2-client');
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        
        // 使用共享的 R2 客户端
        const s3Client = await getR2Client();
        const bucketName = getBucketName();
        
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: job.fileKey, // 直接使用数据库中的 fileKey
        });
      
        const result = await s3Client.send(deleteCommand);
      } catch (error) {
        console.error('Failed to delete file from R2:', error);
        // 继续处理，即使文件删除失败
      }
    }
    
    // 5. 使用事务删除数据库记录，确保原子性
    // Prisma 会自动处理外键关系，当删除 MeetingJob 时，相关的 AnalysisResult 会被级联删除
    await prisma.meetingJob.delete({
      where: { id: jobId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
