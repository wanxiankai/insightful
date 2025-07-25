"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  RecordingStatus, 
  PermissionStatus, 
  AudioRecorderState, 
  AudioRecorderProps,
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

export default function AudioRecorder({
  onRecordingComplete,
  maxDuration = DEFAULT_MAX_DURATION,
  onError,
  onStatusChange
}: AudioRecorderProps) {
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

  // Update state helper with state transition validation
  const updateState = useCallback((updates: Partial<AudioRecorderState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      
      // Validate state transitions if status is being updated
      if (updates.status && updates.status !== prevState.status) {
        const isValidTransition = validateStateTransition(prevState.status, updates.status);
        if (!isValidTransition) {
          console.warn(`Invalid state transition: ${prevState.status} -> ${updates.status}`);
        }
        
        // Notify status change
        if (onStatusChange) {
          onStatusChange(updates.status);
        }
      }
      
      return newState;
    });
  }, [onStatusChange]);

  // Validate recording state transitions
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
        RecordingStatus.ERROR
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

    return validTransitions[from]?.includes(to) ?? false;
  }, []);

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
      updateState({ hasPermission: PermissionStatus.GRANTED });
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
        
        // Check if max duration reached
        if (newDuration >= maxDuration) {
          // Will trigger stop recording in useEffect
          return { ...prevState, duration: newDuration };
        }
        
        return { ...prevState, duration: newDuration };
      });
    }, 1000);
  }, [maxDuration]);

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

  // Start recording function with enhanced lifecycle management
  const startRecording = useCallback(async (): Promise<boolean> => {
    // Validate state transition before starting
    const canStart = validateStateTransition(state.status, RecordingStatus.RECORDING);
    if (!canStart && state.status !== RecordingStatus.IDLE) {
      console.warn('Cannot start recording: invalid state transition');
      return false;
    }

    // Prevent starting if already recording or in invalid state
    if (state.status === RecordingStatus.RECORDING || 
        state.status === RecordingStatus.PROCESSING) {
      console.warn('Cannot start recording: already in progress');
      return false;
    }

    try {
      // Reset previous state and prepare for new recording
      audioChunksRef.current = [];
      updateState({
        audioChunks: [],
        duration: 0,
        error: null,
        status: RecordingStatus.IDLE
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

      // Verify stream is still active
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0 || audioTracks[0].readyState !== 'live') {
        handleError(
          RECORDING_ERROR_CODES.DEVICE_NOT_FOUND,
          'Audio track is not available or not live'
        );
        return false;
      }

      // Create MediaRecorder
      const mediaRecorder = createMediaRecorder(stream);
      if (!mediaRecorder) {
        return false;
      }

      // Create recording session with proper lifecycle tracking
      const session: RecordingSession = {
        id: generateSessionId(),
        startTime: new Date(),
        duration: 0,
        status: RecordingStatus.RECORDING,
        audioChunks: []
      };

      // Update state to recording with proper state transition
      updateState({
        status: RecordingStatus.RECORDING,
        mediaRecorder,
        session
      });

      // Start MediaRecorder with data collection interval
      mediaRecorder.start(1000); // Collect data every second
      startTimer();
      
      console.log('Recording started successfully', {
        sessionId: session.id,
        startTime: session.startTime,
        mimeType: mediaRecorder.mimeType,
        stateTransition: `${RecordingStatus.IDLE} -> ${RecordingStatus.RECORDING}`
      });
      
      return true;
    } catch (error: any) {
      // Reset state on failure with proper error handling
      updateState({
        status: RecordingStatus.ERROR,
        mediaRecorder: null,
        session: null
      });
      
      handleError(
        RECORDING_ERROR_CODES.RECORDING_FAILED,
        `Failed to start recording: ${error.message}`,
        error
      );
      return false;
    }
  }, [
    state.hasPermission,
    state.status,
    requestPermission,
    createMediaRecorder,
    generateSessionId,
    updateState,
    startTimer,
    handleError,
    validateStateTransition
  ]);

  // Stop recording function with enhanced lifecycle management
  const stopRecording = useCallback(async (): Promise<void> => {
    const { mediaRecorder, session } = state;
    
    // Validate state transition before stopping
    const canStop = validateStateTransition(state.status, RecordingStatus.PROCESSING);
    if (!canStop) {
      console.warn('Cannot stop recording: invalid state transition');
      return;
    }
    
    // Validate that we have an active recording to stop
    if (!mediaRecorder || !session) {
      console.warn('No active recording to stop');
      return;
    }

    // Prevent stopping if not in recording state
    if (state.status !== RecordingStatus.RECORDING) {
      console.warn('Cannot stop recording: not currently recording');
      return;
    }

    try {
      // Transition to processing state with proper validation
      updateState({ status: RecordingStatus.PROCESSING });
      stopTimer();

      console.log('Stopping recording', {
        sessionId: session.id,
        duration: state.duration,
        chunksCount: audioChunksRef.current.length,
        stateTransition: `${RecordingStatus.RECORDING} -> ${RecordingStatus.PROCESSING}`
      });

      // Stop the MediaRecorder if it's still recording
      if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
        mediaRecorder.stop();
      }

      // Wait a brief moment for final data events to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stop all tracks in the media stream to release microphone
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped audio track:', track.label);
        });
        mediaStreamRef.current = null;
      }

      // Validate we have audio data
      if (audioChunksRef.current.length === 0) {
        throw new Error('No audio data recorded');
      }

      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorder.mimeType || 'audio/webm' 
      });

      // Validate blob size
      if (audioBlob.size === 0) {
        throw new Error('Generated audio file is empty');
      }

      // Create metadata
      const metadata = createAudioMetadata(audioBlob, state.duration);

      // Update session with completion details
      const updatedSession: RecordingSession = {
        ...session,
        endTime: new Date(),
        duration: state.duration,
        status: RecordingStatus.STOPPED,
        audioChunks: audioChunksRef.current
      };

      // Update state to stopped with proper state transition
      updateState({
        status: RecordingStatus.STOPPED,
        session: updatedSession,
        mediaRecorder: null
      });

      console.log('Recording stopped successfully', {
        sessionId: session.id,
        duration: state.duration,
        fileSize: audioBlob.size,
        mimeType: audioBlob.type,
        stateTransition: `${RecordingStatus.PROCESSING} -> ${RecordingStatus.STOPPED}`
      });

      // Call completion callback
      if (onRecordingComplete) {
        try {
          await onRecordingComplete(audioBlob, metadata.fileName, metadata);
        } catch (callbackError: any) {
          console.error('Error in recording completion callback:', callbackError);
          handleError(
            RECORDING_ERROR_CODES.UNKNOWN_ERROR,
            `Recording completed but callback failed: ${callbackError.message}`,
            callbackError
          );
        }
      }

    } catch (error: any) {
      // Clean up state on error with proper error state transition
      updateState({
        status: RecordingStatus.ERROR,
        mediaRecorder: null,
        session: null
      });

      // Clean up media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      handleError(
        RECORDING_ERROR_CODES.RECORDING_FAILED,
        `Failed to stop recording: ${error.message}`,
        error
      );
    }
  }, [state, stopTimer, createAudioMetadata, updateState, onRecordingComplete, handleError, validateStateTransition]);

  // Auto-stop when max duration reached
  useEffect(() => {
    if (state.status === RecordingStatus.RECORDING && state.duration >= maxDuration) {
      console.log('Max duration reached, stopping recording');
      stopRecording();
    }
  }, [state.status, state.duration, maxDuration, stopRecording]);

  // Reset recording state to idle with proper lifecycle management
  const resetRecording = useCallback(() => {
    // Stop any active recording first
    if (state.status === RecordingStatus.RECORDING) {
      console.log('Stopping active recording before reset');
      stopRecording();
      return;
    }

    // Validate state transition to idle
    const canReset = validateStateTransition(state.status, RecordingStatus.IDLE);
    if (!canReset && state.status !== RecordingStatus.ERROR && state.status !== RecordingStatus.STOPPED) {
      console.warn('Cannot reset recording: invalid state transition');
      return;
    }

    // Clean up resources
    stopTimer();
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped audio track during reset:', track.label);
      });
      mediaStreamRef.current = null;
    }

    // Reset state with proper lifecycle tracking
    audioChunksRef.current = [];
    updateState({
      status: RecordingStatus.IDLE,
      duration: 0,
      error: null,
      mediaRecorder: null,
      audioChunks: [],
      session: null
    });

    console.log('Recording state reset to idle', {
      previousState: state.status,
      stateTransition: `${state.status} -> ${RecordingStatus.IDLE}`
    });
  }, [state.status, stopRecording, stopTimer, updateState, validateStateTransition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopTimer]);

  // Public API
  return {
    // State
    status: state.status,
    duration: state.duration,
    hasPermission: state.hasPermission,
    error: state.error,
    session: state.session,
    isRecording: state.status === RecordingStatus.RECORDING,
    isProcessing: state.status === RecordingStatus.PROCESSING,
    canRecord: state.hasPermission === PermissionStatus.GRANTED && 
               state.status === RecordingStatus.IDLE,
    canStop: state.status === RecordingStatus.RECORDING,
    
    // Actions
    startRecording,
    stopRecording,
    resetRecording,
    requestPermission,
    
    // Utilities
    formatDuration: (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    getRemainingTime: (): number => Math.max(0, maxDuration - state.duration),
    
    getProgress: (): number => Math.min(1, state.duration / maxDuration),
    
    // State validation
    isValidState: (): boolean => {
      return Object.values(RecordingStatus).includes(state.status);
    }
  };
}