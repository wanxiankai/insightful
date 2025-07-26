import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AudioRecorder from '../AudioRecorder';
import { useRecordingLifecycle } from '@/hooks/useRecordingLifecycle';
import { useRecordingUpload } from '@/hooks/useRecordingUpload';
import { RecordingStatus, PermissionStatus } from '@/types/recording';

// Mock the upload functionality
vi.mock('@/hooks/useRecordingUpload', () => ({
  useRecordingUpload: vi.fn().mockReturnValue({
    uploadState: { status: 'idle' },
    isUploading: false,
    uploadProgress: 0,
    uploadError: null,
    createRecordingCompletionHandler: vi.fn().mockReturnValue(
      vi.fn().mockResolvedValue(undefined)
    )
  })
}));

// Mock the job creation
vi.mock('@/lib/recording-upload', () => ({
  createTempJob: vi.fn().mockReturnValue({
    id: 'test-job-id',
    title: 'Test Recording',
    status: 'pending',
    createdAt: new Date().toISOString()
  })
}));

describe('AudioRecorder - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Complete Recording to Upload Flow', () => {
    it('should complete full recording and upload workflow', async () => {
      const mockUploadHandler = vi.fn().mockResolvedValue(undefined);
      const mockCreateHandler = vi.fn().mockReturnValue(mockUploadHandler);
      
      vi.mocked(useRecordingUpload).mockReturnValue({
        uploadState: { status: 'idle' },
        isUploading: false,
        uploadProgress: 0,
        uploadError: null,
        createRecordingCompletionHandler: mockCreateHandler
      });

      const onRecordingComplete = mockUploadHandler;
      const { result } = renderHook(() => AudioRecorder({ onRecordingComplete }));
      
      // Start recording
      await act(async () => {
        const started = await result.current.startRecording();
        expect(started).toBe(true);
      });

      expect(result.current.status).toBe(RecordingStatus.RECORDING);
      expect(result.current.hasPermission).toBe(PermissionStatus.GRANTED);

      // Record for some time
      act(() => {
        vi.advanceTimersByTime(5000); // 5 seconds
      });

      expect(result.current.duration).toBe(5);

      // Stop recording
      await act(async () => {
        await result.current.stopRecording();
      });

      // Should have called the upload handler
      expect(onRecordingComplete).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(String),
        expect.objectContaining({
          fileName: expect.any(String),
          mimeType: expect.any(String),
          size: expect.any(Number),
          duration: 5
        })
      );
    });

    it('should handle recording lifecycle with useRecordingLifecycle hook', async () => {
      const onJobCreated = vi.fn();
      const onComplete = vi.fn();
      
      const { result } = renderHook(() => 
        useRecordingLifecycle({ 
          onJobCreated,
          onComplete,
          maxDuration: 30
        })
      );

      // Start recording
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);
      expect(result.current.isActive).toBe(true);

      // Record for some time
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.recordingDuration).toBe(3);

      // Stop recording
      await act(async () => {
        await result.current.stopRecording();
      });

      // Should complete the workflow
      expect(result.current.isRecording).toBe(false);
    });

    it('should handle upload progress during integration', async () => {
      let uploadProgressCallback: ((progress: any) => void) | undefined;
      
      vi.mocked(useRecordingUpload).mockReturnValue({
        uploadState: { status: 'uploading' },
        isUploading: true,
        uploadProgress: 50,
        uploadError: null,
        createRecordingCompletionHandler: vi.fn().mockReturnValue(
          vi.fn().mockImplementation(async (blob, fileName, metadata) => {
            // Simulate upload progress
            if (uploadProgressCallback) {
              uploadProgressCallback({ percentage: 25 });
              uploadProgressCallback({ percentage: 50 });
              uploadProgressCallback({ percentage: 100 });
            }
          })
        )
      });

      const { result } = renderHook(() => 
        useRecordingLifecycle({
          onComplete: vi.fn()
        })
      );

      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      // Should show upload progress
      expect(result.current.isUploading).toBe(true);
      expect(result.current.uploadProgress).toBe(50);
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    it('should handle recording errors and provide recovery options', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onError }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate an error during recording
      act(() => {
        if (result.current.session?.mediaRecorder?.onerror) {
          result.current.session.mediaRecorder.onerror({ 
            error: new Error('Recording interrupted') 
          } as any);
        }
      });

      expect(result.current.status).toBe(RecordingStatus.ERROR);
      expect(onError).toHaveBeenCalled();

      // Should provide recovery suggestions
      const suggestions = result.current.getRecoverySuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle upload errors in integration flow', async () => {
      const mockUploadHandler = vi.fn().mockRejectedValue(new Error('Upload failed'));
      
      vi.mocked(useRecordingUpload).mockReturnValue({
        uploadState: { status: 'error' },
        isUploading: false,
        uploadProgress: 0,
        uploadError: 'Upload failed',
        createRecordingCompletionHandler: vi.fn().mockReturnValue(mockUploadHandler)
      });

      const onError = vi.fn();
      const { result } = renderHook(() => 
        useRecordingLifecycle({ onError })
      );

      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      // Should handle upload error
      expect(result.current.hasError).toBe(true);
      expect(onError).toHaveBeenCalledWith('Upload failed');
    });

    it('should recover from network interruption', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate network going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Should continue recording offline
      expect(result.current.status).toBe(RecordingStatus.RECORDING);
      expect(result.current.isOnline).toBe(false);

      // Network comes back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('System Integration Tests', () => {
    it('should integrate with browser MediaRecorder API', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      // Should check browser compatibility
      const compatibility = result.current.getBrowserCompatibility();
      expect(compatibility).toBeDefined();

      // Should get supported MIME types
      const mimeTypes = result.current.getSupportedMimeTypes();
      expect(Array.isArray(mimeTypes)).toBe(true);

      // Should start recording with proper MediaRecorder setup
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.status).toBe(RecordingStatus.RECORDING);
      expect(result.current.session?.mediaRecorder).toBeDefined();
    });

    it('should integrate with device permissions system', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      // Should request permission
      await act(async () => {
        const hasPermission = await result.current.requestPermission();
        expect(typeof hasPermission).toBe('boolean');
      });

      expect(result.current.hasPermission).toBe(PermissionStatus.GRANTED);
    });

    it('should integrate with local storage for recovery', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      // Should check for recoverable data
      const hasRecoverable = result.current.hasRecoverableData();
      expect(typeof hasRecoverable).toBe('boolean');

      // Should be able to clear recovery data
      expect(() => result.current.clearRecoveryData()).not.toThrow();
    });

    it('should handle device changes during recording', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate device change event
      act(() => {
        const deviceChangeEvent = new Event('devicechange');
        if (navigator.mediaDevices.dispatchEvent) {
          navigator.mediaDevices.dispatchEvent(deviceChangeEvent);
        }
      });

      // Should handle device changes gracefully
      expect(result.current.status).toBe(RecordingStatus.RECORDING);
    });

    it('should integrate with memory management', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      // Record for extended time to test memory handling
      act(() => {
        vi.advanceTimersByTime(10000); // 10 seconds
      });

      // Should handle memory efficiently
      expect(result.current.status).toBe(RecordingStatus.RECORDING);
      expect(result.current.duration).toBe(10);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    it('should complete full workflow from start to job creation', async () => {
      const mockJob = {
        id: 'test-job-123',
        title: 'Test Recording',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const mockCreateTempJob = vi.fn().mockReturnValue(mockJob);
      vi.doMock('@/lib/recording-upload', () => ({
        createTempJob: mockCreateTempJob
      }));

      const onJobCreated = vi.fn();
      const onComplete = vi.fn();

      const { result } = renderHook(() => 
        useRecordingLifecycle({ 
          onJobCreated,
          onComplete
        })
      );

      // Complete workflow
      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      // Should complete the full workflow
      expect(result.current.isComplete).toBe(true);
    });

    it('should handle concurrent recording attempts', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      // Start first recording
      await act(async () => {
        await result.current.startRecording();
      });

      const firstStatus = result.current.status;

      // Try to start another recording
      await act(async () => {
        await result.current.startRecording();
      });

      // Should not allow concurrent recordings
      expect(result.current.status).toBe(firstStatus);
    });

    it('should handle rapid start/stop cycles', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      // Rapid start/stop
      await act(async () => {
        await result.current.startRecording();
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      await act(async () => {
        await result.current.startRecording();
      });

      // Should handle rapid cycles gracefully
      expect(result.current.status).toBe(RecordingStatus.RECORDING);
    });

    it('should maintain state consistency throughout workflow', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      // Initial state
      expect(result.current.isValidState()).toBe(true);

      // During recording
      await act(async () => {
        await result.current.startRecording();
      });
      expect(result.current.isValidState()).toBe(true);

      // During timing
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.isValidState()).toBe(true);

      // After stopping
      await act(async () => {
        await result.current.stopRecording();
      });
      expect(result.current.isValidState()).toBe(true);
    });
  });
});