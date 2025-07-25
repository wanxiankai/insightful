"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { MeetingJob } from "./JobItem";
import { generateUniqueId } from "@/lib/api-utils";
import { useLanguage } from "@/contexts/LanguageContext";
import AudioRecorder from "./AudioRecorder";
import RecordingInterface from "./RecordingInterface";
import { RecordingStatus, AudioFileMetadata } from "@/types/recording";

interface RecordingUploadZoneProps {
  onUploadComplete?: (tempJob: MeetingJob) => Promise<void>;
}

export default function RecordingUploadZone({ onUploadComplete }: RecordingUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { t, locale } = useLanguage();

  // 使用AudioRecorder hook
  const recorder = AudioRecorder({
    onRecordingComplete: handleRecordingComplete,
    onError: (error) => {
      console.error('Recording error:', error);
      setUploadError(error);
    },
    onStatusChange: (status) => {
      // 清除之前的错误状态
      if (status === RecordingStatus.RECORDING) {
        setUploadError(null);
      }
    }
  });

  // 处理录制完成
  async function handleRecordingComplete(
    audioBlob: Blob, 
    fileName: string, 
    metadata: AudioFileMetadata
  ) {
    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. 获取预签名URL
      const presignedResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileName,
          contentType: metadata.mimeType,
        }),
      });

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        throw new Error(`获取上传链接失败: ${presignedResponse.status} - ${errorText}`);
      }

      const { url: presignedUrl, fileKey, fileUrl } = await presignedResponse.json();

      if (!presignedUrl) {
        throw new Error('服务器未返回有效的上传链接');
      }

      // 2. 上传录音文件
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': metadata.mimeType,
        },
        body: audioBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`上传失败: ${uploadResponse.status} - ${uploadResponse.statusText}`);
      }

      // 3. 创建临时job对象
      const tempId = generateUniqueId('temp');
      const tempJob: MeetingJob = {
        id: tempId,
        fileName: fileName,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        fileKey: fileKey,
        fileUrl: fileUrl,
      };

      // 4. 调用完成回调
      if (onUploadComplete) {
        await onUploadComplete(tempJob);
      }

      // 5. 重置录制状态
      recorder.resetRecording();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败';
      setUploadError(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }

  // 开始录制
  const handleStartRecording = useCallback(async () => {
    setUploadError(null);
    const success = await recorder.startRecording();
    if (!success) {
      setUploadError('无法开始录制，请检查麦克风权限');
    }
  }, [recorder]);

  // 停止录制
  const handleStopRecording = useCallback(async () => {
    await recorder.stopRecording();
  }, [recorder]);

  // 确定当前状态
  const currentStatus = isUploading ? RecordingStatus.PROCESSING : recorder.status;
  const currentError = uploadError || recorder.error;

  return (
    <div className="w-full">
      <RecordingInterface
          status={currentStatus}
          duration={recorder.duration}
          error={currentError}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          disabled={isUploading}
        >
          {/* 录制提示和信息 */}
          {recorder.isRecording && (
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
                    {recorder.formatDuration(recorder.getRemainingTime())}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 权限提示 */}
          {recorder.status === RecordingStatus.REQUESTING_PERMISSION && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                请在浏览器弹窗中允许访问麦克风权限
              </p>
            </div>
          )}

          {/* 上传进度 */}
          {isUploading && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                正在上传录音文件，请稍候...
              </p>
            </div>
          )}
        </RecordingInterface>
    </div>
  );
}