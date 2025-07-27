"use client";

import { useRef, useCallback, useEffect } from "react";
import JobList, { JobListRef } from "./JobList";
import UploadZone from "./UploadZone";
import { MeetingJob } from "./JobItem";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClientWrapperProps {
  initialJobs: MeetingJob[];
}

export default function ClientWrapper({ initialJobs }: ClientWrapperProps) {
  const jobListRef = useRef<JobListRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { locale, t } = useLanguage();

  // Handle scroll position preservation when jobs are added/removed
  const preserveScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // If user is near the top (within 100px), maintain position
      if (scrollTop < 100) {
        return;
      }
      
      // If user is near the bottom, scroll to new bottom after content changes
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight - clientHeight;
        });
      }
    }
  }, []);

  // Enhanced scroll event handling for better performance
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Add scroll position logic here if needed
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add passive event listener for better performance
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 处理上传完成的回调
  const handleUploadComplete = async (tempJob: MeetingJob) => {
    // 立即添加乐观更新
    jobListRef.current?.addOptimisticJob(tempJob);
    
    // Preserve scroll position when new job is added
    preserveScrollPosition();

    console.log('Upload completed, job added to list:', tempJob.id);

    // 检查是否是录制上传（录制上传的 job 已经在后端创建了）
    const isRecordingUpload = tempJob.fileName?.startsWith('recording_') ||
      tempJob.fileKey?.includes('recording_');

    if (isRecordingUpload) {
      console.log('Recording upload detected, job already created in backend');
      // 录制上传的 job 已经在后端创建，只需要刷新列表
      setTimeout(() => {
        jobListRef.current?.refreshJobs();
      }, 2000); // 给后端一些时间处理
      return;
    }

    // 自动重试函数 - 只用于常规文件上传
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

  return (
    <div className="flex flex-col h-full w-full max-w-2xl">
      <div className="flex-shrink-0">
        <UploadZone onUploadComplete={handleUploadComplete} />
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto mt-3 sm:mt-4 md:mt-6 min-h-0 scroll-smooth"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch', // Better touch scrolling on iOS
        }}
      >
        <JobList ref={jobListRef} initialJobs={initialJobs} />
      </div>
    </div>
  );
}