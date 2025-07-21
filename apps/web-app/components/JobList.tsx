"use client";

import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import JobItem, { MeetingJob } from "./JobItem";
import { useLanguage } from "@/contexts/LanguageContext";

// 使用服务角色密钥进行实时订阅（更安全，避免权限问题）
const getSupabaseClient = () => {
  // 在服务端或有服务角色密钥时使用服务角色
  if (typeof window === 'undefined' || process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  // 客户端回退到 anon key
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

const supabase = getSupabaseClient();

// 实时事件的类型定义
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  schema: string;
  table: string;
}

export interface JobListRef {
  addOptimisticJob: (job: MeetingJob) => void;
  removeOptimisticJob: (jobId: string) => void;
  refreshJobs: () => Promise<void>;
}

const JobList = forwardRef<JobListRef, { initialJobs: MeetingJob[] }>(
  ({ initialJobs }, ref) => {
    const [jobs, setJobs] = useState<MeetingJob[]>(initialJobs || []);
    const [optimisticJobs, setOptimisticJobs] = useState<Map<string, MeetingJob>>(new Map());
    const { t } = useLanguage();

    // 将 Supabase 数据转换为 MeetingJob 格式的辅助函数
    const convertSupabaseToMeetingJob = (rawData: Record<string, unknown>): MeetingJob | null => {
      if (!rawData) return null;
      
      // 尝试多种可能的字段名格式
      const id = rawData.id || rawData.ID;
      const createdAt = rawData.createdAt || rawData.created_at || rawData.createddate || rawData.CREATED_AT;
      const fileName = rawData.fileName || rawData.file_name || rawData.filename || rawData.FILE_NAME;
      const status = rawData.status || rawData.STATUS;
      const fileKey = rawData.fileKey || rawData.file_key || rawData.filekey || rawData.FILE_KEY;
      const fileUrl = rawData.fileUrl || rawData.file_url || rawData.fileurl || rawData.FILE_URL;
      
      const converted: MeetingJob = {
        id: String(id || ''),
        createdAt: String(createdAt || new Date().toISOString()),
        fileName: fileName as string || null,
        status: status as MeetingJob['status'],
        fileKey: fileKey as string || undefined,
        fileUrl: fileUrl as string || undefined,
      };
      
      // 验证必要字段
      if (!converted.id || !converted.status) {
        return null;
      }
      
      return converted;
    };

    // 处理插入事件
    const handleInsertEvent = useCallback((rawData: Record<string, unknown>) => {
      const newJob = convertSupabaseToMeetingJob(rawData);
      if (!newJob) return;

      // 移除对应的乐观更新
      setOptimisticJobs(prev => {
        const newMap = new Map(prev);
        newMap.delete(newJob.id);
        return newMap;
      });

      // 添加或更新真实数据
      setJobs(currentJobs => {
        const existingIndex = currentJobs.findIndex(job => job.id === newJob.id);
        if (existingIndex !== -1) {
          const updatedJobs = [...currentJobs];
          updatedJobs[existingIndex] = newJob;
          return updatedJobs;
        }
        return [newJob, ...currentJobs];
      });
    }, []);

    // 处理更新事件
    const handleUpdateEvent = useCallback((rawData: Record<string, unknown>) => {
      const updatedJob = convertSupabaseToMeetingJob(rawData);
      if (!updatedJob) return;

      setJobs(currentJobs => 
        currentJobs.map(job => job.id === updatedJob.id ? updatedJob : job)
      );

      // 同时更新乐观数据（如果存在）
      setOptimisticJobs(prev => {
        if (prev.has(updatedJob.id)) {
          const newMap = new Map(prev);
          newMap.set(updatedJob.id, updatedJob);
          return newMap;
        }
        return prev;
      });
    }, []);

    // 处理删除事件
    const handleDeleteEvent = useCallback((rawData: Record<string, unknown>) => {
      const deletedJob = convertSupabaseToMeetingJob(rawData);
      if (!deletedJob) return;

      setJobs(currentJobs => currentJobs.filter(job => job.id !== deletedJob.id));
      setOptimisticJobs(prev => {
        const newMap = new Map(prev);
        newMap.delete(deletedJob.id);
        return newMap;
      });
    }, []);

    // 合并真实 jobs 和乐观更新的 jobs
    const realJobIds = new Set(jobs.map(job => job.id));
    const allJobs = [
      ...jobs, // 真实任务优先
      ...Array.from(optimisticJobs.values()).filter(job => !realJobIds.has(job.id)) // 只显示不在真实数据中的乐观更新
    ];

    useEffect(() => {
      // 处理实时事件的统一函数
      const handleRealtimeEvent = (payload: RealtimePayload) => {
        const { eventType, new: newData, old: oldData } = payload;
        
        // 验证新数据的完整性
        if ((eventType === 'INSERT' || eventType === 'UPDATE') && 
            (!newData || Object.keys(newData).length === 0)) {
          return;
        }

        switch (eventType) {
          case 'INSERT':
            handleInsertEvent(newData!);
            break;
          case 'UPDATE':
            handleUpdateEvent(newData!);
            break;
          case 'DELETE':
            handleDeleteEvent(oldData!);
            break;
        }
      };

      // 实时监听 MeetingJob 表的变化
      const channel = supabase
        .channel("meeting_jobs")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "MeetingJob"
          },
          handleRealtimeEvent
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [handleInsertEvent, handleUpdateEvent, handleDeleteEvent]);

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
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const freshJobs = await response.json();
          
          // 验证数据格式
          if (Array.isArray(freshJobs)) {
            // 清除所有乐观更新，因为我们现在有了真实数据
            setOptimisticJobs(new Map());
            setJobs(freshJobs);
          }
        }
      } catch {
        // 静默失败，不显示错误
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
      setJobs(currentJobs => currentJobs.filter(job => job.id !== jobId));
    };

    // 处理任务重命名
    const handleRenameJob = (jobId: string, newName: string) => {
      setJobs(currentJobs => 
        currentJobs.map(job => 
          job.id === jobId ? { ...job, fileName: newName } : job
        )
      );
      
      // 同时更新乐观数据（如果存在）
      setOptimisticJobs(prev => {
        if (prev.has(jobId)) {
          const newMap = new Map(prev);
          const existingJob = newMap.get(jobId);
          if (existingJob) {
            newMap.set(jobId, { ...existingJob, fileName: newName });
          }
          return newMap;
        }
        return prev;
      });
    };

    return (
      <div className="mt-6 w-full max-w-2xl">
        {allJobs.length !== 0 && <h3 className="text-base font-semibold text-gray-800">{t.home.historyTitle}</h3>}
        <div className="mt-2 space-y-4 relative">
          {allJobs.map((job) => (
            <JobItem 
              key={job.id} 
              job={job} 
              onDelete={handleDeleteJob}
              onRename={handleRenameJob}
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
