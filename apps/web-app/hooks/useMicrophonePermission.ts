"use client";

import { useState, useCallback, useEffect } from 'react';
import { PermissionStatus, RECORDING_ERROR_CODES, RecordingErrorCode } from '@/types/recording';

interface PermissionState {
  status: PermissionStatus;
  error: string | null;
  isLoading: boolean;
}

interface PermissionError {
  code: RecordingErrorCode;
  message: string;
  details?: any;
}

interface UseMicrophonePermissionReturn {
  permissionState: PermissionState;
  requestPermission: () => Promise<boolean>;
  checkPermissionStatus: () => Promise<PermissionStatus>;
  clearError: () => void;
  mediaStream: MediaStream | null;
}

// Cache key for storing permission status in localStorage
const PERMISSION_CACHE_KEY = 'microphone_permission_status';
const PERMISSION_CACHE_EXPIRY = 'microphone_permission_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useMicrophonePermission(): UseMicrophonePermissionReturn {
  const [permissionState, setPermissionState] = useState<PermissionState>({
    status: PermissionStatus.UNKNOWN,
    error: null,
    isLoading: false
  });

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Helper function to update permission state
  const updatePermissionState = useCallback((updates: Partial<PermissionState>) => {
    setPermissionState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to handle permission errors
  const handlePermissionError = useCallback((error: PermissionError) => {
    console.error('Microphone Permission Error:', error);
    updatePermissionState({
      status: PermissionStatus.DENIED,
      error: `${error.code}: ${error.message}`,
      isLoading: false
    });
  }, [updatePermissionState]);

  // Cache permission status in localStorage
  const cachePermissionStatus = useCallback((status: PermissionStatus) => {
    try {
      const expiryTime = Date.now() + CACHE_DURATION;
      localStorage.setItem(PERMISSION_CACHE_KEY, status);
      localStorage.setItem(PERMISSION_CACHE_EXPIRY, expiryTime.toString());
    } catch (error) {
      console.warn('Failed to cache permission status:', error);
    }
  }, []);

  // Get cached permission status from localStorage
  const getCachedPermissionStatus = useCallback((): PermissionStatus | null => {
    try {
      const cachedStatus = localStorage.getItem(PERMISSION_CACHE_KEY);
      const expiryTime = localStorage.getItem(PERMISSION_CACHE_EXPIRY);
      
      if (!cachedStatus || !expiryTime) {
        return null;
      }

      const expiry = parseInt(expiryTime, 10);
      if (Date.now() > expiry) {
        // Cache expired, clear it
        localStorage.removeItem(PERMISSION_CACHE_KEY);
        localStorage.removeItem(PERMISSION_CACHE_EXPIRY);
        return null;
      }

      return cachedStatus as PermissionStatus;
    } catch (error) {
      console.warn('Failed to get cached permission status:', error);
      return null;
    }
  }, []);

  // Clear cached permission status
  const clearPermissionCache = useCallback(() => {
    try {
      localStorage.removeItem(PERMISSION_CACHE_KEY);
      localStorage.removeItem(PERMISSION_CACHE_EXPIRY);
    } catch (error) {
      console.warn('Failed to clear permission cache:', error);
    }
  }, []);

  // Check browser support for MediaDevices API
  const checkBrowserSupport = useCallback((): boolean => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      handlePermissionError({
        code: RECORDING_ERROR_CODES.UNSUPPORTED_BROWSER,
        message: 'MediaDevices API not supported in this browser'
      });
      return false;
    }

    if (!window.MediaRecorder) {
      handlePermissionError({
        code: RECORDING_ERROR_CODES.UNSUPPORTED_BROWSER,
        message: 'MediaRecorder API not supported in this browser'
      });
      return false;
    }

    return true;
  }, [handlePermissionError]);

  // Check permission status using Permissions API (if available)
  const checkPermissionWithAPI = useCallback(async (): Promise<PermissionStatus | null> => {
    if (!navigator.permissions || !navigator.permissions.query) {
      return null;
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      switch (result.state) {
        case 'granted':
          return PermissionStatus.GRANTED;
        case 'denied':
          return PermissionStatus.DENIED;
        case 'prompt':
          return PermissionStatus.PROMPT;
        default:
          return PermissionStatus.UNKNOWN;
      }
    } catch (error) {
      console.warn('Failed to query microphone permission:', error);
      return null;
    }
  }, []);

  // Check current permission status
  const checkPermissionStatus = useCallback(async (): Promise<PermissionStatus> => {
    if (!checkBrowserSupport()) {
      return PermissionStatus.DENIED;
    }

    updatePermissionState({ isLoading: true, error: null });

    try {
      // First, try to get cached status
      const cachedStatus = getCachedPermissionStatus();
      if (cachedStatus && cachedStatus !== PermissionStatus.UNKNOWN) {
        updatePermissionState({ 
          status: cachedStatus, 
          isLoading: false 
        });
        return cachedStatus;
      }

      // Try using Permissions API
      const apiStatus = await checkPermissionWithAPI();
      if (apiStatus) {
        cachePermissionStatus(apiStatus);
        updatePermissionState({ 
          status: apiStatus, 
          isLoading: false 
        });
        return apiStatus;
      }

      // Fallback: assume unknown status
      updatePermissionState({ 
        status: PermissionStatus.UNKNOWN, 
        isLoading: false 
      });
      return PermissionStatus.UNKNOWN;

    } catch (error: any) {
      handlePermissionError({
        code: RECORDING_ERROR_CODES.UNKNOWN_ERROR,
        message: `Failed to check permission status: ${error.message}`,
        details: error
      });
      return PermissionStatus.DENIED;
    }
  }, [
    checkBrowserSupport,
    updatePermissionState,
    getCachedPermissionStatus,
    checkPermissionWithAPI,
    cachePermissionStatus,
    handlePermissionError
  ]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!checkBrowserSupport()) {
      return false;
    }

    updatePermissionState({ 
      isLoading: true, 
      error: null,
      status: PermissionStatus.UNKNOWN
    });

    try {
      // Clean up existing stream if any
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }

      // Request access to microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Permission granted successfully
      setMediaStream(stream);
      cachePermissionStatus(PermissionStatus.GRANTED);
      updatePermissionState({
        status: PermissionStatus.GRANTED,
        isLoading: false,
        error: null
      });

      return true;

    } catch (error: any) {
      // Clear any cached permission status on error
      clearPermissionCache();

      let errorCode: RecordingErrorCode;
      let errorMessage: string;
      let permissionStatus: PermissionStatus;

      switch (error.name) {
        case 'NotAllowedError':
          errorCode = RECORDING_ERROR_CODES.PERMISSION_DENIED;
          errorMessage = 'Microphone access denied by user. Please allow microphone access in your browser settings.';
          permissionStatus = PermissionStatus.DENIED;
          break;
        
        case 'NotFoundError':
          errorCode = RECORDING_ERROR_CODES.DEVICE_NOT_FOUND;
          errorMessage = 'No microphone device found. Please connect a microphone and try again.';
          permissionStatus = PermissionStatus.DENIED;
          break;
        
        case 'NotReadableError':
          errorCode = RECORDING_ERROR_CODES.DEVICE_BUSY;
          errorMessage = 'Microphone is already in use by another application. Please close other applications using the microphone.';
          permissionStatus = PermissionStatus.DENIED;
          break;
        
        case 'OverconstrainedError':
          errorCode = RECORDING_ERROR_CODES.DEVICE_NOT_FOUND;
          errorMessage = 'Microphone does not meet the required constraints. Please try with a different microphone.';
          permissionStatus = PermissionStatus.DENIED;
          break;
        
        case 'SecurityError':
          errorCode = RECORDING_ERROR_CODES.PERMISSION_DENIED;
          errorMessage = 'Microphone access blocked due to security restrictions. Please ensure you are using HTTPS.';
          permissionStatus = PermissionStatus.DENIED;
          break;
        
        default:
          errorCode = RECORDING_ERROR_CODES.UNKNOWN_ERROR;
          errorMessage = `Failed to access microphone: ${error.message}`;
          permissionStatus = PermissionStatus.DENIED;
      }

      handlePermissionError({
        code: errorCode,
        message: errorMessage,
        details: error
      });

      // Cache the denied status
      cachePermissionStatus(permissionStatus);

      return false;
    }
  }, [
    checkBrowserSupport,
    updatePermissionState,
    mediaStream,
    cachePermissionStatus,
    clearPermissionCache,
    handlePermissionError
  ]);

  // Clear error state
  const clearError = useCallback(() => {
    updatePermissionState({ error: null });
  }, [updatePermissionState]);

  // Initialize permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  return {
    permissionState,
    requestPermission,
    checkPermissionStatus,
    clearError,
    mediaStream
  };
}