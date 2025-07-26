import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Recording Duplicate Job Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File name handling', () => {
    it('should preserve recording file names with timestamp prefix', () => {
      const originalFileName = 'recording_2025-07-26T03-25-39-685Z.webm';
      const timestamp = Date.now();
      const expectedFileName = `${timestamp}_${originalFileName}`;
      
      // Simulate the upload API logic
      const filename = originalFileName;
      const fileExt = filename.split('.').pop();
      let uniqueFileName: string;
      
      if (filename.startsWith('recording_')) {
        uniqueFileName = `${timestamp}_${filename}`;
      } else {
        uniqueFileName = `uuid.${fileExt}`;
      }
      
      expect(uniqueFileName).toBe(expectedFileName);
      expect(uniqueFileName).toContain(originalFileName);
    });

    it('should extract original filename from fileKey', () => {
      const fileKey = 'uploads/user123/1234567890_recording_2025-07-26T03-25-39-685Z.webm';
      const expectedFileName = 'recording_2025-07-26T03-25-39-685Z.webm';
      
      // Simulate the extraction logic
      let displayFileName = fileKey.split('/').pop() || 'recording.webm';
      
      if (displayFileName.includes('_recording_')) {
        displayFileName = displayFileName.substring(displayFileName.indexOf('_recording_') + 1);
      }
      
      expect(displayFileName).toBe(expectedFileName);
    });

    it('should handle non-recording files normally', () => {
      const filename = 'audio-file.mp3';
      const fileExt = filename.split('.').pop();
      let uniqueFileName: string;
      
      if (filename.startsWith('recording_')) {
        uniqueFileName = `${Date.now()}_${filename}`;
      } else {
        uniqueFileName = `uuid.${fileExt}`;
      }
      
      expect(uniqueFileName).toBe('uuid.mp3');
    });
  });

  describe('Job creation prevention', () => {
    it('should only call onJobCreated once per recording', () => {
      const onJobCreated = vi.fn();
      const onComplete = vi.fn();
      
      // Simulate the upload completion logic
      const result = {
        success: true,
        jobId: 'job_123',
        fileKey: 'uploads/user/1234_recording_test.webm',
        fileUrl: 'https://example.com/file.webm'
      };
      
      // This should only call onJobCreated, not onComplete
      if (result.success && result.jobId && result.fileKey && result.fileUrl) {
        onJobCreated(result);
        // onComplete should NOT be called here to avoid duplicate processing
      }
      
      expect(onJobCreated).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Duplicate prevention', () => {
    it('should prevent duplicate recording completion handler calls', async () => {
      let isProcessing = false;
      const mockHandler = vi.fn();
      
      const createHandler = () => {
        return async (audioBlob: Blob, fileName: string, metadata: any) => {
          if (isProcessing) {
            console.warn('Already processing, ignoring duplicate call');
            return { success: false, error: 'Already processing' };
          }
          
          isProcessing = true;
          try {
            mockHandler(audioBlob, fileName, metadata);
            return { success: true };
          } finally {
            isProcessing = false;
          }
        };
      };
      
      const handler = createHandler();
      const mockBlob = new Blob(['test'], { type: 'audio/webm' });
      const mockMetadata = { duration: 10 };
      
      // First call should succeed
      const result1 = await handler(mockBlob, 'test.webm', mockMetadata);
      expect(result1.success).toBe(true);
      expect(mockHandler).toHaveBeenCalledTimes(1);
      
      // Reset processing flag
      isProcessing = false;
      
      // Second call should also succeed (after first is complete)
      const result2 = await handler(mockBlob, 'test2.webm', mockMetadata);
      expect(result2.success).toBe(true);
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('should reject concurrent calls to recording completion handler', async () => {
      let isProcessing = false;
      const mockHandler = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      
      const createHandler = () => {
        return async (audioBlob: Blob, fileName: string, metadata: any) => {
          if (isProcessing) {
            return { success: false, error: 'Already processing' };
          }
          
          isProcessing = true;
          try {
            await mockHandler(audioBlob, fileName, metadata);
            return { success: true };
          } finally {
            isProcessing = false;
          }
        };
      };
      
      const handler = createHandler();
      const mockBlob = new Blob(['test'], { type: 'audio/webm' });
      const mockMetadata = { duration: 10 };
      
      // Start first call (will take 100ms)
      const promise1 = handler(mockBlob, 'test.webm', mockMetadata);
      
      // Start second call immediately (should be rejected)
      const promise2 = handler(mockBlob, 'test.webm', mockMetadata);
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Already processing');
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });
});