/**
 * Recording Upload Hook
 * Manages the integration between audio recording and upload system
 */

import { useState, useCallback, useRef } from 'react';
import { uploadRecordedAudio, uploadWithRetry, UploadProgress, UploadResult } from '@/lib/recording-upload';
import { AudioFileMetadata } from '@/types/recording';

export interface RecordingUploadState {
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  uploadError: string | null;
  uploadResult: UploadResult | null;
}

export interface UseRecordingUploadOptions {
  maxRetries?: number;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
}

export function useRecordingUpload(options: UseRecordingUploadOptions = {}) {
  const {
    maxRetries = 3,
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError
  } = options;

  const [uploadState, setUploadState] = useState<RecordingUploadState>({
    isUploading: false,
    uploadProgress: null,
    uploadError: null,
    uploadResult: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef<boolean>(false); // 在 hook 级别防止重复调用

  // Reset upload state
  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      uploadProgress: null,
      uploadError: null,
      uploadResult: null
    });
  }, []);

  // Cancel ongoing upload
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setUploadState(prev => ({
      ...prev,
      isUploading: false,
      uploadError: 'Upload cancelled by user'
    }));
  }, []);

  // Upload recorded audio with progress tracking
  const uploadRecording = useCallback(async (
    audioBlob: Blob,
    fileName: string,
    metadata: AudioFileMetadata
  ): Promise<UploadResult> => {
    // Reset previous state
    resetUploadState();
    
    // Create abort controller for this upload
    abortControllerRef.current = new AbortController();
    
    // Set initial uploading state
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      uploadError: null
    }));

    onUploadStart?.();

    try {
      const result = await uploadWithRetry(audioBlob, fileName, metadata, {
        maxRetries,
        signal: abortControllerRef.current.signal,
        onProgress: (progress) => {
          setUploadState(prev => ({
            ...prev,
            uploadProgress: progress
          }));
          onUploadProgress?.(progress);
        },
        onError: (error) => {
          setUploadState(prev => ({
            ...prev,
            uploadError: error
          }));
          onUploadError?.(error);
        }
      });

      // Update final state
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadResult: result,
        uploadError: result.success ? null : result.error || 'Upload failed'
      }));

      // Clean up abort controller
      abortControllerRef.current = null;

      // Notify completion
      onUploadComplete?.(result);

      return result;

    } catch (error: any) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Upload cancelled' 
        : error.message || 'Upload failed';

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadError: errorMessage
      }));

      onUploadError?.(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }, [maxRetries, resetUploadState, onUploadStart, onUploadProgress, onUploadComplete, onUploadError]);

  // Create recording completion handler that automatically uploads
  const createRecordingCompletionHandler = useCallback(() => {
    return async (audioBlob: Blob, fileName: string, metadata: AudioFileMetadata) => {
      // 在 hook 级别防止重复调用
      if (isProcessingRef.current) {
        console.warn('Recording completion handler already processing, ignoring duplicate call');
        return { success: false, error: 'Already processing' };
      }
      
      isProcessingRef.current = true;
      
      try {
        console.log('Recording completed, starting upload:', {
          fileName,
          fileSize: audioBlob.size,
          duration: metadata.duration
        });

        const result = await uploadRecording(audioBlob, fileName, metadata);
        
        if (result.success) {
          console.log('Recording uploaded successfully:', result);
        } else {
          console.error('Recording upload failed:', result.error);
        }

        return result;
      } finally {
        isProcessingRef.current = false;
      }
    };
  }, [uploadRecording]);

  return {
    // State
    uploadState,
    isUploading: uploadState.isUploading,
    uploadProgress: uploadState.uploadProgress,
    uploadError: uploadState.uploadError,
    uploadResult: uploadState.uploadResult,
    
    // Actions
    uploadRecording,
    cancelUpload,
    resetUploadState,
    createRecordingCompletionHandler,
    
    // Utilities
    getUploadProgressPercentage: () => uploadState.uploadProgress?.percentage || 0,
    hasUploadError: () => !!uploadState.uploadError,
    isUploadComplete: () => !!uploadState.uploadResult?.success,
  };
}