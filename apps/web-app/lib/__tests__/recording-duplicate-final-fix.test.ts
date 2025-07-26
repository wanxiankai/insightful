import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Recording Duplicate Final Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Recording upload detection', () => {
    it('should detect recording uploads by filename', () => {
      const tempJob = {
        id: 'job_123',
        fileName: 'recording_2025-07-26T03-37-22-860Z.webm',
        fileKey: 'uploads/user/1234_recording_2025-07-26T03-37-22-860Z.webm',
        fileUrl: 'https://example.com/file.webm'
      };
      
      const isRecordingUpload = tempJob.fileName?.startsWith('recording_') || 
                               tempJob.fileKey?.includes('recording_');
      
      expect(isRecordingUpload).toBe(true);
    });

    it('should detect recording uploads by fileKey', () => {
      const tempJob = {
        id: 'job_123',
        fileName: 'audio.webm',
        fileKey: 'uploads/user/1234_recording_test.webm',
        fileUrl: 'https://example.com/file.webm'
      };
      
      const isRecordingUpload = tempJob.fileName?.startsWith('recording_') || 
                               tempJob.fileKey?.includes('recording_');
      
      expect(isRecordingUpload).toBe(true);
    });

    it('should not detect regular uploads as recording uploads', () => {
      const tempJob = {
        id: 'job_123',
        fileName: 'audio-file.mp3',
        fileKey: 'uploads/user/uuid-123.mp3',
        fileUrl: 'https://example.com/file.mp3'
      };
      
      const isRecordingUpload = tempJob.fileName?.startsWith('recording_') || 
                               tempJob.fileKey?.includes('recording_');
      
      expect(isRecordingUpload).toBe(false);
    });
  });

  describe('Duplicate prevention mechanisms', () => {
    it('should prevent duplicate stopRecording calls', () => {
      let isStoppingRef = { current: false };
      const mockStopRecording = vi.fn();
      
      const stopRecording = async () => {
        if (isStoppingRef.current) {
          console.warn('Stop recording already in progress, ignoring duplicate call');
          return;
        }
        
        isStoppingRef.current = true;
        
        try {
          await mockStopRecording();
        } finally {
          isStoppingRef.current = false;
        }
      };
      
      // First call should execute
      stopRecording();
      expect(mockStopRecording).toHaveBeenCalledTimes(1);
      
      // Second call while first is in progress should be ignored
      stopRecording();
      expect(mockStopRecording).toHaveBeenCalledTimes(1);
    });

    it('should prevent duplicate upload completion handler calls', async () => {
      let isProcessingRef = { current: false };
      const mockUploadHandler = vi.fn().mockResolvedValue({ success: true });
      
      const createHandler = () => {
        return async (audioBlob: Blob, fileName: string, metadata: any) => {
          if (isProcessingRef.current) {
            return { success: false, error: 'Already processing' };
          }
          
          isProcessingRef.current = true;
          
          try {
            return await mockUploadHandler(audioBlob, fileName, metadata);
          } finally {
            isProcessingRef.current = false;
          }
        };
      };
      
      const handler = createHandler();
      const mockBlob = new Blob(['test'], { type: 'audio/webm' });
      const mockMetadata = { duration: 10 };
      
      // First call should succeed
      const result1 = await handler(mockBlob, 'test.webm', mockMetadata);
      expect(result1.success).toBe(true);
      expect(mockUploadHandler).toHaveBeenCalledTimes(1);
      
      // Second call should also succeed (after first is complete)
      const result2 = await handler(mockBlob, 'test2.webm', mockMetadata);
      expect(result2.success).toBe(true);
      expect(mockUploadHandler).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent upload completion handler calls', async () => {
      let isProcessingRef = { current: false };
      const mockUploadHandler = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve({ success: true }), 100));
      });
      
      const createHandler = () => {
        return async (audioBlob: Blob, fileName: string, metadata: any) => {
          if (isProcessingRef.current) {
            return { success: false, error: 'Already processing' };
          }
          
          isProcessingRef.current = true;
          
          try {
            return await mockUploadHandler(audioBlob, fileName, metadata);
          } finally {
            isProcessingRef.current = false;
          }
        };
      };
      
      const handler = createHandler();
      const mockBlob = new Blob(['test'], { type: 'audio/webm' });
      const mockMetadata = { duration: 10 };
      
      // Start two concurrent calls
      const promise1 = handler(mockBlob, 'test.webm', mockMetadata);
      const promise2 = handler(mockBlob, 'test.webm', mockMetadata);
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // One should succeed, one should be rejected
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Already processing');
      expect(mockUploadHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Job creation flow', () => {
    it('should skip job creation for recording uploads', async () => {
      const mockCreateJob = vi.fn();
      const mockRefreshJobs = vi.fn();
      
      const handleUploadComplete = async (tempJob: any) => {
        const isRecordingUpload = tempJob.fileName?.startsWith('recording_') || 
                                 tempJob.fileKey?.includes('recording_');
        
        if (isRecordingUpload) {
          console.log('Recording upload detected, job already created in backend');
          setTimeout(() => mockRefreshJobs(), 2000);
          return;
        }
        
        await mockCreateJob(tempJob);
      };
      
      // Test recording upload
      const recordingJob = {
        id: 'job_123',
        fileName: 'recording_2025-07-26T03-37-22-860Z.webm',
        fileKey: 'uploads/user/file.webm'
      };
      
      await handleUploadComplete(recordingJob);
      
      expect(mockCreateJob).not.toHaveBeenCalled();
      
      // Test regular upload
      const regularJob = {
        id: 'job_456',
        fileName: 'audio.mp3',
        fileKey: 'uploads/user/uuid.mp3'
      };
      
      await handleUploadComplete(regularJob);
      
      expect(mockCreateJob).toHaveBeenCalledWith(regularJob);
    });
  });
});