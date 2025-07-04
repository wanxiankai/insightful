"use client";

import { useState, useRef } from "react";
import { Button } from "@repo/ui/button";

interface UploadState {
  file: File | null;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error: string | null;
  jobId: string | null;
  uploadUrl: string | null;
}

export default function UploadForm() {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    status: 'idle',
    progress: 0,
    error: null,
    jobId: null,
    uploadUrl: null,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadState(prev => ({
        ...prev,
        file,
        status: 'idle', // 重置状态
        error: null,
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { file } = uploadState;
    if (!file) {
      setUploadState(prev => ({
        ...prev,
        error: '请先选择文件',
      }));
      return;
    }
    
    // 更新状态为上传中
    setUploadState(prev => ({
      ...prev,
      status: 'uploading',
      progress: 0,
      error: null,
    }));
    
    try {
      // 1. 获取预签名URL
      console.log('正在请求预签名URL...');
      const presignedResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
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
      
      setUploadState(prev => ({ ...prev, progress: 10 }));
      console.log('获取到预签名URL, 准备上传...');
      
      // 2. 使用XMLHttpRequest上传文件以便跟踪进度
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 监听进度事件
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // 计算上传进度百分比 (10-90%)
            const progressPercent = 10 + Math.round((event.loaded / event.total) * 80);
            setUploadState(prev => ({ ...prev, progress: progressPercent }));
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
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
      
      console.log('文件上传到R2成功, 通知后端...');
      setUploadState(prev => ({ ...prev, progress: 90 }));
      
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
      
      // 更新状态为成功
      setUploadState({
        file: null,
        status: 'success',
        progress: 100,
        error: null,
        jobId: result.jobId,
        uploadUrl: null,
      });
      
      // 重置文件输入框
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('上传流程完成:', result);
      
      // TODO: 在未来实现，这里可以触发后续处理任务，如转换或分析文件
      
    } catch (error: unknown) {
      console.error('上传过程中发生错误:', error);
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : '上传失败',
      }));
    }
  };
  
  // 重置表单
  const handleReset = () => {
    setUploadState({
      file: null,
      status: 'idle',
      progress: 0,
      error: null,
      jobId: null,
      uploadUrl: null,
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h2 className="text-xl font-semibold mb-4">上传会议文件</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            选择会议录音/视频文件
          </label>
          <input
            ref={fileInputRef}
            type="file"
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
            accept="audio/*,video/*"
            onChange={handleFileChange}
            disabled={uploadState.status === 'uploading'}
          />
          {uploadState.file && (
            <p className="text-sm text-gray-600">
              已选择: <span className="font-medium">{uploadState.file.name}</span>
              <span className="text-xs ml-2">({Math.round(uploadState.file.size / 1024 / 1024 * 10) / 10} MB)</span>
            </p>
          )}
        </div>
        
        {uploadState.status === 'uploading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>上传中...</span>
              <span>{uploadState.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>
        )}
        
        {uploadState.error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md border border-red-200">
            <span className="font-bold">错误:</span> {uploadState.error}
          </div>
        )}
        
        {uploadState.status === 'success' && (
          <div className="text-green-500 text-sm p-2 bg-green-50 rounded-md border border-green-200">
            <span className="font-bold">✅ 上传成功!</span> 会议文件已上传，正在等待处理...
            <div className="text-gray-600 text-xs mt-1">
              任务ID: {uploadState.jobId}
            </div>
          </div>
        )}
        
        <div className="flex space-x-4 pt-2">
          <Button
            disabled={!uploadState.file || uploadState.status === 'uploading'}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              uploadState.status === 'uploading'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {uploadState.status === 'uploading' ? '上传中...' : '上传并处理'}
          </Button>
          
          {(uploadState.file || uploadState.status === 'success' || uploadState.status === 'error') && (
            <Button
              onClick={handleReset}
              disabled={uploadState.status === 'uploading'}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-medium transition-colors"
            >
              重置
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}