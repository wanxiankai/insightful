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
    // 如果文件 URL 存在，解析文件路径
    if (job.fileUrl) {
      try {
        // 从文件URL中提取文件键
        // 针对R2的URL格式：https://pub-xxx.r2.dev/uploads/xxx/filename.m4a
        // 我们需要提取 uploads/xxx/filename.m4a 作为文件键
        const fileUrl = new URL(job.fileUrl);
        // 获取路径名但去掉开头的斜杠
        const fileKey = fileUrl.pathname.substring(1);
        console.log(`Deleting file from R2: ${fileKey}`);
        
        // 直接在 API 路由中删除文件
        // 导入 AWS SDK 并直接调用 R2 删除
        const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        
        // 初始化 S3 客户端（用于访问 Cloudflare R2）
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: `${process.env.R2_ENDPOINT}`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
          forcePathStyle: true, // 强制使用路径样式而非虚拟主机样式
        });
        
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: fileKey,
          });
        
          const result = await s3Client.send(deleteCommand);
          console.log('R2 delete result:', result);
        } catch (r2Error) {
          console.error('Error deleting directly from R2:', r2Error);
          // 继续处理，即使文件删除失败
        }
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
