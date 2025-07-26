"use client";

import { Button } from "@/components/ui/button";
import { RecordingStatus } from "@/types/recording";
import { Mic, Square, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import RecordingIndicator from "./RecordingIndicator";
import { memo, useMemo, useCallback } from "react";

export interface RecordingControlsProps {
  status: RecordingStatus;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

const RecordingControls = memo(function RecordingControls({
  status,
  onStart,
  onStop,
  disabled = false,
  className = ""
}: RecordingControlsProps) {
  const { t } = useLanguage();
  
  // Memoized status calculations to avoid recalculation on every render
  const statusFlags = useMemo(() => ({
    isRecording: status === RecordingStatus.RECORDING,
    isProcessing: status === RecordingStatus.PROCESSING,
    isRequestingPermission: status === RecordingStatus.REQUESTING_PERMISSION,
    isIdle: status === RecordingStatus.IDLE,
    hasError: status === RecordingStatus.ERROR
  }), [status]);

  // Memoized button disabled states
  const buttonStates = useMemo(() => ({
    startDisabled: disabled || 
      statusFlags.isRecording || 
      statusFlags.isProcessing || 
      statusFlags.isRequestingPermission,
    stopDisabled: disabled || 
      !statusFlags.isRecording || 
      statusFlags.isProcessing
  }), [disabled, statusFlags]);

  // Memoized button content to avoid recreation
  const startButtonContent = useMemo(() => {
    if (statusFlags.isRequestingPermission) {
      return (
        <>
          <Loader2 className="animate-spin" />
          {t.recording.requestPermission}...
        </>
      );
    }
    
    return (
      <>
        <Mic />
        {t.recording.startRecording}
      </>
    );
  }, [statusFlags.isRequestingPermission, t.recording.requestPermission, t.recording.startRecording]);

  const stopButtonContent = useMemo(() => {
    if (statusFlags.isProcessing) {
      return (
        <>
          <Loader2 className="animate-spin" />
          {t.common.processing}...
        </>
      );
    }
    
    return (
      <>
        <Square />
        {t.recording.stopRecording}
      </>
    );
  }, [statusFlags.isProcessing, t.common.processing, t.recording.stopRecording]);

  // Memoized callbacks to prevent unnecessary re-renders of child components
  const handleStart = useCallback(() => {
    if (!buttonStates.startDisabled) {
      onStart();
    }
  }, [onStart, buttonStates.startDisabled]);

  const handleStop = useCallback(() => {
    if (!buttonStates.stopDisabled) {
      onStop();
    }
  }, [onStop, buttonStates.stopDisabled]);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Recording Status Indicator */}
      <RecordingIndicator 
        status={status} 
        size="lg" 
        showText={true}
        className="flex-shrink-0"
      />

      {/* Control Buttons */}
      <div className="flex gap-3">
        {/* Start Recording Button */}
        {!statusFlags.isRecording && (
          <Button
            onClick={handleStart}
            disabled={buttonStates.startDisabled}
            variant={statusFlags.hasError ? "outline" : "default"}
            size="lg"
            className="min-w-[120px]"
          >
            {startButtonContent}
          </Button>
        )}

        {/* Stop Recording Button */}
        {statusFlags.isRecording && (
          <Button
            onClick={handleStop}
            disabled={buttonStates.stopDisabled}
            variant="destructive"
            size="lg"
            className="min-w-[120px]"
          >
            {stopButtonContent}
          </Button>
        )}
      </div>
    </div>
  );
});

export default RecordingControls;