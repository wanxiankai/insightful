// apps/web-app/src/app/job/[jobId]/page.tsx

import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { FileText, ListTodo, User, Calendar } from "lucide-react";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import Link from "next/link";

// 定义行动项的类型，以便在组件中安全使用
interface ActionItem {
  task: string;
  assignee: string;
  dueDate: string;
}

// 类型守卫函数，用于验证对象是否符合 ActionItem 结构
function isActionItem(item: unknown): item is ActionItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as Record<string, unknown>).task === 'string' &&
    typeof (item as Record<string, unknown>).assignee === 'string' &&
    typeof (item as Record<string, unknown>).dueDate === 'string'
  );
}

// 安全地将 Prisma Json 转换为 ActionItem 数组
function parseActionItems(jsonData: unknown): ActionItem[] {
  if (!Array.isArray(jsonData)) {
    return [];
  }
  
  return jsonData.filter(isActionItem);
}

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

export default async function JobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const job = await getJobDetails(params.jobId, userId);

  // 如果任务不存在，或仍在处理中，显示提示信息
  if (!job || !job.analysisResult) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showBackButton={true} />
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">任务未找到或仍在处理中</h1>
            <p className="mt-2 text-gray-500">
              请稍后再试，或返回仪表盘查看最新状态。
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-md bg-[#61d0de] px-4 py-2 text-sm font-medium text-white hover:bg-[#4fb3c1] transition-colors"
            >
              返回首页
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { analysisResult } = job;
  // 使用类型安全的解析函数，而不是直接类型断言
  const actionItems: ActionItem[] = parseActionItems(analysisResult.actionItems);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header showBackButton={true} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="container mx-auto max-w-4xl">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 break-words">
              {job.fileName}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              分析完成于 {new Date(job.updatedAt).toLocaleString()}
            </p>
          </div>

          {/* 会议摘要 */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="flex items-center text-2xl font-semibold text-gray-800">
              <FileText className="mr-3 h-6 w-6 text-[#61d0de]" />
              会议摘要
            </h2>
            <div className="prose prose-blue mt-4 max-w-none text-gray-600">
              <p>{analysisResult.summary || "未能生成摘要。"}</p>
            </div>
          </div>

          {/* 行动项 */}
          <div className="mt-8">
            <h2 className="flex items-center text-2xl font-semibold text-gray-800">
              <ListTodo className="mr-3 h-6 w-6 text-[#4fb3c1]" />
              行动项
            </h2>
            <div className="mt-4 space-y-4">
              {actionItems.length > 0 ? (
                actionItems.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <p className="font-medium text-gray-900">{item.task}</p>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <User className="mr-1.5 h-4 w-4" />
                        <strong>负责人:</strong>&nbsp;{item.assignee}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="mr-1.5 h-4 w-4" />
                        <strong>截止日期:</strong>&nbsp;{item.dueDate}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center text-gray-500">
                  <p>本次会议未识别出明确的行动项。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
