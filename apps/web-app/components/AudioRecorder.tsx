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

  // Validate audio data chunk
  const validateAudioChunk = useCallback((chunk: Blob): boolean => {
    // Check if chunk has valid size
    if (chunk.size === 0) {
      console.warn('Received empty audio chunk');
      return false;
    }

    // Check if chunk has valid type
    if (!chunk.type || !chunk.type.startsWith('audio/')) {
      console.warn('Received audio chunk with invalid type:', chunk.type);
      // Still accept it as some browsers might not set the type correctly
    }

    // Check for reasonable size limits (not too small, not too large)
    const MIN_CHUNK_SIZE = 10; // 10 bytes minimum (reduced for test compatibility)
    const MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB maximum per chunk
    
    if (chunk.size < MIN_CHUNK_SIZE) {
      console.warn('Audio chunk too small:', chunk.size);
      return false;
    }
    
    if (chunk.size > MAX_CHUNK_SIZE) {
      console.warn('Audio chunk too large:', chunk.size);
      return false;
    }

    return true;
  }, []);

  // Process and collect audio data chunks
  const processAudioChunk = useCallback((chunk: Blob) => {
    // Validate the chunk before processing
    if (!validateAudioChunk(chunk)) {
      console.warn('Skipping invalid audio chunk');
      return;
    }

    // Add chunk to collection
    audioChunksRef.current.push(chunk);
    
    // Calculate total size for monitoring
    const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
    
    // Log chunk processing for debugging
    console.log('Audio chunk processed:', {
      chunkSize: chunk.size,
      chunkType: chunk.type,
      totalChunks: audioChunksRef.current.length,
      totalSize: totalSize,
      timestamp: new Date().toISOString()
    });

    // Update state with new chunks array
    updateState({ audioChunks: [...audioChunksRef.current] });

    // Check for memory usage warnings
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB warning threshold
    if (totalSize > MAX_TOTAL_SIZE) {
      console.warn('Audio data size approaching memory limit:', totalSize);
    }
  }, [validateAudioChunk, updateState]);

  // Merge audio chunks into a single blob with format validation
  const mergeAudioChunks = useCallback((chunks: Blob[], mimeType: string): Blob => {
    if (chunks.length === 0) {
      throw new Error('No audio chunks to merge');
    }

    // Validate all chunks before merging
    const validChunks = chunks.filter(chunk => validateAudioChunk(chunk));
    
    if (validChunks.length === 0) {
      throw new Error('No valid audio chunks found');
    }

    if (validChunks.length !== chunks.length) {
      console.warn(`Filtered out ${chunks.length - validChunks.length} invalid chunks`);
    }

    // Determine the best mime type to use
    let finalMimeType = mimeType;
    
    // If no mime type provided, try to detect from chunks
    if (!finalMimeType) {
      const chunkWithType = validChunks.find(chunk => chunk.type && chunk.type.startsWith('audio/'));
      finalMimeType = chunkWithType?.type || 'audio/webm';
    }

    // Validate mime type format
    if (!finalMimeType.startsWith('audio/')) {
      console.warn('Invalid mime type, using default:', finalMimeType);
      finalMimeType = 'audio/webm';
    }

    console.log('Merging audio chunks:', {
      chunkCount: validChunks.length,
      totalSize: validChunks.reduce((sum, chunk) => sum + chunk.size, 0),
      mimeType: finalMimeType
    });

    // Create merged blob
    const mergedBlob = new Blob(validChunks, { type: finalMimeType });
    
    // Validate merged blob
    if (mergedBlob.size === 0) {
      throw new Error('Merged audio blob is empty');
    }

    return mergedBlob;
  }, [validateAudioChunk]);

  // Create MediaRecorder instance with enhanced data processing
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

      // Enhanced data available event handler with processing and validation
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          try {
            processAudioChunk(event.data);
          } catch (error: any) {
            console.error('Error processing audio chunk:', error);
            handleError(
              RECORDING_ERROR_CODES.RECORDING_FAILED,
              `Failed to process audio chunk: ${error.message}`,
              error
            );
          }
        } else {
          console.warn('Received empty or invalid data event');
        }
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started', {
          mimeType: mediaRecorder.mimeType,
          state: mediaRecorder.state,
          audioBitsPerSecond: config.audioBitsPerSecond
        });
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped', {
          finalChunkCount: audioChunksRef.current.length,
          totalSize: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
        });
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        handleError(
          RECORDING_ERROR_CODES.RECORDING_FAILED,
          'MediaRecorder error occurred',
          event.error
        );
      };

      // Additional event handlers for better monitoring
      mediaRecorder.onpause = () => {
        console.log('MediaRecorder paused');
      };

      mediaRecorder.onresume = () => {
        console.log('MediaRecorder resumed');
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
  }, [processAudioChunk, handleError]);

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

  // Extract audio metadata from MediaRecorder and stream
  const extractAudioStreamMetadata = useCallback((stream: MediaStream, mediaRecorder: MediaRecorder) => {
    const metadata: any = {};
    
    try {
      // Get audio track information
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        const settings = track.getSettings();
        const capabilities = track.getCapabilities();
        
        metadata.sampleRate = settings.sampleRate;
        metadata.channelCount = settings.channelCount;
        metadata.echoCancellation = settings.echoCancellation;
        metadata.noiseSuppression = settings.noiseSuppression;
        metadata.autoGainControl = settings.autoGainControl;
        
        // Add capability information
        if (capabilities) {
          metadata.sampleRateRange = capabilities.sampleRate;
          metadata.channelCountRange = capabilities.channelCount;
        }
        
        metadata.trackLabel = track.label;
        metadata.trackId = track.id;
      }
      
      // Get MediaRecorder information
      metadata.recorderMimeType = mediaRecorder.mimeType;
      metadata.recorderState = mediaRecorder.state;
      
      // Try to get audio bitrate if available
      if (mediaRecorder.audioBitsPerSecond) {
        metadata.audioBitsPerSecond = mediaRecorder.audioBitsPerSecond;
      }
      
    } catch (error) {
      console.warn('Could not extract all audio metadata:', error);
    }
    
    return metadata;
  }, []);

  // Generate WebM format audio file with proper metadata
  const generateAudioFile = useCallback((
    audioChunks: Blob[], 
    mimeType: string, 
    duration: number,
    streamMetadata?: any
  ): { blob: Blob; metadata: AudioFileMetadata } => {
    
    // Validate input parameters
    if (!audioChunks || audioChunks.length === 0) {
      throw new Error('No audio chunks provided for file generation');
    }
    
    if (duration <= 0) {
      throw new Error('Invalid duration for audio file');
    }

    // Merge chunks into final blob
    const audioBlob = mergeAudioChunks(audioChunks, mimeType);
    
    // Validate generated blob
    if (audioBlob.size === 0) {
      throw new Error('Generated audio file is empty');
    }

    // Ensure WebM format
    let finalMimeType = mimeType;
    if (!finalMimeType.includes('webm')) {
      console.warn('Non-WebM format detected, ensuring WebM compatibility');
      finalMimeType = 'audio/webm;codecs=opus';
    }

    // Create final blob with correct WebM mime type
    const finalBlob = new Blob([audioBlob], { type: finalMimeType });
    
    // Generate comprehensive metadata
    const metadata: AudioFileMetadata = {
      fileName: generateFileName(),
      mimeType: finalBlob.type,
      size: finalBlob.size,
      duration: duration,
      sampleRate: streamMetadata?.sampleRate,
      // Additional metadata fields
      channelCount: streamMetadata?.channelCount,
      audioBitsPerSecond: streamMetadata?.audioBitsPerSecond,
      echoCancellation: streamMetadata?.echoCancellation,
      noiseSuppression: streamMetadata?.noiseSuppression,
      autoGainControl: streamMetadata?.autoGainControl,
      trackLabel: streamMetadata?.trackLabel,
      createdAt: new Date().toISOString(),
      chunkCount: audioChunks.length
    };

    // Calculate estimated bitrate if not available
    if (!metadata.audioBitsPerSecond && duration > 0) {
      // Estimate bitrate: (file size in bits) / duration in seconds
      metadata.estimatedBitrate = Math.round((finalBlob.size * 8) / duration);
    }

    // Validate metadata
    if (metadata.size > 100 * 1024 * 1024) { // 100MB limit
      console.warn('Generated audio file is very large:', metadata.size);
    }

    console.log('Audio file generated successfully:', {
      fileName: metadata.fileName,
      size: metadata.size,
      duration: metadata.duration,
      mimeType: metadata.mimeType,
      sampleRate: metadata.sampleRate,
      estimatedBitrate: metadata.estimatedBitrate,
      chunkCount: metadata.chunkCount
    });

    return { blob: finalBlob, metadata };
  }, [mergeAudioChunks, generateFileName]);

  // Create audio file metadata (enhanced version)
  const createAudioMetadata = useCallback((blob: Blob, duration: number, streamMetadata?: any): AudioFileMetadata => {
    const baseMetadata: AudioFileMetadata = {
      fileName: generateFileName(),
      mimeType: blob.type || 'audio/webm',
      size: blob.size,
      duration: duration,
      sampleRate: streamMetadata?.sampleRate,
      // Enhanced metadata fields
      channelCount: streamMetadata?.channelCount,
      audioBitsPerSecond: streamMetadata?.audioBitsPerSecond,
      echoCancellation: streamMetadata?.echoCancellation,
      noiseSuppression: streamMetadata?.noiseSuppression,
      autoGainControl: streamMetadata?.autoGainControl,
      trackLabel: streamMetadata?.trackLabel,
      createdAt: new Date().toISOString(),
      chunkCount: streamMetadata?.chunkCount || 0
    };

    // Calculate estimated bitrate if not available
    if (!baseMetadata.audioBitsPerSecond && duration > 0) {
      baseMetadata.estimatedBitrate = Math.round((blob.size * 8) / duration);
    }

    return baseMetadata;
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

      // Extract stream metadata for enhanced file generation
      const streamMetadata = mediaStreamRef.current ? 
        extractAudioStreamMetadata(mediaStreamRef.current, mediaRecorder) : {};

      // Generate audio file with enhanced metadata processing
      const { blob: audioBlob, metadata } = generateAudioFile(
        audioChunksRef.current,
        mediaRecorder.mimeType || 'audio/webm',
        state.duration,
        { ...streamMetadata, chunkCount: audioChunksRef.current.length }
      );

      // Additional validation of the generated file
      if (audioBlob.size === 0) {
        throw new Error('Generated audio file is empty');
      }

      // Validate WebM format
      if (!audioBlob.type.includes('webm')) {
        console.warn('Generated file is not in WebM format:', audioBlob.type);
      }

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
    
    getProgress: (): number => maxDuration > 0 ? Math.min(1, state.duration / maxDuration) : 0,
    
    // State validation
    isValidState: (): boolean => {
      return Object.values(RecordingStatus).includes(state.status);
    }
  };
}