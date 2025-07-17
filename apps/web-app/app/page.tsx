// apps/web-app/app/page.tsx'

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Header from '@/components/Header';
import { PrismaClient } from '@repo/database';
import ClientWrapper from '@/components/ClientWrapper';

const prisma = new PrismaClient();

async function getInitialJobs(userId: string) {
  const jobs = await prisma.meetingJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  // Prisma 日期对象无法直接传递给客户端组件，需要序列化
  // 同时将 null 值转换为 undefined 以匹配组件类型
  return jobs.map(job => ({
    id: job.id,
    createdAt: job.createdAt.toISOString(),
    fileName: job.fileName,
    status: job.status,
    fileKey: job.fileKey ?? undefined,
    fileUrl: job.fileUrl ?? undefined,
  }));
}

export default async function Page() {
  const session = await auth();

  // 如果用户未登录，重定向到登录页面
  if (!session?.user) {
    redirect('/signin');
  }

   const initialJobs = await getInitialJobs(session.user.id);


  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <ClientWrapper initialJobs={initialJobs} />
      </main>
    </div>
  );
}