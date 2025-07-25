"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  RecordingStatus, 
  PermissionStatus, 
  AudioRecorderState, 
  RecordingSession,
  AudioFileMetadata,
  MediaRecorderConfig,
  RECORDING_ERROR_CODES,
  RecordingErrorCode
} from '@/types/recording';

// Default configuration for MediaRecorder
const DEFAULT_MEDIA_RECORDER_CONFIG: MediaRecorderConfig = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000
};

// Default max duration: 30 minutes in seconds
const DEFAULT_MAX_DURATION = 30 * 60;

interface UseAudioRecorderOptions {
  maxDuration?: number;
  onRecordingComplete?: (audioBlob: Blob, fileName: string, metadata: AudioFileMetadata) => Promise<void>;
  onError?: (error: string) => void;
  onStatusChange?: (status: RecordingStatus) => void;
}

interface UseAudioRecorderReturn {
  // State
  status: RecordingStatus;
  duration: number;
  hasPermission: PermissionStatus;
  error: string | null;
  isRecording: boolean;
  canRecord: boolean;
  
  // Actions
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  
  // Utilities
  formatDuration: (seconds: number) => string;
  getRemainingTime: () => number;
  getProgress: () => number;
  clearError: () => void;
}

export function useAudioRecorder({
  maxDuration = DEFAULT_MAX_DURATION,
  onRecordingComplete,
  onError,
  onStatusChange
}: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  
  // Core state management
  const [state, setState] = useState<AudioRecorderState>({
    status: RecordingStatus.IDLE,
    duration: 0,
    hasPermission: PermissionStatus.UNKNOWN,
    error: null,
    mediaRecorder: null,
    audioChunks: [],
    session: null
  });

  // Refs for managing recording
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Update state helper
  const updateState = useCallback((updates: Partial<AudioRecorderState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      
      // Notify status change if status changed
      if (updates.status && updates.status !== prevState.status && onStatusChange) {
        onStatusChange(updates.status);
      }
      
      return newState;
    });
  }, [onStatusChange]);

  // Error handling helper
  const handleError = useCallback((errorCode: RecordingErrorCode, message: string, details?: any) => {
    const errorMessage = `${errorCode}: ${message}`;
    console.error('AudioRecorder Error:', errorMessage, details);
    
    updateState({
      status: RecordingStatus.ERROR,
      error: errorMessage
    });

    if (onError) {
      onError(errorMessage);
    }
  }, [updateState, onError]);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ 
      error: null,
      status: state.status === RecordingStatus.ERROR ? RecordingStatus.IDLE : state.status
    });
  }, [updateState, state.status]);

  // Check browser support for MediaRecorder
  const checkBrowserSupport = useCallback((): boolean => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      handleError(
        RECORDING_ERROR_CODES.UNSUPPORTED_BROWSER,
        'MediaDevices API not supported in this browser'
      );
      return false;
    }

    if (!window.MediaRecorder) {
      handleError(
        RECORDING_ERROR_CODES.UNSUPPORTED_BROWSER,
        'MediaRecorder API not supported in this browser'
      );
      return false;
    }

    // Check if the preferred mime type is supported
    if (!MediaRecorder.isTypeSupported(DEFAULT_MEDIA_RECORDER_CONFIG.mimeType)) {
      console.warn('Preferred mime type not supported, will use browser default');
    }

    return true;
  }, [handleError]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!checkBrowserSupport()) {
      return false;
    }

    updateState({ status: RecordingStatus.REQUESTING_PERMISSION });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      updateState({ 
        hasPermission: PermissionStatus.GRANTED,
        status: RecordingStatus.IDLE
      });
      return true;

    } catch (error: any) {
      let errorCode: RecordingErrorCode;
      let errorMessage: string;

      switch (error.name) {
        case 'NotAllowedError':
          errorCode = RECORDING_ERROR_CODES.PERMISSION_DENIED;
          errorMessage = 'Microphone permission denied by user';
          updateState({ hasPermission: PermissionStatus.DENIED });
          break;
        case 'NotFoundError':
          errorCode = RECORDING_ERROR_CODES.DEVICE_NOT_FOUND;
          errorMessage = 'No microphone device found';
          break;
        case 'NotReadableError':
          errorCode = RECORDING_ERROR_CODES.DEVICE_BUSY;
          errorMessage = 'Microphone is already in use by another application';
          break;
        default:
          errorCode = RECORDING_ERROR_CODES.UNKNOWN_ERROR;
          errorMessage = `Failed to access microphone: ${error.message}`;
      }

      handleError(errorCode, errorMessage, error);
      return false;
    }
  }, [checkBrowserSupport, updateState, handleError]);

  // Create MediaRecorder instance
  const createMediaRecorder = useCallback((stream: MediaStream): MediaRecorder | null => {
    try {
      const config: MediaRecorderOptions = {};
      
      // Use preferred mime type if supported
      if (MediaRecorder.isTypeSupported(DEFAULT_MEDIA_RECORDER_CONFIG.mimeType)) {
        config.mimeType = DEFAULT_MEDIA_RECORDER_CONFIG.mimeType;
      }
      
      if (DEFAULT_MEDIA_RECORDER_CONFIG.audioBitsPerSecond) {
        config.audioBitsPerSecond = DEFAULT_MEDIA_RECORDER_CONFIG.audioBitsPerSecond;
      }

      const mediaRecorder = new MediaRecorder(stream, config);

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          updateState({ audioChunks: [...audioChunksRef.current] });
        }
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started');
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
      };

      mediaRecorder.onerror = (event: any) => {
        handleError(
          RECORDING_ERROR_CODES.RECORDING_FAILED,
          'MediaRecorder error occurred',
          event.error
        );
      };

      return mediaRecorder;

    } catch (error: any) {
      handleError(
        RECORDING_ERROR_CODES.RECORDING_FAILED,
        `Failed to create MediaRecorder: ${error.message}`,
        error
      );
      return null;
    }
  }, [updateState, handleError]);

  // Start recording timer
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setState(prevState => {
        const newDuration = prevState.duration + 1;
        return { ...prevState, duration: newDuration };
      });
    }, 1000);
  }, []);

  // Stop recording timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Generate unique session ID
  const generateSessionId = useCallback((): string => {
    return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Generate audio file name
  const generateFileName = useCallback((): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `recording_${timestamp}.webm`;
  }, []);

  // Create audio file metadata
  const createAudioMetadata = useCallback((blob: Blob, duration: number): AudioFileMetadata => {
    return {
      fileName: generateFileName(),
      mimeType: blob.type || 'audio/webm',
      size: blob.size,
      duration: duration,
      sampleRate: undefined // Will be populated if available
    };
  }, [generateFileName]);

  // Start recording function
  const startRecording = useCallback(async (): Promise<boolean> => {
    // Reset previous state
    audioChunksRef.current = [];
    updateState({
      audioChunks: [],
      duration: 0,
      error: null
    });

    // Request permission if not already granted
    if (state.hasPermission !== PermissionStatus.GRANTED) {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return false;
      }
    }

    const stream = mediaStreamRef.current;
    if (!stream) {
      handleError(
        RECORDING_ERROR_CODES.DEVICE_NOT_FOUND,
        'No media stream available'
      );
      return false;
    }

    // Create MediaRecorder
    const mediaRecorder = createMediaRecorder(stream);
    if (!mediaRecorder) {
      return false;
    }

    // Create recording session
    const session: RecordingSession = {
      id: generateSessionId(),
      startTime: new Date(),
      duration: 0,
      status: RecordingStatus.RECORDING,
      audioChunks: []
    };

    // Update state and start recording
    updateState({
      status: RecordingStatus.RECORDING,
      mediaRecorder,
      session
    });

    try {
      mediaRecorder.start(1000); // Collect data every second
      startTimer();
      return true;
    } catch (error: any) {
      handleError(
        RECORDING_ERROR_CODES.RECORDING_FAILED,
        `Failed to start recording: ${error.message}`,
        error
      );
      return false;
    }
  }, [
    state.hasPermission,
    requestPermission,
    createMediaRecorder,
    generateSessionId,
    updateState,
    startTimer,
    handleError
  ]);

  // Stop recording function
  const stopRecording = useCallback(async (): Promise<void> => {
    const { mediaRecorder, session } = state;
    
    if (!mediaRecorder || !session) {
      console.warn('No active recording to stop');
      return;
    }

    updateState({ status: RecordingStatus.PROCESSING });
    stopTimer();

    try {
      // Stop the MediaRecorder
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }

      // Stop all tracks in the media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorder.mimeType || 'audio/webm' 
      });

      // Create metadata
      const metadata = createAudioMetadata(audioBlob, state.duration);

      // Update session
      const updatedSession: RecordingSession = {
        ...session,
        endTime: new Date(),
        duration: state.duration,
        status: RecordingStatus.STOPPED,
        audioChunks: audioChunksRef.current
      };

      updateState({
        status: RecordingStatus.STOPPED,
        session: updatedSession
      });

      // Call completion callback
      if (onRecordingComplete) {
        await onRecordingComplete(audioBlob, metadata.fileName, metadata);
      }

    } catch (error: any) {
      handleError(
        RECORDING_ERROR_CODES.RECORDING_FAILED,
        `Failed to stop recording: ${error.message}`,
        error
      );
    }
  }, [state, stopTimer, createAudioMetadata, updateState, onRecordingComplete, handleError]);

  // Auto-stop when max duration reached
  useEffect(() => {
    if (state.status === RecordingStatus.RECORDING && state.duration >= maxDuration) {
      console.log('Max duration reached, stopping recording');
      stopRecording();
    }
  }, [state.status, state.duration, maxDuration, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopTimer]);

  // Utility functions
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getRemainingTime = useCallback((): number => {
    return Math.max(0, maxDuration - state.duration);
  }, [maxDuration, state.duration]);

  const getProgress = useCallback((): number => {
    return Math.min(1, state.duration / maxDuration);
  }, [state.duration, maxDuration]);

  return {
    // State
    status: state.status,
    duration: state.duration,
    hasPermission: state.hasPermission,
    error: state.error,
    isRecording: state.status === RecordingStatus.RECORDING,
    canRecord: state.hasPermission === PermissionStatus.GRANTED && 
               state.status === RecordingStatus.IDLE,
    
    // Actions
    startRecording,
    stopRecording,
    requestPermission,
    
    // Utilities
    formatDuration,
    getRemainingTime,
    getProgress,
    clearError
  };
}