// apps/web-app/app/page.tsx'

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Header from '@/components/Header';
import { prisma } from '@repo/database';
import ClientWrapper from '@/components/ClientWrapper';

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
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      <Header />
      <main className="flex flex-1 flex-col items-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
        <ClientWrapper initialJobs={initialJobs} />
      </main>
    </div>
  );
}