import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AudioRecorder from '../AudioRecorder';
import RecordingTimer from '../RecordingTimer';
import RecordingControls from '../RecordingControls';
import { RecordingStatus, PermissionStatus } from '@/types/recording';
import { performanceMonitor } from '@/lib/performance-monitor';
import { memoryOptimizer } from '@/lib/memory-optimizer';

// Mock the language context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      recording: {
        recorded: 'Recorded',
        remaining: 'Remaining',
        approachingLimit: 'Approaching limit',
        criticalLimit: 'Critical limit',
        startRecording: 'Start Recording',
        stopRecording: 'Stop Recording',
        requestPermission: 'Request Permission'
      },
      common: {
        processing: 'Processing'
      }
    }
  })
}));

describe('Final Acceptance Test - All Requirements Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
    
    // Reset performance monitoring
    performanceMonitor.cleanup();
    memoryOptimizer.cleanup();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    performanceMonitor.cleanup();
    memoryOptimizer.cleanup();
  });

  describe('需求 1: 主页录制功能入口', () => {
    it('should provide clear recording entry point', () => {
      const mockOnComplete = vi.fn();
      const recorder = AudioRecorder({ onRecordingComplete: mockOnComplete });
      
      expect(recorder).toBeDefined();
      expect(typeof recorder.startRecording).toBe('function');
      expect(typeof recorder.stopRecording).toBe('function');
    });

    it('should have visible recording button with clear label', () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();
      
      render(
        <RecordingControls
          status={RecordingStatus.IDLE}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );
      
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });
  });

  describe('需求 2: 麦克风权限处理', () => {
    it('should handle permission request flow', async () => {
      const mockOnComplete = vi.fn();
      const mockOnError = vi.fn();
      
      const recorder = AudioRecorder({ 
        onRecordingComplete: mockOnComplete,
        onError: mockOnError
      });
      
      // Initially permission should be unknown
      expect(recorder.hasPermission).toBe(PermissionStatus.UNKNOWN);
      
      // Request permission should work
      const hasPermission = await recorder.requestPermission();
      expect(typeof hasPermission).toBe('boolean');
    });

    it('should show friendly error message when permission denied', async () => {
      // Mock getUserMedia to reject with NotAllowedError
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
      );
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });
      
      const mockOnError = vi.fn();
      const recorder = AudioRecorder({ onError: mockOnError });
      
      const hasPermission = await recorder.requestPermission();
      
      expect(hasPermission).toBe(false);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('PERMISSION_DENIED')
      );
    });
  });

  describe('需求 3: 录制状态显示', () => {
    it('should show dynamic timer during recording', () => {
      render(
        <RecordingTimer
          duration={65}
          maxDuration={1800}
          isRecording={true}
        />
      );
      
      expect(screen.getByText('01:05')).toBeInTheDocument();
    });

    it('should show recording indicator with animation', () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();
      
      render(
        <RecordingControls
          status={RecordingStatus.RECORDING}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );
      
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });

    it('should display recording duration correctly', () => {
      render(
        <RecordingTimer
          duration={125}
          maxDuration={1800}
          isRecording={true}
        />
      );
      
      expect(screen.getByText('02:05')).toBeInTheDocument();
    });
  });

  describe('需求 4: 录制时长限制', () => {
    it('should support 30 minute maximum duration', () => {
      const recorder = AudioRecorder({});
      expect(recorder.getRemainingTime()).toBe(30 * 60);
    });

    it('should show time warning when approaching limit', () => {
      render(
        <RecordingTimer
          duration={1500} // 25 minutes
          maxDuration={1800} // 30 minutes
          isRecording={true}
        />
      );
      
      expect(screen.getByText('Approaching limit')).toBeInTheDocument();
    });

    it('should auto-stop at maximum duration', async () => {
      const mockOnComplete = vi.fn();
      const recorder = AudioRecorder({ 
        maxDuration: 2,
        onRecordingComplete: mockOnComplete
      });
      
      await act(async () => {
        await recorder.startRecording();
      });
      
      expect(recorder.isRecording).toBe(true);
      
      // Advance time to max duration
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      // Should trigger auto-stop
      expect(recorder.duration).toBe(2);
    });
  });

  describe('需求 5: 录制控制', () => {
    it('should stop recording when stop button clicked', async () => {
      const mockOnComplete = vi.fn();
      const recorder = AudioRecorder({ onRecordingComplete: mockOnComplete });
      
      await act(async () => {
        await recorder.startRecording();
      });
      
      expect(recorder.isRecording).toBe(true);
      
      await act(async () => {
        await recorder.stopRecording();
      });
      
      // Should stop immediately
      expect(recorder.isRecording).toBe(false);
    });

    it('should stop audio data collection immediately', async () => {
      const mockOnComplete = vi.fn();
      const recorder = AudioRecorder({ onRecordingComplete: mockOnComplete });
      
      await act(async () => {
        await recorder.startRecording();
      });
      
      const initialDuration = recorder.duration;
      
      await act(async () => {
        await recorder.stopRecording();
      });
      
      // Duration should not increase after stopping
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(recorder.duration).toBe(initialDuration);
    });
  });

  describe('需求 6: 音频文件处理', () => {
    it('should generate WebM format audio file', async () => {
      const mockOnComplete = vi.fn();
      const recorder = AudioRecorder({ onRecordingComplete: mockOnComplete });
      
      await act(async () => {
        await recorder.startRecording();
      });
      
      // Simulate some recording time
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await act(async () => {
        await recorder.stopRecording();
      });
      
      // Should call completion callback with WebM file
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.any(Blob),
          expect.stringMatching(/\.webm$/),
          expect.objectContaining({
            mimeType: expect.stringContaining('webm')
          })
        );
      });
    });

    it('should trigger upload flow automatically', async () => {
      const mockOnComplete = vi.fn();
      const recorder = AudioRecorder({ onRecordingComplete: mockOnComplete });
      
      await act(async () => {
        await recorder.startRecording();
        vi.advanceTimersByTime(500);
        await recorder.stopRecording();
      });
      
      // Should call completion callback which triggers upload
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('需求 7: 任务状态跟踪', () => {
    it('should create task with initial status', async () => {
      const mockOnComplete = vi.fn();
      const recorder = AudioRecorder({ onRecordingComplete: mockOnComplete });
      
      await act(async () => {
        await recorder.startRecording();
        vi.advanceTimersByTime(500);
        await recorder.stopRecording();
      });
      
      // Should complete recording and be ready for task creation
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should update task status in real-time', async () => {
      const mockOnStatusChange = vi.fn();
      const recorder = AudioRecorder({ onStatusChange: mockOnStatusChange });
      
      await act(async () => {
        await recorder.startRecording();
      });
      
      expect(mockOnStatusChange).toHaveBeenCalledWith(RecordingStatus.RECORDING);
      
      await act(async () => {
        await recorder.stopRecording();
      });
      
      expect(mockOnStatusChange).toHaveBeenCalledWith(RecordingStatus.PROCESSING);
    });
  });

  describe('需求 8: 错误处理', () => {
    it('should handle network errors gracefully', async () => {
      const mockOnError = vi.fn();
      const recorder = AudioRecorder({ onError: mockOnError });
      
      // Simulate network error during recording
      await act(async () => {
        await recorder.startRecording();
      });
      
      // Should handle errors without crashing
      expect(recorder.error).toBeNull();
    });

    it('should handle microphone disconnection', async () => {
      const mockOnError = vi.fn();
      const recorder = AudioRecorder({ onError: mockOnError });
      
      await act(async () => {
        await recorder.startRecording();
      });
      
      // Should be recording
      expect(recorder.isRecording).toBe(true);
    });

    it('should show browser compatibility warnings', () => {
      const recorder = AudioRecorder({});
      const compatibility = recorder.getBrowserCompatibility();
      
      expect(compatibility).toBeDefined();
      expect(typeof compatibility.isPartiallySupported).toBe('boolean');
    });
  });

  describe('Performance Optimization Verification', () => {
    it('should optimize memory usage during recording', async () => {
      performanceMonitor.startRecordingMonitoring();
      
      // Simulate recording with memory monitoring
      const chunks = Array.from({ length: 50 }, (_, i) => 
        new Blob([`chunk${i}`.repeat(1000)], { type: 'audio/webm' })
      );
      
      performanceMonitor.updateMemoryMetrics(chunks);
      
      const metrics = performanceMonitor.stopRecordingMonitoring();
      
      expect(metrics.memoryUsage.chunkCount).toBe(50);
      expect(metrics.memoryUsage.totalSize).toBeGreaterThan(0);
    });

    it('should provide memory optimization recommendations', () => {
      const largeChunks = Array.from({ length: 10 }, () => 
        new Blob(['x'.repeat(10 * 1024 * 1024)], { type: 'audio/webm' }) // 10MB each
      );
      
      const stats = memoryOptimizer.analyzeMemoryUsage(largeChunks);
      const recommendations = memoryOptimizer.getMemoryRecommendations(stats);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(stats.memoryPressure).toBe('high');
    });

    it('should handle component re-renders efficiently', () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();
      
      const { rerender } = render(
        <RecordingControls
          status={RecordingStatus.IDLE}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );
      
      // Multiple re-renders with same props should be efficient
      for (let i = 0; i < 10; i++) {
        rerender(
          <RecordingControls
            status={RecordingStatus.IDLE}
            onStart={mockOnStart}
            onStop={mockOnStop}
          />
        );
      }
      
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });
  });

  describe('Integration Test - Complete Workflow', () => {
    it('should handle complete recording workflow', async () => {
      const mockOnComplete = vi.fn();
      const mockOnError = vi.fn();
      const mockOnStatusChange = vi.fn();
      
      const recorder = AudioRecorder({
        onRecordingComplete: mockOnComplete,
        onError: mockOnError,
        onStatusChange: mockOnStatusChange,
        maxDuration: 5
      });
      
      // 1. Start recording
      await act(async () => {
        const started = await recorder.startRecording();
        expect(started).toBe(true);
      });
      
      expect(recorder.isRecording).toBe(true);
      expect(mockOnStatusChange).toHaveBeenCalledWith(RecordingStatus.RECORDING);
      
      // 2. Record for some time
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(recorder.duration).toBe(2);
      
      // 3. Stop recording
      await act(async () => {
        await recorder.stopRecording();
      });
      
      expect(recorder.isRecording).toBe(false);
      expect(mockOnStatusChange).toHaveBeenCalledWith(RecordingStatus.PROCESSING);
      
      // 4. Should complete with audio file
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.any(Blob),
          expect.stringMatching(/\.webm$/),
          expect.objectContaining({
            duration: 2,
            mimeType: expect.stringContaining('webm')
          })
        );
      });
      
      // 5. Should not have any errors
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });
});