// apps/web-app/app/components/UploadZone.tsx

"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, CheckCircle, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  jobId?: string;
}

function UploadProgressItem({ 
  upload 
}: { 
  upload: UploadedFile 
}) {
  const { file, progress, status, error, jobId } = upload;
  
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Background progress bar with color based on status */}
      <div
        className={`absolute top-0 left-0 h-full transition-all duration-300 ease-in-out ${
          status === 'error' 
            ? 'bg-red-100' 
            : status === 'success' 
              ? 'bg-green-100' 
              : 'bg-blue-100'
        }`}
        style={{ width: `${progress}%` }}
      />
      <div className="relative z-10 flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <FileIcon className="h-6 w-6 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800 truncate">
              {file.name}
            </span>
            <span className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
            {status === 'success' && jobId && (
              <span className="text-xs text-green-600 mt-1">
                任务ID: {jobId}
              </span>
            )}
            {status === 'error' && error && (
              <span className="text-xs text-red-600 mt-1">
                错误: {error}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {status === 'uploading' && (
            <span className="text-sm font-semibold text-blue-600">{progress}%</span>
          )}
          {status === 'success' && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadZone() {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);

  // 更新上传进度的辅助函数
  const updateUploadProgress = useCallback((id: string, progress: number) => {
    setUploads(prevUploads => 
      prevUploads.map(u => 
        u.id === id ? { ...u, progress } : u
      )
    );
  }, []);

  // 处理文件上传
  const handleUpload = useCallback(async (upload: UploadedFile) => {
    try {
      // 1. 获取预签名URL
      console.log('正在请求预签名URL...');
      const presignedResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: upload.file.name,
          contentType: upload.file.type,
        }),
      });
      
      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        throw new Error(`获取上传链接失败: ${presignedResponse.status} - ${errorText}`);
      }
      
      const { url: presignedUrl, fileKey } = await presignedResponse.json();
      
      if (!presignedUrl) {
        throw new Error('服务器未返回有效的上传链接');
      }
      
      updateUploadProgress(upload.id, 10);
      console.log('获取到预签名URL, 准备上传...');
      
      // 2. 使用XMLHttpRequest上传文件以便跟踪进度
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 监听进度事件
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // 计算上传进度百分比 (10-90%)
            const progressPercent = 10 + Math.round((event.loaded / event.total) * 80);
            updateUploadProgress(upload.id, progressPercent);
          }
        };
        
        // 监听完成事件
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`文件上传失败: ${xhr.status} - ${xhr.statusText}`));
          }
        };
        
        // 监听错误事件
        xhr.onerror = () => {
          reject(new Error('网络错误，上传失败'));
        };
        
        // 打开连接并发送请求
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', upload.file.type);
        xhr.send(upload.file);
      });
      
      console.log('文件上传到R2成功, 通知后端...');
      updateUploadProgress(upload.id, 90);
      
      // 3. 通知后端上传完成，创建任务记录
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          fileName: upload.file.name,
        }),
      });
      
      if (!completeResponse.ok) {
        const errorText = await completeResponse.text();
        throw new Error(`通知上传完成失败: ${completeResponse.status} - ${errorText}`);
      }
      
      const result = await completeResponse.json();
      
      // 更新状态为成功
      setUploads(prevUploads => 
        prevUploads.map(u => 
          u.id === upload.id 
            ? { ...u, progress: 100, status: 'success', jobId: result.jobId } 
            : u
        )
      );
      
      console.log('上传流程完成:', result);
      
    } catch (error) {
      console.error('上传过程中发生错误:', error);
      setUploads(prevUploads => 
        prevUploads.map(u => 
          u.id === upload.id 
            ? { 
                ...u, 
                progress: 100, 
                status: 'error', 
                error: error instanceof Error ? error.message : '上传失败' 
              } 
            : u
        )
      );
    }
  }, [updateUploadProgress]);

  // 处理文件拖放
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // 只处理第一个文件，暂不支持多文件上传
    // 如果需要支持多文件上传，可以移除此限制
    const file = acceptedFiles[0];
    if (!file) return;
    
    const newUpload: UploadedFile = {
      id: uuidv4(),
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploads((prev) => [...prev, newUpload]);
    handleUpload(newUpload);
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [],
      "video/*": [],
    },
    maxFiles: 1, // 限制单文件上传
  });

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">上传会议文件</h2>
        
        <div
          {...getRootProps()}
          className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors duration-300 ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
            <UploadCloud className="h-8 w-8 text-gray-500" />
          </div>
          <p className="mt-4 text-base font-semibold text-gray-700">
            拖拽文件到此处 或{" "}
            <span className="font-bold text-blue-600">选择文件</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            支持音频和视频格式文件
          </p>
        </div>

        {uploads.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800">
              {uploads.some(u => u.status === 'uploading') ? '正在上传' : '上传历史'}
            </h3>
            {uploads.map((upload) => (
              <UploadProgressItem
                key={upload.id}
                upload={upload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
