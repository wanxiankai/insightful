// apps/web-app/components/JobList.tsx

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import JobItem, { MeetingJob } from "./JobItem";

// 使用 .env 中的变量初始化 Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

          // 当一个任务被删除时（通过 API 删除）
          if (payload.eventType === 'DELETE') {
            const deletedJob = payload.old as MeetingJob;
            setJobs((currentJobs) =>
              currentJobs.filter((job) => job.id !== deletedJob.id)
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

  // 处理任务删除
  const handleDeleteJob = (jobId: string) => {
    setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId));
  };

  return (
    <div className="mt-12 w-full max-w-2xl">
      {jobs.length !== 0 && <h3 className="text-lg font-semibold text-gray-800">会议分析任务</h3>}
      <div className="mt-4 space-y-4">
        {jobs.map((job) => (
          <JobItem key={job.id} job={job} onDelete={handleDeleteJob} />
        ))}
      </div>
    </div>
  );
}
