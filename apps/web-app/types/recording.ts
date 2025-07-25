// Recording-related types and enums

export enum RecordingStatus {
  IDLE = 'idle',
  REQUESTING_PERMISSION = 'requesting_permission',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  PROCESSING = 'processing',
  ERROR = 'error'
}

export enum PermissionStatus {
  UNKNOWN = 'unknown',
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt'
}

export interface RecordingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: RecordingStatus;
  audioChunks: Blob[];
}

export interface AudioFileMetadata {
  fileName: string;
  mimeType: string;
  size: number;
  duration: number;
  sampleRate?: number;
  // Enhanced metadata fields
  channelCount?: number;
  audioBitsPerSecond?: number;
  estimatedBitrate?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  trackLabel?: string;
  createdAt?: string;
  chunkCount?: number;
}

export interface AudioRecorderState {
  status: RecordingStatus;
  duration: number;
  hasPermission: PermissionStatus;
  error: string | null;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  session: RecordingSession | null;
}

export interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, fileName: string, metadata: AudioFileMetadata) => Promise<void>;
  maxDuration?: number; // in seconds, default 30 minutes (1800 seconds)
  onError?: (error: string) => void;
  onStatusChange?: (status: RecordingStatus) => void;
}

export interface MediaRecorderConfig {
  mimeType: string;
  audioBitsPerSecond?: number;
}

export interface RecordingError {
  code: string;
  message: string;
  details?: any;
}

// Error codes for different recording scenarios
export const RECORDING_ERROR_CODES = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_BUSY: 'DEVICE_BUSY',
  RECORDING_FAILED: 'RECORDING_FAILED',
  UNSUPPORTED_BROWSER: 'UNSUPPORTED_BROWSER',
  NETWORK_ERROR: 'NETWORK_ERROR',
  STORAGE_FULL: 'STORAGE_FULL',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type RecordingErrorCode = typeof RECORDING_ERROR_CODES[keyof typeof RECORDING_ERROR_CODES];