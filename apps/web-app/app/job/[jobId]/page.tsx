// apps/web-app/src/app/job/[jobId]/page.tsx

import { redirect } from "next/navigation";
import Header from "@/components/Header";
import JobDetailClient from "@/components/JobDetailClient";
import { prisma } from "@repo/database";
import { auth } from "@/auth";



// 服务器端函数，用于获取任务详情
async function getJobDetails(jobId: string, userId: string) {
  const job = await prisma.meetingJob.findUnique({
    where: {
      id: jobId,
      userId: userId, // 安全检查：确保用户只能访问自己的任务
    },
    include: {
      analysisResult: true, // 同时加载关联的分析结果
    },
  });
  return job;
}

export default async function JobDetailPage(
  props: {
    params: Promise<{ jobId: string }>;
  }
) {
  const params = await props.params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const job = await getJobDetails(params.jobId, userId);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header showBackButton={true} />
      <JobDetailClient job={job} />
    </div>
  );
}
