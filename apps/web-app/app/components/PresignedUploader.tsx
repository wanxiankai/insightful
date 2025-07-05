// apps/web-app/app/components/PresignedUploader.tsx
'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  fileName: string | null;
  jobId: string | null;
}

export function PresignedUploader() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
    fileName: null,
    jobId: null,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState({
      isUploading: true,
      progress: 10,
      error: null,
      success: false,
      fileName: file.name,
      jobId: null,
    });

    try {
      console.log('开始处理文件上传:', file.name, file.type);
      
      // 1. 请求预签名URL
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });
      
      setUploadState(prev => ({ ...prev, progress: 30 }));
      
      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        throw new Error(`获取上传链接失败: ${presignedResponse.status} - ${errorText}`);
      }
      
      const { presignedUrl, fileKey } = await presignedResponse.json();
      
      if (!presignedUrl) {
        throw new Error('服务器未返回有效的上传链接');
      }
      
      console.log('获取到预签名URL:', { presignedUrl, fileKey });
      
      // 2. 使用预签名URL上传文件到R2
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });
      
      setUploadState(prev => ({ ...prev, progress: 70 }));
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`文件上传失败: ${uploadResponse.status} - ${errorText}`);
      }
      
      console.log('文件上传到R2成功, 通知后端...');
      
      // 3. 通知后端上传完成，创建任务记录
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          fileName: file.name,
        }),
      });
      
      if (!completeResponse.ok) {
        const errorText = await completeResponse.text();
        throw new Error(`通知上传完成失败: ${completeResponse.status} - ${errorText}`);
      }
      
      const result = await completeResponse.json();
      
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true,
        fileName: file.name,
        jobId: result.jobId,
      });
      
      console.log('上传流程完成:', result);
    } catch (error: unknown) {
      console.error('上传过程中发生错误:', error);
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : '上传失败',
      }));
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold">上传会议文件 (预签名URL方式)</h2>
      
      <div className="flex flex-col gap-2">
        <label className="block">
          <span className="sr-only">选择文件</span>
          <input
            type="file"
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
            accept="audio/*,video/*"
            onChange={handleFileChange}
            disabled={uploadState.isUploading}
          />
        </label>
        
        {uploadState.isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        )}
        
        {uploadState.error && (
          <div className="text-red-500 text-sm mt-2">
            错误: {uploadState.error}
          </div>
        )}
        
        {uploadState.success && (
          <div className="text-green-500 text-sm mt-2">
            文件 {uploadState.fileName} 上传成功！任务ID: {uploadState.jobId}
          </div>
        )}
      </div>
      
      {uploadState.success && (
        <Button
          onClick={() => {
            window.location.href = `/dashboard`;
          }}
        >
          查看任务状态
        </Button>
      )}
    </div>
  );
}
