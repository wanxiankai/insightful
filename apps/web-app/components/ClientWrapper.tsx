"use client";

import { useRef } from "react";
import JobList, { JobListRef } from "./JobList";
import UploadZone from "./UploadZone";
import { MeetingJob } from "./JobItem";

interface ClientWrapperProps {
  initialJobs: MeetingJob[];
}

export default function ClientWrapper({ initialJobs }: ClientWrapperProps) {
  const jobListRef = useRef<JobListRef>(null);

  // 处理上传完成的回调
  const handleUploadComplete = async (tempJob: MeetingJob) => {
    console.log('🎯 handleUploadComplete called with tempJob:', tempJob);
    
    // 立即添加乐观更新
    jobListRef.current?.addOptimisticJob(tempJob);
    console.log('✅ Optimistic job added to list');
    
    // 自动重试函数
    const createJobWithRetry = async (retryCount = 0): Promise<void> => {
      const maxRetries = 3;
      console.log(`📡 Calling backend API (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      
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
          }),
        });
        
        console.log('📡 Backend API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Backend API failed:', response.status, errorText);
          throw new Error(`Backend API failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Job created successfully in backend:', result);
        
        // 安排一个备用检查，只有在乐观更新仍然存在时才刷新
        setTimeout(() => {
          // 检查是否还有乐观更新任务，如果有说明实时更新可能失效
          console.log('🔍 Backup check: checking if realtime updates are working...');
          jobListRef.current?.refreshJobs();
        }, 15000); // 延长到15秒，给Supabase更多时间
        
      } catch (error) {
        console.error(`❌ Attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries) {
          // 延迟后重试
          const delay = Math.pow(2, retryCount) * 1000; // 指数退避：1s, 2s, 4s
          console.log(`⏳ Retrying in ${delay}ms...`);
          setTimeout(() => createJobWithRetry(retryCount + 1), delay);
        } else {
          // 所有重试都失败了
          console.error('❌ All retry attempts failed, removing optimistic job');
          jobListRef.current?.removeOptimisticJob(tempJob.id);
          alert(`创建任务失败: ${error instanceof Error ? error.message : '未知错误'}，请稍后重试`);
        }
      }
    };
    
    // 开始创建任务（带重试）
    createJobWithRetry();
  };

  return (
    <>
      <UploadZone onUploadComplete={handleUploadComplete} />
      <div className="w-full max-w-2xl">
        <JobList ref={jobListRef} initialJobs={initialJobs} />
      </div>
    </>
  );
}