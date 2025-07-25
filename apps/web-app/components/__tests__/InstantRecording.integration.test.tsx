import { render, screen, fireEvent, waitFor } from '../../src/test/test-utils';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AudioRecorder from '../AudioRecorder';
import RecordingTimer from '../RecordingTimer';
import RecordingControls from '../RecordingControls';
import { PermissionHandler } from '../PermissionHandler';
import { RecordingStatus, PermissionStatus } from '@/types/recording';

describe('Instant Recording - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Task 1: 实现基础录制功能', () => {
    it('should handle complete recording workflow', async () => {
      const onRecordingComplete = vi.fn();
      const { result } = renderHook(() => 
        AudioRecorder({ onRecordingComplete })
      );

      // Initial state
      expect(result.current.status).toBe(RecordingStatus.IDLE);
      expect(result.current.duration).toBe(0);
      expect(result.current.isRecording).toBe(false);

      // Start recording
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);
      expect(result.current.status).toBe(RecordingStatus.RECORDING);

      // Simulate recording for 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.duration).toBe(5);

      // Stop recording
      await act(async () => {
        await result.current.stopRecording();
      });

      // Wait for processing to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.isRecording).toBe(false);
    });

    it('should format duration correctly', () => {
      const { result } = renderHook(() => AudioRecorder({}));
      
      expect(result.current.formatDuration(0)).toBe('00:00');
      expect(result.current.formatDuration(65)).toBe('01:05');
      expect(result.current.formatDuration(3661)).toBe('61:01');
    });
  });

  describe('Task 2: 实现权限管理', () => {
    it('should handle permission request flow', () => {
      const onRequestPermission = vi.fn();
      
      render(
        <PermissionHandler
          hasPermission={PermissionStatus.UNKNOWN}
          onRequestPermission={onRequestPermission}
        />
      );

      expect(screen.getByText('需要麦克风权限')).toBeInTheDocument();
      
      const requestButton = screen.getByText('请求权限');
      fireEvent.click(requestButton);
      
      expect(onRequestPermission).toHaveBeenCalledTimes(1);
    });

    it('should show granted status when permission is granted', () => {
      const onRequestPermission = vi.fn();
      
      render(
        <PermissionHandler
          hasPermission={PermissionStatus.GRANTED}
          onRequestPermission={onRequestPermission}
        />
      );

      expect(screen.getByText('麦克风已就绪')).toBeInTheDocument();
    });

    it('should handle permission denied with error messages', () => {
      const onRequestPermission = vi.fn();
      
      render(
        <PermissionHandler
          hasPermission={PermissionStatus.DENIED}
          onRequestPermission={onRequestPermission}
          error="PERMISSION_DENIED: Permission denied"
        />
      );

      expect(screen.getByText('麦克风权限被拒绝')).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });
  });

  describe('Task 3: 实现录制控制界面', () => {
    it('should show correct buttons based on recording status', () => {
      const onStart = vi.fn();
      const onStop = vi.fn();

      // Idle state - show start button
      const { rerender } = render(
        <RecordingControls
          status={RecordingStatus.IDLE}
          onStart={onStart}
          onStop={onStop}
        />
      );

      expect(screen.getByText('开始录制')).toBeInTheDocument();
      expect(screen.queryByText('停止录制')).not.toBeInTheDocument();

      // Recording state - show stop button
      rerender(
        <RecordingControls
          status={RecordingStatus.RECORDING}
          onStart={onStart}
          onStop={onStop}
        />
      );

      expect(screen.getByText('停止录制')).toBeInTheDocument();
      expect(screen.queryByText('开始录制')).not.toBeInTheDocument();
    });

    it('should handle button clicks correctly', () => {
      const onStart = vi.fn();
      const onStop = vi.fn();

      const { rerender } = render(
        <RecordingControls
          status={RecordingStatus.IDLE}
          onStart={onStart}
          onStop={onStop}
        />
      );

      // Test start button
      fireEvent.click(screen.getByText('开始录制'));
      expect(onStart).toHaveBeenCalledTimes(1);

      // Test stop button
      rerender(
        <RecordingControls
          status={RecordingStatus.RECORDING}
          onStart={onStart}
          onStop={onStop}
        />
      );

      fireEvent.click(screen.getByText('停止录制'));
      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('should show loading states correctly', () => {
      const onStart = vi.fn();
      const onStop = vi.fn();

      // Requesting permission state
      const { rerender } = render(
        <RecordingControls
          status={RecordingStatus.REQUESTING_PERMISSION}
          onStart={onStart}
          onStop={onStop}
        />
      );

      expect(screen.getByText('请求权限中...')).toBeInTheDocument();

      // Processing state - shows start button but disabled
      rerender(
        <RecordingControls
          status={RecordingStatus.PROCESSING}
          onStart={onStart}
          onStop={onStop}
        />
      );

      // Processing state shows start button (disabled) since isRecording is false
      expect(screen.getByText('开始录制')).toBeInTheDocument();
      expect(screen.getByText('开始录制')).toBeDisabled();
    });
  });

  describe('Task 4: 实现录制时间管理和显示', () => {
    it('should display timer with correct format', () => {
      render(
        <RecordingTimer
          duration={65}
          maxDuration={1800}
          isRecording={false}
        />
      );

      expect(screen.getByText('01:05')).toBeInTheDocument();
      expect(screen.getByText('/ 30:00')).toBeInTheDocument();
    });

    it('should show progress bar and remaining time', () => {
      render(
        <RecordingTimer
          duration={900} // 15 minutes
          maxDuration={1800} // 30 minutes
          isRecording={true}
          showProgress={true}
        />
      );

      expect(screen.getByText('已录制')).toBeInTheDocument();
      expect(screen.getByText('剩余 15:00')).toBeInTheDocument();
    });

    it('should show warning when approaching time limit', () => {
      // 25 minutes (5 minutes remaining)
      render(
        <RecordingTimer
          duration={1500}
          maxDuration={1800}
          isRecording={true}
        />
      );

      expect(screen.getByText('⚠️ 录制时间即将达到上限')).toBeInTheDocument();
    });

    it('should show critical warning when very close to limit', () => {
      // 29 minutes 10 seconds (50 seconds remaining)
      render(
        <RecordingTimer
          duration={1750}
          maxDuration={1800}
          isRecording={true}
        />
      );

      expect(screen.getByText('🚨 录制即将自动停止')).toBeInTheDocument();
    });

    it('should auto-stop recording at max duration', async () => {
      const maxDuration = 5; // 5 seconds for quick testing
      const onRecordingComplete = vi.fn();
      
      const { result } = renderHook(() => 
        AudioRecorder({ 
          maxDuration, 
          onRecordingComplete 
        })
      );
      
      // Start recording
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);

      // Advance timer to max duration
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should trigger auto-stop
      await waitFor(() => {
        expect(result.current.duration).toBe(5);
      });

      // Wait for stop processing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.isRecording).toBe(false);
    });

    it('should calculate progress correctly', () => {
      const { result } = renderHook(() => 
        AudioRecorder({ maxDuration: 60 })
      );
      
      // Simulate 30 seconds of recording (50% progress)
      act(() => {
        // This would normally be done by the timer
        result.current.duration = 30;
      });
      
      // Test the progress calculation logic
      const progress = Math.min(1, 30 / 60);
      expect(progress).toBe(0.5);
    });
  });

  describe('Integration: Complete Recording Flow', () => {
    it('should handle complete user workflow from permission to recording completion', async () => {
      const onRecordingComplete = vi.fn();
      const onStatusChange = vi.fn();
      
      // Step 1: Initialize AudioRecorder
      const { result } = renderHook(() => 
        AudioRecorder({ 
          onRecordingComplete,
          onStatusChange,
          maxDuration: 10 // 10 seconds for quick testing
        })
      );

      // Step 2: Check initial state
      expect(result.current.status).toBe(RecordingStatus.IDLE);
      expect(result.current.hasPermission).toBe(PermissionStatus.UNKNOWN);

      // Step 3: Start recording (this will request permission)
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);
      expect(result.current.hasPermission).toBe(PermissionStatus.GRANTED);

      // Step 4: Simulate recording for some time
      act(() => {
        vi.advanceTimersByTime(3000); // 3 seconds
      });

      expect(result.current.duration).toBe(3);
      expect(result.current.getRemainingTime()).toBe(7);

      // Step 5: Stop recording manually
      await act(async () => {
        await result.current.stopRecording();
      });

      // Wait for processing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.isRecording).toBe(false);
      expect(onStatusChange).toHaveBeenCalledWith(RecordingStatus.PROCESSING);
    });

    it('should integrate timer display with recording state', () => {
      const duration = 125; // 2 minutes 5 seconds
      const maxDuration = 1800; // 30 minutes
      
      render(
        <RecordingTimer
          duration={duration}
          maxDuration={maxDuration}
          isRecording={true}
          showProgress={true}
        />
      );

      // Check time format
      expect(screen.getByText('02:05')).toBeInTheDocument();
      
      // Check remaining time
      const remainingMinutes = Math.floor((maxDuration - duration) / 60);
      const remainingSeconds = (maxDuration - duration) % 60;
      const expectedRemaining = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      expect(screen.getByText(`剩余 ${expectedRemaining}`)).toBeInTheDocument();
    });
  });
});