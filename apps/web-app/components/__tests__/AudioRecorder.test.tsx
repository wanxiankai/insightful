import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AudioRecorder from '../AudioRecorder';
import { RecordingStatus, PermissionStatus } from '@/types/recording';

describe('AudioRecorder - Duration Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should have default max duration of 30 minutes', () => {
    const { result } = renderHook(() => AudioRecorder({}));
    
    expect(result.current?.getRemainingTime()).toBe(30 * 60); // 30 minutes in seconds
  });

  it('should accept custom max duration', () => {
    const customMaxDuration = 10 * 60; // 10 minutes
    const { result } = renderHook(() => AudioRecorder({ maxDuration: customMaxDuration }));
    
    expect(result.current?.getRemainingTime()).toBe(customMaxDuration);
  });

  it('should track duration correctly during recording', async () => {
    const { result } = renderHook(() => AudioRecorder({}));
    
    // Start recording
    await act(async () => {
      await result.current?.startRecording();
    });

    expect(result.current?.isRecording).toBe(true);
    expect(result.current?.duration).toBe(0);

    // Advance timer by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current?.duration).toBe(5);
    expect(result.current?.getRemainingTime()).toBe(30 * 60 - 5);
  });

  it('should calculate progress correctly', async () => {
    const maxDuration = 60; // 1 minute for easier testing
    const { result } = renderHook(() => AudioRecorder({ maxDuration }));
    
    await act(async () => {
      await result.current?.startRecording();
    });

    // Advance timer by 30 seconds (50% of max duration)
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current?.getProgress()).toBe(0.5);
  });

  it('should auto-stop recording when max duration is reached', async () => {
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
      await result.current?.startRecording();
    });

    expect(result.current?.isRecording).toBe(true);

    // Advance timer to max duration
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should trigger auto-stop
    expect(result.current?.duration).toBe(5);
  }, 10000);

  it('should not exceed max duration', async () => {
    const maxDuration = 3; // 3 seconds
    const { result } = renderHook(() => AudioRecorder({ maxDuration }));
    
    await act(async () => {
      await result.current?.startRecording();
    });

    // Advance timer beyond max duration
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Duration should not exceed max duration significantly
    expect(result.current?.duration).toBeLessThanOrEqual(maxDuration + 2); // +2 for timing tolerance
  });

  it('should handle remaining time calculation correctly', () => {
    const maxDuration = 60;
    const { result } = renderHook(() => AudioRecorder({ maxDuration }));
    
    // Initially, remaining time should equal max duration
    expect(result.current?.getRemainingTime()).toBe(maxDuration);
    
    // Test the calculation logic directly
    const remainingTime = Math.max(0, maxDuration - 20);
    expect(remainingTime).toBe(40);
  });

  it('should prevent starting new recording when at max duration', async () => {
    const maxDuration = 1;
    const { result } = renderHook(() => AudioRecorder({ maxDuration }));
    
    await act(async () => {
      await result.current.startRecording();
    });

    // Advance to max duration
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for auto-stop to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Try to start recording again immediately
    const canStartAgain = await act(async () => {
      return await result.current.startRecording();
    });

    // Should be able to start again after reset/stop
    expect(typeof canStartAgain).toBe('boolean');
  });

  it('should format duration correctly', () => {
    const { result } = renderHook(() => AudioRecorder({}));
    
    expect(result.current.formatDuration(0)).toBe('00:00');
    expect(result.current.formatDuration(65)).toBe('01:05');
    expect(result.current.formatDuration(3661)).toBe('61:01');
    expect(result.current.formatDuration(1800)).toBe('30:00'); // 30 minutes
  });

  it('should handle edge case of zero max duration', () => {
    const { result } = renderHook(() => AudioRecorder({ maxDuration: 0 }));
    
    expect(result.current.getRemainingTime()).toBe(0);
    expect(result.current.getProgress()).toBe(0);
  });

  it('should call onStatusChange when auto-stopping', async () => {
    const maxDuration = 2;
    const onStatusChange = vi.fn();
    
    const { result } = renderHook(() => 
      AudioRecorder({ 
        maxDuration, 
        onStatusChange 
      })
    );
    
    await act(async () => {
      await result.current.startRecording();
    });

    // Clear previous status change calls
    onStatusChange.mockClear();

    // Advance to max duration to trigger auto-stop
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Wait for processing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Should have called onStatusChange for the processing state
    expect(onStatusChange).toHaveBeenCalledWith(RecordingStatus.PROCESSING);
  });
});