// apps/web-app/app/components/DirectFileUploader.tsx
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

export function DirectFileUploader() {
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
      progress: 0,
      error: null,
      success: false,
      fileName: file.name,
      jobId: null,
    });

    try {
      console.log('开始上传文件:', file.name, file.type);
      
      // 创建 FormData 对象
      const formData = new FormData();
      formData.append('file', file);
      
      // 直接通过后端上传
      const uploadResponse = await fetch('/api/upload/direct', {
        method: 'POST',
        body: formData,
      });
      
      setUploadState((prev) => ({ ...prev, progress: 50 }));
      
      const responseText = await uploadResponse.text();
      
      if (!uploadResponse.ok) {
        console.error('上传失败:', uploadResponse.status, responseText);
        throw new Error(`上传失败: ${uploadResponse.status}`);
      }
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (error) {
        console.error('解析上传响应失败:', responseText);
        throw new Error('解析上传响应失败');
      }
      
      console.log('上传成功:', responseData);
      
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true,
        fileName: file.name,
        jobId: responseData.jobId,
      });
    } catch (error: unknown) {
      console.error('上传过程中发生错误:', error);
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : '上传失败',
      }));
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold">上传会议文件</h2>
      
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
            window.location.href = `/jobs/${uploadState.jobId}`;
          }}
        >
          查看任务状态
        </Button>
      )}
    </div>
  );
}
