"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { createClient } from "@supabase/supabase-js";
import JobItem, { MeetingJob } from "./JobItem";

// 使用 .env 中的变量初始化 Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface JobListRef {
  addOptimisticJob: (job: MeetingJob) => void;
  removeOptimisticJob: (jobId: string) => void;
  refreshJobs: () => Promise<void>;
}

const JobList = forwardRef<JobListRef, { initialJobs: MeetingJob[] }>(
  ({ initialJobs }, ref) => {
    const [jobs, setJobs] = useState<MeetingJob[]>(initialJobs || []);
    const [optimisticJobs, setOptimisticJobs] = useState<Map<string, MeetingJob>>(new Map());

    // 合并真实 jobs 和乐观更新的 jobs，确保类型安全
    // 优先显示真实数据，只有当真实数据中不存在时才显示乐观更新
    const realJobIds = new Set((Array.isArray(jobs) ? jobs : []).map(job => job.id));
    const allJobs = [
      ...(Array.isArray(jobs) ? jobs : []), // 真实任务优先
      ...Array.from(optimisticJobs.values()).filter(job => !realJobIds.has(job.id)) // 只显示不在真实数据中的乐观更新
    ];

    useEffect(() => {
      console.log('Setting up Supabase realtime subscription...');
      
      // 实时监听 MeetingJob 表的变化
      const channel = supabase
        .channel("meeting_jobs")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "MeetingJob"
            // 注意：不添加 filter，因为 RLS 会自动处理用户权限
          },
          (payload) => {
            console.log('🎯 Supabase realtime event:', payload.eventType, payload);
            
            // 当一个新任务被创建时
            if (payload.eventType === 'INSERT') {
              const newJob = payload.new as MeetingJob;
              console.log('📥 INSERT event for job:', newJob.id, 'status:', newJob.status);
              
              // 如果这个 job 在乐观更新中存在，移除乐观版本，添加真实版本
              setOptimisticJobs(prev => {
                if (prev.has(newJob.id)) {
                  console.log('🔄 Replacing optimistic job with real job:', newJob.id);
                  const newMap = new Map(prev);
                  newMap.delete(newJob.id);
                  return newMap;
                } else {
                  console.log('ℹ️ No optimistic job found for:', newJob.id);
                  return prev;
                }
              });
              
              // 检查是否已经存在（避免重复添加）
              setJobs((currentJobs) => {
                const existingIndex = currentJobs.findIndex(job => job.id === newJob.id);
                if (existingIndex !== -1) {
                  // 替换现有的 job
                  console.log('🔄 Replacing existing job:', newJob.id);
                  const updatedJobs = [...currentJobs];
                  updatedJobs[existingIndex] = newJob;
                  return updatedJobs;
                }
                // 添加新的 job 到顶部
                console.log('➕ Adding new job to list:', newJob.id);
                return [newJob, ...currentJobs];
              });
            }

            // 当一个现有任务被更新时
            if (payload.eventType === 'UPDATE') {
              const updatedJob = payload.new as MeetingJob;
              const oldStatus = payload.old?.status;
              console.log('🔄 UPDATE event for job:', updatedJob.id, 'from', oldStatus, 'to', updatedJob.status);
              
              // 同时更新真实的 jobs 和乐观更新的 jobs
              setJobs((currentJobs) => {
                const updated = currentJobs.map((job) =>
                  job.id === updatedJob.id ? updatedJob : job
                );
                console.log('📝 Updated jobs list for job:', updatedJob.id);
                return updated;
              });
              
              // 如果乐观更新中也有这个 job，也需要更新
              setOptimisticJobs(prev => {
                if (prev.has(updatedJob.id)) {
                  console.log('🔄 Updating optimistic job:', updatedJob.id);
                  const newMap = new Map(prev);
                  newMap.set(updatedJob.id, updatedJob);
                  return newMap;
                }
                return prev;
              });
            }

            // 当一个任务被删除时（通过 API 删除）
            if (payload.eventType === 'DELETE') {
              const deletedJob = payload.old as MeetingJob;
              console.log('🗑️ DELETE event for job:', deletedJob.id);
              
              setJobs((currentJobs) =>
                currentJobs.filter((job) => job.id !== deletedJob.id)
              );
              
              // 同时从乐观更新中移除
              setOptimisticJobs(prev => {
                const newMap = new Map(prev);
                newMap.delete(deletedJob.id);
                return newMap;
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Supabase subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to realtime updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Failed to subscribe to realtime updates');
          } else if (status === 'CLOSED') {
            console.log('🔌 Realtime subscription closed');
          }
        });

      // 组件卸载时，取消订阅
      return () => {
        console.log('🔌 Unsubscribing from Supabase channel');
        supabase.removeChannel(channel);
      };
    }, []);

    // 添加乐观更新的方法
    const addOptimisticJob = (job: MeetingJob) => {
      setOptimisticJobs(prev => new Map(prev).set(job.id, job));
    };

    // 移除乐观更新的方法（用于错误处理）
    const removeOptimisticJob = (jobId: string) => {
      setOptimisticJobs(prev => {
        const newMap = new Map(prev);
        newMap.delete(jobId);
        return newMap;
      });
    };

    // 手动刷新任务列表
    const refreshJobs = async () => {
      try {
        console.log('🔄 Manually refreshing jobs...');
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const freshJobs = await response.json();
          console.log('📦 Received jobs data:', freshJobs);
          
          // 验证数据格式
          if (Array.isArray(freshJobs)) {
            // 清除所有乐观更新，因为我们现在有了真实数据
            setOptimisticJobs(new Map());
            setJobs(freshJobs);
            console.log('✅ Jobs refreshed successfully, cleared optimistic updates');
          } else {
            console.error('❌ Invalid jobs data format:', typeof freshJobs, freshJobs);
          }
        } else {
          console.error('❌ Failed to fetch jobs:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Failed to refresh jobs:', error);
      }
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      addOptimisticJob,
      removeOptimisticJob,
      refreshJobs
    }));

    // 处理任务删除
    const handleDeleteJob = (jobId: string) => {
      setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId));
    };

    return (
      <div className="mt-6 w-full max-w-2xl">
        {allJobs.length !== 0 && <h3 className="text-base font-semibold text-gray-800">历史文件记录</h3>}
        <div className="mt-2 space-y-4">
          {allJobs.map((job) => (
            <JobItem 
              key={job.id} 
              job={job} 
              onDelete={handleDeleteJob}
              isOptimistic={optimisticJobs.has(job.id)}
            />
          ))}
        </div>
      </div>
    );
  }
);

JobList.displayName = 'JobList';

export default JobList;