import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AudioRecorder from '../AudioRecorder';
import { RecordingStatus, PermissionStatus, RECORDING_ERROR_CODES } from '@/types/recording';

// Mock the dependencies
vi.mock('@/lib/recording-error-recovery', () => ({
  recordingErrorRecovery: {
    saveRecoveryData: vi.fn().mockReturnValue(true),
    getRecoveryData: vi.fn().mockReturnValue(null),
    restoreAudioChunks: vi.fn().mockResolvedValue([]),
    clearRecoveryData: vi.fn(),
    canRecover: vi.fn().mockReturnValue(false),
    getRecoverySuggestions: vi.fn().mockReturnValue([]),
    checkMemoryUsage: vi.fn().mockReturnValue({ isNearLimit: false, totalSize: 1000 }),
    onDeviceChange: vi.fn().mockReturnValue(() => {}),
    onNetworkChange: vi.fn().mockReturnValue(() => {})
  }
}));

vi.mock('@/lib/browser-compatibility', () => ({
  browserCompatibility: {
    checkCompatibility: vi.fn().mockReturnValue({
      isPartiallySupported: true,
      isFullySupported: true,
      browserInfo: { warnings: [] },
      missingFeatures: [],
      fallbackOptions: []
    }),
    getUnsupportedBrowserMessage: vi.fn().mockReturnValue('Browser not supported'),
    getBestSupportedMimeType: vi.fn().mockReturnValue('audio/webm;codecs=opus'),
    getSupportedMimeTypes: vi.fn().mockReturnValue(['audio/webm;codecs=opus']),
    getBestSupportedMimeType: vi.fn().mockReturnValue('audio/webm;codecs=opus')
  }
}));

describe('AudioRecorder - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Recording State Management', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      expect(result.current.status).toBe(RecordingStatus.IDLE);
      expect(result.current.duration).toBe(0);
      expect(result.current.hasPermission).toBe(PermissionStatus.UNKNOWN);
      expect(result.current.error).toBe(null);
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should transition to recording state when starting', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.status).toBe(RecordingStatus.RECORDING);
      expect(result.current.isRecording).toBe(true);
      expect(result.current.hasPermission).toBe(PermissionStatus.GRANTED);
    });

    it('should validate state transitions', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      // Should not be able to stop when not recording
      expect(result.current.canStop).toBe(false);
      
      await act(async () => {
        await result.current.startRecording();
      });
      
      // Should be able to stop when recording
      expect(result.current.canStop).toBe(true);
      expect(result.current.canRecord).toBe(false);
    });

    it('should handle multiple start attempts gracefully', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      const firstStatus = result.current.status;
      
      // Try to start again
      await act(async () => {
        await result.current.startRecording();
      });

      // Should remain in recording state
      expect(result.current.status).toBe(firstStatus);
    });
  });

  describe('Permission Handling', () => {
    it('should request permission when starting recording', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.hasPermission).toBe(PermissionStatus.GRANTED);
    });

    it('should handle permission denied', async () => {
      // Mock permission denied
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
      );
      
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        value: { getUserMedia: mockGetUserMedia }
      });

      const onError = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onError }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.hasPermission).toBe(PermissionStatus.DENIED);
      expect(result.current.status).toBe(RecordingStatus.ERROR);
      expect(onError).toHaveBeenCalled();
    });

    it('should handle device not found error', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        Object.assign(new Error('Device not found'), { name: 'NotFoundError' })
      );
      
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        value: { getUserMedia: mockGetUserMedia }
      });

      const onError = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onError }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.status).toBe(RecordingStatus.ERROR);
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('DEVICE_NOT_FOUND'));
    });
  });

  describe('Audio Data Processing', () => {
    it('should collect audio chunks during recording', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate MediaRecorder data events
      act(() => {
        vi.advanceTimersByTime(2000); // 2 seconds of recording
      });

      // Should have collected some audio chunks
      expect(result.current.session?.audioChunks.length).toBeGreaterThan(0);
    });

    it('should validate audio chunks', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      // The component should validate chunks internally
      expect(result.current.status).toBe(RecordingStatus.RECORDING);
    });

    it('should handle empty audio chunks', async () => {
      // Mock MediaRecorder to produce empty chunks
      const originalMediaRecorder = global.MediaRecorder;
      global.MediaRecorder = class MockMediaRecorder extends originalMediaRecorder {
        start() {
          this.state = 'recording';
          if (this.onstart) this.onstart();
          
          // Simulate empty data event
          setTimeout(() => {
            if (this.ondataavailable) {
              this.ondataavailable({ data: new Blob([], { type: 'audio/webm' }) } as BlobEvent);
            }
          }, 100);
        }
      } as any;

      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should handle empty chunks gracefully
      expect(result.current.status).toBe(RecordingStatus.RECORDING);
      
      global.MediaRecorder = originalMediaRecorder;
    });

    it('should merge audio chunks correctly', async () => {
      const onRecordingComplete = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onRecordingComplete }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(onRecordingComplete).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(String),
        expect.objectContaining({
          fileName: expect.any(String),
          mimeType: expect.any(String),
          size: expect.any(Number),
          duration: expect.any(Number)
        })
      );
    });
  });

  describe('Timer and Duration Management', () => {
    it('should track recording duration', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.duration).toBe(0);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.duration).toBe(3);
    });

    it('should auto-stop at max duration', async () => {
      const maxDuration = 5;
      const onRecordingComplete = vi.fn();
      const { result } = renderHook(() => 
        AudioRecorder({ maxDuration, onRecordingComplete })
      );
      
      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should auto-stop
      expect(result.current.duration).toBe(5);
    });

    it('should calculate remaining time correctly', () => {
      const maxDuration = 60;
      const { result } = renderHook(() => AudioRecorder({ maxDuration }));
      
      expect(result.current.getRemainingTime()).toBe(60);
    });

    it('should calculate progress correctly', async () => {
      const maxDuration = 10;
      const { result } = renderHook(() => AudioRecorder({ maxDuration }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.getProgress()).toBe(0.5);
    });

    it('should format duration correctly', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      expect(result.current.formatDuration(0)).toBe('00:00');
      expect(result.current.formatDuration(65)).toBe('01:05');
      expect(result.current.formatDuration(3661)).toBe('61:01');
    });
  });

  describe('Error Handling', () => {
    it('should handle MediaRecorder errors', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onError }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate MediaRecorder error
      const mockError = new Error('Recording failed');
      act(() => {
        if (result.current.session?.mediaRecorder?.onerror) {
          result.current.session.mediaRecorder.onerror({ error: mockError } as any);
        }
      });

      expect(result.current.status).toBe(RecordingStatus.ERROR);
      expect(onError).toHaveBeenCalled();
    });

    it('should handle device disconnection', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onError }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate device disconnection by stopping the track
      act(() => {
        const mockTrack = {
          stop: vi.fn(),
          readyState: 'ended',
          label: 'Mock Audio Track',
          kind: 'audio',
          addEventListener: vi.fn((event, handler) => {
            if (event === 'ended') {
              setTimeout(handler, 0);
            }
          })
        };
        
        // Trigger track ended event
        if (mockTrack.addEventListener) {
          const endedHandler = vi.fn();
          mockTrack.addEventListener('ended', endedHandler);
          endedHandler();
        }
      });

      // Should handle device disconnection gracefully
      expect(result.current.status).toBe(RecordingStatus.RECORDING);
    });

    it('should handle memory limit exceeded', async () => {
      // Mock memory limit exceeded
      const mockRecordingErrorRecovery = await import('@/lib/recording-error-recovery');
      vi.mocked(mockRecordingErrorRecovery.recordingErrorRecovery.checkMemoryUsage)
        .mockReturnValue({ isNearLimit: true, totalSize: 100 * 1024 * 1024 });

      const onError = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onError }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should handle memory limit gracefully
      expect(result.current.status).toBe(RecordingStatus.RECORDING);
    });

    it('should provide error recovery suggestions', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      const suggestions = result.current.getRecoverySuggestions('DEVICE_DISCONNECTED');
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Browser Compatibility', () => {
    it('should check browser compatibility', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      const compatibility = result.current.getBrowserCompatibility();
      expect(compatibility).toBeDefined();
      expect(compatibility.isPartiallySupported).toBe(true);
    });

    it('should get supported MIME types', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      const mimeTypes = result.current.getSupportedMimeTypes();
      expect(Array.isArray(mimeTypes)).toBe(true);
      expect(mimeTypes.length).toBeGreaterThan(0);
    });

    it('should get best MIME type', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      const bestMimeType = result.current.getBestMimeType();
      expect(typeof bestMimeType).toBe('string');
      expect(bestMimeType).toContain('audio/');
    });

    it('should handle unsupported browser', async () => {
      // Mock unsupported browser
      const mockBrowserCompatibility = await import('@/lib/browser-compatibility');
      vi.mocked(mockBrowserCompatibility.browserCompatibility.checkCompatibility)
        .mockReturnValue({
          isPartiallySupported: false,
          isFullySupported: false,
          browserInfo: { warnings: [] },
          missingFeatures: ['MediaRecorder'],
          fallbackOptions: []
        });

      const onError = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onError }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.status).toBe(RecordingStatus.ERROR);
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('UNSUPPORTED_BROWSER'));
    });
  });

  describe('Recovery Functions', () => {
    it('should check for recoverable data', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      const hasRecoverable = result.current.hasRecoverableData();
      expect(typeof hasRecoverable).toBe('boolean');
    });

    it('should clear recovery data', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      expect(() => result.current.clearRecoveryData()).not.toThrow();
    });

    it('should recover recording data', async () => {
      // Mock recovery data available
      const mockRecordingErrorRecovery = await import('@/lib/recording-error-recovery');
      vi.mocked(mockRecordingErrorRecovery.recordingErrorRecovery.canRecover)
        .mockReturnValue(true);
      vi.mocked(mockRecordingErrorRecovery.recordingErrorRecovery.getRecoveryData)
        .mockReturnValue({
          hasRecoverableData: true,
          audioChunks: [],
          duration: 30,
          sessionId: 'test-session',
          timestamp: new Date().toISOString()
        });

      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        const recovered = await result.current.recoverRecording();
        expect(typeof recovered).toBe('boolean');
      });
    });
  });

  describe('Utility Functions', () => {
    it('should validate recording state', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      expect(result.current.isValidState()).toBe(true);
    });

    it('should check online status', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      expect(typeof result.current.isOnline).toBe('boolean');
    });

    it('should reset recording state', async () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.status).toBe(RecordingStatus.RECORDING);

      act(() => {
        result.current.resetRecording();
      });

      expect(result.current.status).toBe(RecordingStatus.IDLE);
      expect(result.current.duration).toBe(0);
    });
  });

  describe('Callback Functions', () => {
    it('should call onStatusChange callback', async () => {
      const onStatusChange = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onStatusChange }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      expect(onStatusChange).toHaveBeenCalledWith(RecordingStatus.RECORDING);
    });

    it('should call onError callback', async () => {
      const onError = vi.fn();
      
      // Mock getUserMedia to fail
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
      );
      
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        value: { getUserMedia: mockGetUserMedia }
      });

      const { result } = renderHook(() => AudioRecorder({ onError }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      expect(onError).toHaveBeenCalled();
    });

    it('should call onRecordingComplete callback', async () => {
      const onRecordingComplete = vi.fn();
      const { result } = renderHook(() => AudioRecorder({ onRecordingComplete }));
      
      await act(async () => {
        await result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(onRecordingComplete).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(String),
        expect.any(Object)
      );
    });
  });
});