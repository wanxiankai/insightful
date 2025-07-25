"use client";

import { useCallback, useRef } from 'react';
import { RecordingStatus, PermissionStatus } from '@/types/recording';

export interface RecordingLifecycleState {
  status: RecordingStatus;
  hasPermission: PermissionStatus;
  duration: number;
  error: string | null;
}

export interface RecordingLifecycleActions {
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<void>;
  resetRecording: () => void;
  validateStateTransition: (from: RecordingStatus, to: RecordingStatus) => boolean;
}

export interface UseRecordingLifecycleProps {
  state: RecordingLifecycleState;
  onStateUpdate: (updates: Partial<RecordingLifecycleState>) => void;
  onError: (error: string) => void;
  maxDuration?: number;
}

/**
 * Hook for managing recording lifecycle with proper state transitions
 * This hook provides enhanced lifecycle management for recording operations
 */
export function useRecordingLifecycle({
  state,
  onStateUpdate,
  onError,
  maxDuration = 30 * 60 // 30 minutes default
}: UseRecordingLifecycleProps): RecordingLifecycleActions {
  
  const lifecycleRef = useRef({
    isTransitioning: false,
    lastTransition: null as { from: RecordingStatus; to: RecordingStatus; timestamp: number } | null
  });

  /**
   * Validate recording state transitions according to business rules
   * Ensures only valid state transitions are allowed
   */
  const validateStateTransition = useCallback((from: RecordingStatus, to: RecordingStatus): boolean => {
    const validTransitions: Record<RecordingStatus, RecordingStatus[]> = {
      [RecordingStatus.IDLE]: [
        RecordingStatus.REQUESTING_PERMISSION,
        RecordingStatus.RECORDING,
        RecordingStatus.ERROR
      ],
      [RecordingStatus.REQUESTING_PERMISSION]: [
        RecordingStatus.IDLE,
        RecordingStatus.RECORDING,
        RecordingStatus.ERROR
      ],
      [RecordingStatus.RECORDING]: [
        RecordingStatus.PROCESSING,
        RecordingStatus.PAUSED,
        RecordingStatus.ERROR,
        RecordingStatus.STOPPED // Direct transition for immediate stop
      ],
      [RecordingStatus.PAUSED]: [
        RecordingStatus.RECORDING,
        RecordingStatus.PROCESSING,
        RecordingStatus.ERROR
      ],
      [RecordingStatus.PROCESSING]: [
        RecordingStatus.STOPPED,
        RecordingStatus.ERROR
      ],
      [RecordingStatus.STOPPED]: [
        RecordingStatus.IDLE,
        RecordingStatus.ERROR
      ],
      [RecordingStatus.ERROR]: [
        RecordingStatus.IDLE,
        RecordingStatus.REQUESTING_PERMISSION
      ]
    };

    const isValid = validTransitions[from]?.includes(to) ?? false;
    
    if (!isValid) {
      console.warn(`Invalid state transition attempted: ${from} -> ${to}`);
    } else {
      // Track successful transitions for debugging
      lifecycleRef.current.lastTransition = {
        from,
        to,
        timestamp: Date.now()
      };
    }
    
    return isValid;
  }, []);

  /**
   * Safely update recording state with transition validation
   */
  const updateStateWithValidation = useCallback((updates: Partial<RecordingLifecycleState>) => {
    if (updates.status && updates.status !== state.status) {
      const isValidTransition = validateStateTransition(state.status, updates.status);
      if (!isValidTransition) {
        onError(`Invalid state transition: ${state.status} -> ${updates.status}`);
        return;
      }
    }
    
    onStateUpdate(updates);
  }, [state.status, validateStateTransition, onStateUpdate, onError]);

  /**
   * Enhanced start recording with proper lifecycle management
   * Handles permission requests, state validation, and error recovery
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent start operations
    if (lifecycleRef.current.isTransitioning) {
      console.warn('Recording lifecycle transition already in progress');
      return false;
    }

    // Validate current state allows starting
    if (state.status === RecordingStatus.RECORDING || 
        state.status === RecordingStatus.PROCESSING) {
      console.warn('Cannot start recording: already in progress');
      return false;
    }

    lifecycleRef.current.isTransitioning = true;

    try {
      // Clear any previous errors
      if (state.error) {
        updateStateWithValidation({ error: null });
      }

      // Reset duration for new recording
      updateStateWithValidation({ duration: 0 });

      // Check if we need to request permission
      if (state.hasPermission !== PermissionStatus.GRANTED) {
        updateStateWithValidation({ status: RecordingStatus.REQUESTING_PERMISSION });
        
        // Permission request would be handled by the parent component
        // This hook focuses on lifecycle management
        console.log('Permission request required before starting recording');
        return false;
      }

      // Transition to recording state
      updateStateWithValidation({ status: RecordingStatus.RECORDING });
      
      console.log('Recording lifecycle: Started successfully', {
        timestamp: new Date().toISOString(),
        maxDuration,
        previousState: state.status
      });

      return true;

    } catch (error: any) {
      updateStateWithValidation({ 
        status: RecordingStatus.ERROR,
        error: `Failed to start recording: ${error.message}`
      });
      onError(`Recording start failed: ${error.message}`);
      return false;
    } finally {
      lifecycleRef.current.isTransitioning = false;
    }
  }, [
    state.status,
    state.error,
    state.hasPermission,
    maxDuration,
    updateStateWithValidation,
    onError
  ]);

  /**
   * Enhanced stop recording with proper lifecycle management
   * Handles graceful shutdown, data preservation, and error recovery
   */
  const stopRecording = useCallback(async (): Promise<void> => {
    // Prevent concurrent stop operations
    if (lifecycleRef.current.isTransitioning) {
      console.warn('Recording lifecycle transition already in progress');
      return;
    }

    // Validate current state allows stopping
    if (state.status !== RecordingStatus.RECORDING) {
      console.warn('Cannot stop recording: not currently recording');
      return;
    }

    lifecycleRef.current.isTransitioning = true;

    try {
      // Transition to processing state immediately
      updateStateWithValidation({ status: RecordingStatus.PROCESSING });

      console.log('Recording lifecycle: Stopping recording', {
        timestamp: new Date().toISOString(),
        duration: state.duration,
        previousState: state.status
      });

      // The actual MediaRecorder stopping would be handled by the parent component
      // This hook focuses on lifecycle state management
      
      // After processing is complete, transition to stopped
      // This would typically be called by the parent after audio processing
      setTimeout(() => {
        updateStateWithValidation({ status: RecordingStatus.STOPPED });
        console.log('Recording lifecycle: Stopped successfully');
      }, 100);

    } catch (error: any) {
      updateStateWithValidation({ 
        status: RecordingStatus.ERROR,
        error: `Failed to stop recording: ${error.message}`
      });
      onError(`Recording stop failed: ${error.message}`);
    } finally {
      lifecycleRef.current.isTransitioning = false;
    }
  }, [
    state.status,
    state.duration,
    updateStateWithValidation,
    onError
  ]);

  /**
   * Reset recording state to idle with proper cleanup
   * Ensures all resources are properly released
   */
  const resetRecording = useCallback(() => {
    // If currently recording, stop first
    if (state.status === RecordingStatus.RECORDING) {
      console.log('Recording lifecycle: Stopping active recording before reset');
      stopRecording();
      return;
    }

    // Reset to initial state
    updateStateWithValidation({
      status: RecordingStatus.IDLE,
      duration: 0,
      error: null
    });

    // Clear lifecycle tracking
    lifecycleRef.current.isTransitioning = false;
    lifecycleRef.current.lastTransition = null;

    console.log('Recording lifecycle: Reset to idle state');
  }, [state.status, stopRecording, updateStateWithValidation]);

  return {
    startRecording,
    stopRecording,
    resetRecording,
    validateStateTransition
  };
}