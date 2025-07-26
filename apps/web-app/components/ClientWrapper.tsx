"use client";

import { useRef } from "react";
import JobList, { JobListRef } from "./JobList";
import UploadZone from "./UploadZone";
import RecordingUploadZone from "./RecordingUploadZone";
import { MeetingJob } from "./JobItem";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClientWrapperProps {
  initialJobs: MeetingJob[];
}

export default function ClientWrapper({ initialJobs }: ClientWrapperProps) {
  const jobListRef = useRef<JobListRef>(null);
  const { locale, t } = useLanguage();

  // 处理上传完成的回调
  const handleUploadComplete = async (tempJob: MeetingJob) => {
    // 立即添加乐观更新
    jobListRef.current?.addOptimisticJob(tempJob);
    
    // 自动重试函数
    const createJobWithRetry = async (retryCount = 0): Promise<void> => {
      const maxRetries = 3;
      
      try {
        const response = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileKey: tempJob.fileKey,
            fileName: tempJob.fileName,
            fileUrl: tempJob.fileUrl,
            tempId: tempJob.id,
            locale: locale, // 添加语言信息
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend API failed: ${response.status} - ${errorText}`);
        }
        
        await response.json();
        
        // 安排一个备用检查，只有在乐观更新仍然存在时才刷新
        setTimeout(() => {
          jobListRef.current?.refreshJobs();
        }, 15000); // 延长到15秒，给Supabase更多时间
        
      } catch (error) {
        if (retryCount < maxRetries) {
          // 延迟后重试
          const delay = Math.pow(2, retryCount) * 1000; // 指数退避：1s, 2s, 4s
          setTimeout(() => createJobWithRetry(retryCount + 1), delay);
        } else {
          // 所有重试都失败了
          jobListRef.current?.removeOptimisticJob(tempJob.id);
          alert(`${t.errors.createJobFailed}: ${error instanceof Error ? error.message : t.errors.tryAgainLater}`);
        }
      }
    };
    
    // 开始创建任务（带重试）
    createJobWithRetry();
  };

  // Handle recording upload completion
  const handleRecordingUploadComplete = async (tempJob: MeetingJob) => {
    // Add optimistic update immediately
    jobListRef.current?.addOptimisticJob(tempJob);
    
    console.log('Recording upload completed, job added to list:', tempJob.id);
  };

  return (
    <>
      <UploadZone onUploadComplete={handleUploadComplete} />
      <RecordingUploadZone onUploadComplete={handleRecordingUploadComplete} />
      <div className="w-full max-w-2xl">
        <JobList ref={jobListRef} initialJobs={initialJobs} />
      </div>
    </>
  );
}