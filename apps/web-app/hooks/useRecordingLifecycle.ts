/**
 * Recording Lifecycle Hook
 * Manages the complete lifecycle of a recording from creation to completion
 */

import { useState, useCallback, useRef } from 'react';
import { useRecordingUpload } from './useRecordingUpload';
import AudioRecorder from '@/components/AudioRecorder';
import { RecordingStatus, AudioFileMetadata } from '@/types/recording';
import { MeetingJob } from '@/components/JobItem';
import { createTempJob } from '@/lib/recording-upload';

export interface RecordingLifecycleState {
  // Recording state
  isRecording: boolean;
  recordingDuration: number;
  recordingStatus: RecordingStatus;
  recordingError: string | null;
  
  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  
  // Job state
  createdJob: MeetingJob | null;
  
  // Overall state
  isActive: boolean; // true if recording or uploading
  hasError: boolean;
  isComplete: boolean;
}

export interface UseRecordingLifecycleOptions {
  onJobCreated?: (job: MeetingJob) => void;
  onComplete?: (job: MeetingJob) => void;
  onError?: (error: string) => void;
  maxDuration?: number;
}

export function useRecordingLifecycle(options: UseRecordingLifecycleOptions = {}) {
  const {
    onJobCreated,
    onComplete,
    onError,
    maxDuration = 30 * 60 // 30 minutes default
  } = options;

  const [state, setState] = useState<RecordingLifecycleState>({
    isRecording: false,
    recordingDuration: 0,
    recordingStatus: RecordingStatus.IDLE,
    recordingError: null,
    isUploading: false,
    uploadProgress: 0,
    uploadError: null,
    createdJob: null,
    isActive: false,
    hasError: false,
    isComplete: false
  });

  // Use the recording upload hook
  const {
    uploadState,
    isUploading,
    uploadProgress,
    uploadError,
    createRecordingCompletionHandler
  } = useRecordingUpload({
    maxRetries: 3,
    onUploadStart: () => {
      setState(prev => ({
        ...prev,
        isUploading: true,
        uploadProgress: 0,
        uploadError: null,
        isActive: true
      }));
    },
    onUploadProgress: (progress) => {
      setState(prev => ({
        ...prev,
        uploadProgress: progress.percentage
      }));
    },
    onUploadComplete: (result) => {
      if (result.success && result.jobId && result.fileKey && result.fileUrl) {
        // 从 fileKey 中提取文件名，但保持原始录制文件名的格式
        let displayFileName = result.fileKey.split('/').pop() || 'recording.webm';
        
        // 如果文件名包含时间戳前缀（格式：timestamp_recording_...），移除时间戳前缀
        if (displayFileName.includes('_recording_')) {
          displayFileName = displayFileName.substring(displayFileName.indexOf('_recording_') + 1);
        }
        
        const job = createTempJob(
          result.jobId,
          displayFileName,
          result.fileKey,
          result.fileUrl
        );

        setState(prev => ({
          ...prev,
          isUploading: false,
          createdJob: job,
          isActive: false,
          isComplete: true
        }));

        // 只调用 onJobCreated，不调用 onComplete
        // onComplete 应该在 job 真正完成处理后调用
        onJobCreated?.(job);
        // 注释掉这行，避免重复处理
        // onComplete?.(job);
      } else {
        const error = result.error || 'Upload failed';
        setState(prev => ({
          ...prev,
          isUploading: false,
          uploadError: error,
          isActive: false,
          hasError: true
        }));
        onError?.(error);
      }
    },
    onUploadError: (error) => {
      setState(prev => ({
        ...prev,
        uploadError: error,
        hasError: true
      }));
      onError?.(error);
    }
  });

  // Create the audio recorder with integrated lifecycle management
  const recorder = AudioRecorder({
    maxDuration,
    onRecordingComplete: async (audioBlob, fileName, metadata) => {
      await createRecordingCompletionHandler()(audioBlob, fileName, metadata);
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        recordingError: error,
        isActive: false,
        hasError: true
      }));
      onError?.(error);
    },
    onStatusChange: (status) => {
      setState(prev => ({
        ...prev,
        recordingStatus: status,
        isRecording: status === RecordingStatus.RECORDING,
        recordingDuration: recorder.duration,
        isActive: status === RecordingStatus.RECORDING || status === RecordingStatus.PROCESSING || prev.isUploading
      }));
    }
  });

  // Start recording
  const startRecording = useCallback(async () => {
    // Reset previous state
    setState(prev => ({
      ...prev,
      recordingError: null,
      uploadError: null,
      createdJob: null,
      hasError: false,
      isComplete: false
    }));

    const success = await recorder.startRecording();
    if (!success) {
      setState(prev => ({
        ...prev,
        hasError: true,
        recordingError: 'Failed to start recording'
      }));
      onError?.('Failed to start recording');
    }
  }, [recorder, onError]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    await recorder.stopRecording();
  }, [recorder]);

  // Cancel the entire process
  const cancel = useCallback(() => {
    if (state.isRecording) {
      recorder.resetRecording();
    }
    
    // Reset state
    setState({
      isRecording: false,
      recordingDuration: 0,
      recordingStatus: RecordingStatus.IDLE,
      recordingError: null,
      isUploading: false,
      uploadProgress: 0,
      uploadError: null,
      createdJob: null,
      isActive: false,
      hasError: false,
      isComplete: false
    });
  }, [state.isRecording, recorder]);

  // Reset to initial state
  const reset = useCallback(() => {
    recorder.resetRecording();
    setState({
      isRecording: false,
      recordingDuration: 0,
      recordingStatus: RecordingStatus.IDLE,
      recordingError: null,
      isUploading: false,
      uploadProgress: 0,
      uploadError: null,
      createdJob: null,
      isActive: false,
      hasError: false,
      isComplete: false
    });
  }, [recorder]);

  // Get current error message
  const getCurrentError = useCallback(() => {
    return state.recordingError || state.uploadError || null;
  }, [state.recordingError, state.uploadError]);

  // Get progress information
  const getProgress = useCallback(() => {
    if (state.isRecording) {
      return {
        phase: 'recording' as const,
        percentage: recorder.getProgress() * 100,
        message: 'Recording in progress...'
      };
    } else if (state.isUploading) {
      return {
        phase: 'uploading' as const,
        percentage: state.uploadProgress,
        message: 'Uploading recording...'
      };
    } else if (state.recordingStatus === RecordingStatus.PROCESSING) {
      return {
        phase: 'processing' as const,
        percentage: 95,
        message: 'Processing recording...'
      };
    }
    
    return null;
  }, [state.isRecording, state.isUploading, state.recordingStatus, state.uploadProgress, recorder]);

  return {
    // State
    state,
    
    // Computed state
    isActive: state.isActive,
    hasError: state.hasError,
    isComplete: state.isComplete,
    currentError: getCurrentError(),
    progress: getProgress(),
    
    // Recording state
    isRecording: state.isRecording,
    recordingDuration: recorder.duration,
    recordingStatus: state.recordingStatus,
    canRecord: recorder.canRecord,
    canStop: recorder.canStop,
    
    // Upload state
    isUploading: state.isUploading,
    uploadProgress: state.uploadProgress,
    
    // Job state
    createdJob: state.createdJob,
    
    // Actions
    startRecording,
    stopRecording,
    cancel,
    reset,
    
    // Recorder utilities
    formatDuration: recorder.formatDuration,
    getRemainingTime: recorder.getRemainingTime,
    
    // Recorder instance (for advanced usage)
    recorder
  };
}