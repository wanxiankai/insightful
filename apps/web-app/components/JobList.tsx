// apps/web-app/src/components/JobList.tsx

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { BrainCircuit, CheckCircle, Clock, Loader, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// 定义 MeetingJob 的类型，与 Prisma schema 对应
type MeetingJob = {
  id: string;
  createdAt: string;
  fileName: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
};

// 使用 .env 中的变量初始化 Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const statusInfo = {
  PENDING: { icon: Clock, text: "排队中", color: "text-gray-500", bgColor: "bg-gray-100" },
  PROCESSING: { icon: Loader, text: "AI 分析中", color: "text-blue-500", bgColor: "bg-blue-100", animate: "animate-spin" },
  COMPLETED: { icon: CheckCircle, text: "已完成", color: "text-green-500", bgColor: "bg-green-100" },
  FAILED: { icon: XCircle, text: "失败", color: "text-red-500", bgColor: "bg-red-100" },
};

export default function JobList({ initialJobs }: { initialJobs: MeetingJob[] }) {
  const [jobs, setJobs] = useState<MeetingJob[]>(initialJobs);

  useEffect(() => {
    // 实时监听 MeetingJob 表的变化
    const channel = supabase
      .channel("meeting_jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "MeetingJob" },
        (payload) => {
          // 当一个新任务被创建时
          if (payload.eventType === 'INSERT') {
            const newJob = payload.new as MeetingJob;
            // 将新任务添加到列表的顶部
            setJobs((currentJobs) => [newJob, ...currentJobs]);
          }

          // 当一个现有任务被更新时
          if (payload.eventType === 'UPDATE') {
            const updatedJob = payload.new as MeetingJob;
            setJobs((currentJobs) =>
              currentJobs.map((job) =>
                job.id === updatedJob.id ? updatedJob : job
              )
            );
          }
        }
      )
      .subscribe();

    // 组件卸载时，取消订阅
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="mt-12 w-full max-w-2xl">
        {jobs.length !== 0 && <h3 className="text-lg font-semibold text-gray-800">会议分析任务</h3>}
        <div className="mt-4 space-y-4">
            {jobs.map((job) => {
                const { icon: Icon, text, color, bgColor, animate } = statusInfo[job.status];
                return (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{job.fileName || 'Untitled Meeting'}</span>
                            <span className="text-sm text-gray-500">
                                {new Date(job.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-2 rounded-full px-3 py-1 text-sm font-medium ${bgColor} ${color}`}>
                                <Icon className={`h-4 w-4 ${animate}`} />
                                <span>{text}</span>
                            </div>
                            {job.status === 'COMPLETED' && (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/job/${job.id}`}>查看报告</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
}
