"use client";

import { RecordingStatus } from "@/types/recording";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecordingIndicatorProps {
  status: RecordingStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function RecordingIndicator({
  status,
  className = "",
  size = "md",
  showText = false
}: RecordingIndicatorProps) {
  const isRecording = status === RecordingStatus.RECORDING;
  const isProcessing = status === RecordingStatus.PROCESSING;
  const isRequestingPermission = status === RecordingStatus.REQUESTING_PERMISSION;
  const hasError = status === RecordingStatus.ERROR;
  const isIdle = status === RecordingStatus.IDLE;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "w-6 h-6",
      icon: "w-4 h-4",
      text: "text-xs"
    },
    md: {
      container: "w-8 h-8",
      icon: "w-5 h-5", 
      text: "text-sm"
    },
    lg: {
      container: "w-12 h-12",
      icon: "w-8 h-8",
      text: "text-base"
    }
  };

  const config = sizeConfig[size];

  // Get icon based on status
  const getIcon = () => {
    if (isProcessing || isRequestingPermission) {
      return <Loader2 className={cn(config.icon, "animate-spin")} />;
    }
    
    if (hasError) {
      return <MicOff className={config.icon} />;
    }
    
    return <Mic className={config.icon} />;
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case RecordingStatus.RECORDING:
        return "录制中";
      case RecordingStatus.PROCESSING:
        return "处理中";
      case RecordingStatus.REQUESTING_PERMISSION:
        return "请求权限";
      case RecordingStatus.ERROR:
        return "错误";
      case RecordingStatus.PAUSED:
        return "已暂停";
      case RecordingStatus.STOPPED:
        return "已停止";
      default:
        return "就绪";
    }
  };

  // Get container classes based on status
  const getContainerClasses = () => {
    const baseClasses = cn(
      "flex items-center justify-center rounded-full transition-all duration-300",
      config.container
    );

    if (isRecording) {
      return cn(
        baseClasses,
        "bg-red-500 text-white animate-recording-pulse shadow-lg shadow-red-500/50",
        "ring-4 ring-red-500/30"
      );
    }

    if (isProcessing || isRequestingPermission) {
      return cn(
        baseClasses,
        "bg-blue-500 text-white"
      );
    }

    if (hasError) {
      return cn(
        baseClasses,
        "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
      );
    }

    return cn(
      baseClasses,
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    );
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Recording indicator with pulsing animation */}
      <div className="relative">
        <div className={getContainerClasses()}>
          {getIcon()}
        </div>
        
        {/* Additional pulsing ring for recording state */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-recording-ping opacity-20" />
        )}
      </div>

      {/* Status text */}
      {showText && (
        <span className={cn(
          config.text,
          "font-medium transition-colors duration-300",
          isRecording && "text-red-600 dark:text-red-400",
          (isProcessing || isRequestingPermission) && "text-blue-600 dark:text-blue-400",
          hasError && "text-red-600 dark:text-red-400",
          isIdle && "text-gray-600 dark:text-gray-400"
        )}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}