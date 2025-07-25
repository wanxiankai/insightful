"use client";

import { Button } from "@/components/ui/button";
import { RecordingStatus } from "@/types/recording";
import { Mic, Square, Loader2 } from "lucide-react";
import RecordingIndicator from "./RecordingIndicator";

export interface RecordingControlsProps {
  status: RecordingStatus;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

export default function RecordingControls({
  status,
  onStart,
  onStop,
  disabled = false,
  className = ""
}: RecordingControlsProps) {
  const isRecording = status === RecordingStatus.RECORDING;
  const isProcessing = status === RecordingStatus.PROCESSING;
  const isRequestingPermission = status === RecordingStatus.REQUESTING_PERMISSION;
  const isIdle = status === RecordingStatus.IDLE;
  const hasError = status === RecordingStatus.ERROR;

  // Determine if start button should be disabled
  const startDisabled = disabled || 
    isRecording || 
    isProcessing || 
    isRequestingPermission;

  // Determine if stop button should be disabled
  const stopDisabled = disabled || 
    !isRecording || 
    isProcessing;

  // Get button text and icon based on status
  const getStartButtonContent = () => {
    if (isRequestingPermission) {
      return (
        <>
          <Loader2 className="animate-spin" />
          请求权限中...
        </>
      );
    }
    
    return (
      <>
        <Mic />
        开始录制
      </>
    );
  };

  const getStopButtonContent = () => {
    if (isProcessing) {
      return (
        <>
          <Loader2 className="animate-spin" />
          处理中...
        </>
      );
    }
    
    return (
      <>
        <Square />
        停止录制
      </>
    );
  };

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
        {!isRecording && (
          <Button
            onClick={onStart}
            disabled={startDisabled}
            variant={hasError ? "outline" : "default"}
            size="lg"
            className="min-w-[120px]"
          >
            {getStartButtonContent()}
          </Button>
        )}

        {/* Stop Recording Button */}
        {isRecording && (
          <Button
            onClick={onStop}
            disabled={stopDisabled}
            variant="destructive"
            size="lg"
            className="min-w-[120px]"
          >
            {getStopButtonContent()}
          </Button>
        )}
      </div>
    </div>
  );
}