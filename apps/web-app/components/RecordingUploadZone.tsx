"use client";

import { useCallback } from "react";
import { MeetingJob } from "./JobItem";
import { useLanguage } from "@/contexts/LanguageContext";
import RecordingInterface from "./RecordingInterface";
import { useRecordingLifecycle } from "@/hooks/useRecordingLifecycle";

interface RecordingUploadZoneProps {
  onUploadComplete?: (tempJob: MeetingJob) => Promise<void>;
}

export default function RecordingUploadZone({ onUploadComplete }: RecordingUploadZoneProps) {
  const { t, locale } = useLanguage();
  
  // Use the recording lifecycle hook for complete integration
  const {
    state,
    isActive,
    hasError,
    isComplete,
    currentError,
    progress,
    isRecording,
    recordingDuration,
    recordingStatus,
    canRecord,
    canStop,
    isUploading,
    uploadProgress,
    createdJob,
    startRecording,
    stopRecording,
    cancel,
    reset,
    formatDuration,
    getRemainingTime
  } = useRecordingLifecycle({
    onJobCreated: async (job) => {
      console.log('Recording job created:', job.id);
      if (onUploadComplete) {
        await onUploadComplete(job);
      }
    },
    onComplete: (job) => {
      console.log('Recording lifecycle completed:', job.id);
    },
    onError: (error) => {
      console.error('Recording lifecycle error:', error);
    }
  });

  // 开始录制
  const handleStartRecording = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  // 停止录制
  const handleStopRecording = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  // 取消操作
  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 格式化上传速度
  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  }, [formatFileSize]);

  // Get current progress details
  const progressDetails = progress ? {
    loaded: Math.round((progress.percentage / 100) * 1000000), // Mock values for display
    total: 1000000,
    speed: 0
  } : null;

  return (
    <div className="w-full">
      <RecordingInterface
          status={recordingStatus}
          duration={recordingDuration}
          error={currentError}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          disabled={isActive && !canStop}
        >
          {/* 录制提示和信息 */}
          {isRecording && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    正在录制
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    请保持安静，避免背景噪音
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    剩余时间
                  </p>
                  <p className="text-sm font-mono font-bold text-red-800 dark:text-red-200">
                    {formatDuration(getRemainingTime())}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 权限提示 */}
          {recordingStatus === 'requesting_permission' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                请在浏览器弹窗中允许访问麦克风权限
              </p>
            </div>
          )}

          {/* 进度显示 */}
          {progress && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {progress.phase === 'recording' ? '正在录制' : 
                   progress.phase === 'uploading' ? '正在上传录音文件' : 
                   '正在处理录音文件'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    {Math.round(progress.percentage)}%
                  </span>
                  {progress.phase !== 'recording' && (
                    <button
                      onClick={handleCancel}
                      className="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-300 dark:hover:bg-yellow-600 transition-colors"
                    >
                      取消
                    </button>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-yellow-200 dark:bg-yellow-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${Math.round(progress.percentage)}%` }}
                />
              </div>
              
              {/* 详细信息 */}
              {progressDetails && progress.phase === 'uploading' && (
                <div className="flex justify-between text-xs text-yellow-600 dark:text-yellow-400">
                  <span>
                    {formatFileSize(progressDetails.loaded)} / {formatFileSize(progressDetails.total)}
                  </span>
                  {progressDetails.speed && progressDetails.speed > 0 && (
                    <span>
                      {formatSpeed(progressDetails.speed)}
                    </span>
                  )}
                </div>
              )}
              
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {progress.phase === 'recording' ? '点击停止按钮结束录制' : '请保持网络连接，不要关闭页面'}
              </p>
            </div>
          )}

          {/* 完成状态 */}
          {isComplete && createdJob && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    录制完成
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    任务已创建，正在进行AI分析
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-xs px-3 py-1 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded hover:bg-green-300 dark:hover:bg-green-600 transition-colors"
                >
                  新建录制
                </button>
              </div>
            </div>
          )}
        </RecordingInterface>
    </div>
  );
}