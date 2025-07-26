"use client";

import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { RecordingStatus } from '@/types/recording';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AudioRecorderExample() {
  const { t } = useLanguage();
  const {
    status,
    duration,
    hasPermission,
    error,
    isRecording,
    canRecord,
    startRecording,
    stopRecording,
    requestPermission,
    formatDuration,
    getRemainingTime,
    getProgress,
    clearError
  } = useAudioRecorder({
    maxDuration: 300, // 5 minutes for demo
    onRecordingComplete: async (audioBlob, fileName, metadata) => {
      console.log('Recording completed:', { fileName, metadata });
      console.log('Audio blob size:', audioBlob.size);
    },
    onError: (error) => {
      console.error('Recording error:', error);
    },
    onStatusChange: (status) => {
      console.log('Status changed to:', status);
    }
  });

  const getStatusColor = () => {
    switch (status) {
      case RecordingStatus.RECORDING:
        return 'text-red-500';
      case RecordingStatus.PROCESSING:
        return 'text-yellow-500';
      case RecordingStatus.ERROR:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">{t.recording.demoTitle}</h2>
      
      {/* Status Display */}
      <div className="mb-4">
        <p className={`font-medium ${getStatusColor()}`}>
          {t.recording.status}: {status}
        </p>
        <p className="text-sm text-gray-600">
          {t.recording.duration}: {formatDuration(duration)}
        </p>
        <p className="text-sm text-gray-600">
          {t.recording.remaining}: {formatDuration(getRemainingTime())}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgress() * 100}%` }}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="text-sm">{error}</p>
          <button 
            onClick={clearError}
            className="mt-2 text-xs underline hover:no-underline"
          >
            {t.recording.clearError}
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-2">
        {!canRecord && hasPermission !== 'granted' && (
          <button
            onClick={requestPermission}
            disabled={status === RecordingStatus.REQUESTING_PERMISSION}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {status === RecordingStatus.REQUESTING_PERMISSION ? t.recording.requesting : t.recording.requestPermission}
          </button>
        )}

        {canRecord && (
          <button
            onClick={startRecording}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {t.recording.startRecording}
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            {t.recording.stopRecording}
          </button>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <p>{t.recording.permission}: {hasPermission}</p>
        <p>{t.recording.canRecord}: {canRecord ? t.recording.yes : t.recording.no}</p>
        <p>{t.recording.recording}: {isRecording ? t.recording.yes : t.recording.no}</p>
      </div>
    </div>
  );
}