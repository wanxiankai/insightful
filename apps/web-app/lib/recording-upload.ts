/**
 * Recording Upload Service
 * Handles the upload of recorded audio files to the existing upload system
 */

import { AudioFileMetadata } from '@/types/recording';
import { generateUniqueId } from './api-utils';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  jobId?: string;
  fileKey?: string;
  fileUrl?: string;
  error?: string;
}

export interface RecordingUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

/**
 * Upload recorded audio blob to the existing upload system
 */
export async function uploadRecordedAudio(
  audioBlob: Blob,
  fileName: string,
  metadata: AudioFileMetadata,
  options: RecordingUploadOptions = {}
): Promise<UploadResult> {
  const { onProgress, onError, signal } = options;

  try {
    // Validate input
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Invalid audio blob provided');
    }

    if (!fileName) {
      throw new Error('File name is required');
    }

    console.log('Starting upload process:', {
      fileName,
      fileSize: audioBlob.size,
      mimeType: metadata.mimeType,
      duration: metadata.duration
    });

    // Step 1: Get presigned URL from the correct endpoint
    onProgress?.({ loaded: 0, total: 100, percentage: 5 });
    
    const presignedResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: fileName,
        contentType: metadata.mimeType || 'audio/webm',
      }),
      signal,
    });

    if (!presignedResponse.ok) {
      const errorData = await presignedResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get upload URL: ${presignedResponse.status} - ${errorData.error || 'Unknown error'}`);
    }

    const uploadData = await presignedResponse.json();
    const { url: presignedUrl, fileKey, fileUrl } = uploadData;

    if (!presignedUrl) {
      throw new Error('Server did not return a valid upload URL');
    }

    console.log('Got presigned URL:', { fileKey, fileUrl });
    onProgress?.({ loaded: 10, total: 100, percentage: 10 });

    // Step 2: Upload file to R2 storage with progress tracking
    await uploadWithProgress(audioBlob, presignedUrl, metadata.mimeType || 'audio/webm', {
      onProgress: (uploadProgress) => {
        // Map upload progress to overall progress (10% to 90%)
        const overallProgress = 10 + (uploadProgress.percentage * 0.8);
        onProgress?.({
          loaded: uploadProgress.loaded,
          total: uploadProgress.total,
          percentage: Math.round(overallProgress)
        });
      },
      signal,
    });

    console.log('File uploaded successfully to R2');
    onProgress?.({ loaded: 90, total: 100, percentage: 90 });

    // Step 3: Generate temporary ID for optimistic updates
    const tempId = generateUniqueId('job');

    // Step 4: Complete upload and create job
    const completeResponse = await fetch('/api/upload/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileKey,
        fileName,
        fileUrl,
        tempId,
      }),
      signal,
    });

    let jobId = tempId;

    if (!completeResponse.ok) {
      const errorData = await completeResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Upload complete API failed:', errorData);
      
      // Don't throw error here as file upload succeeded
      // The job creation failure is not critical for user experience
      console.warn('File uploaded successfully but job creation may have failed');
    } else {
      const completeData = await completeResponse.json();
      jobId = completeData.jobId || tempId;
      console.log('Job created successfully:', jobId);
    }

    onProgress?.({ loaded: 100, total: 100, percentage: 100 });

    console.log('Upload process completed successfully:', {
      jobId,
      fileKey,
      fileUrl
    });

    return {
      success: true,
      jobId,
      fileKey,
      fileUrl,
    };

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    
    console.error('Upload failed:', errorMessage, error);
    
    // Provide more specific error messages
    let userFriendlyError = errorMessage;
    if (error.name === 'AbortError') {
      userFriendlyError = 'Upload was cancelled';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      userFriendlyError = 'Network error occurred, please check your connection';
    } else if (errorMessage.includes('Failed to get upload URL')) {
      userFriendlyError = 'Server connection failed, please try again later';
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      userFriendlyError = 'Authentication failed, please sign in again';
    }

    onError?.(userFriendlyError);

    return {
      success: false,
      error: userFriendlyError,
    };
  }
}

/**
 * Upload blob with progress tracking using XMLHttpRequest
 */
async function uploadWithProgress(
  blob: Blob,
  presignedUrl: string,
  contentType: string,
  options: {
    onProgress?: (progress: UploadProgress) => void;
    signal?: AbortSignal;
  } = {}
): Promise<void> {
  const { onProgress, signal } = options;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload aborted'));
      });
    }

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percentage,
        });
      }
    };

    // Handle successful completion
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`));
      }
    };

    // Handle network errors
    xhr.onerror = () => {
      reject(new Error('Network error occurred during upload'));
    };

    // Handle upload abortion
    xhr.onabort = () => {
      reject(new Error('Upload was aborted'));
    };

    // Handle timeout
    xhr.ontimeout = () => {
      reject(new Error('Upload timed out'));
    };

    // Configure and start upload
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.timeout = 5 * 60 * 1000; // 5 minute timeout
    xhr.send(blob);
  });
}

/**
 * Create a temporary job object for optimistic UI updates
 */
export function createTempJob(
  tempId: string,
  fileName: string,
  fileKey: string,
  fileUrl: string
) {
  return {
    id: tempId,
    fileName,
    status: 'PENDING' as const,
    createdAt: new Date().toISOString(),
    fileKey,
    fileUrl,
  };
}

/**
 * Retry upload with exponential backoff
 */
export async function uploadWithRetry(
  audioBlob: Blob,
  fileName: string,
  metadata: AudioFileMetadata,
  options: RecordingUploadOptions & { maxRetries?: number } = {}
): Promise<UploadResult> {
  const { maxRetries = 3, ...uploadOptions } = options;
  
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadRecordedAudio(audioBlob, fileName, metadata, uploadOptions);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      
      // Don't retry on certain errors
      if (lastError.includes('cancelled') || lastError.includes('aborted')) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error: any) {
      lastError = error.message || 'Upload failed';
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return {
    success: false,
    error: `Upload failed after ${maxRetries} attempts: ${lastError}`,
  };
}