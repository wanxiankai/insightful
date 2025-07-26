"use client";

import { RecordingStatus } from "@/types/recording";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, Clock, Mic } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface RecordingStateManagerProps {
  status: RecordingStatus;
  duration: number;
  error?: string | null;
  className?: string;
  children?: React.ReactNode;
}

export default function RecordingStateManager({
  status,
  duration,
  error,
  className = "",
  children
}: RecordingStateManagerProps) {
  const { t } = useLanguage();
  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get state-specific styling and content
  const getStateConfig = () => {
    switch (status) {
      case RecordingStatus.IDLE:
        return {
          containerClass: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700",
          headerClass: "text-gray-700 dark:text-gray-300",
          icon: <Mic className="w-5 h-5 text-gray-500" />,
          title: t.recording.readyToRecord,
          subtitle: t.recording.clickToStart,
          showDuration: false
        };

      case RecordingStatus.REQUESTING_PERMISSION:
        return {
          containerClass: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
          headerClass: "text-blue-700 dark:text-blue-300",
          icon: <Clock className="w-5 h-5 text-blue-500 animate-spin" />,
          title: t.recording.requestingPermission,
          subtitle: t.recording.requestingMicAccess,
          showDuration: false
        };

      case RecordingStatus.RECORDING:
        return {
          containerClass: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
          headerClass: "text-red-700 dark:text-red-300",
          icon: <Mic className="w-5 h-5 text-red-500 animate-recording-pulse" />,
          title: t.recording.recordingInProgress,
          subtitle: t.recording.keepQuiet,
          showDuration: true
        };

      case RecordingStatus.PROCESSING:
        return {
          containerClass: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
          headerClass: "text-yellow-700 dark:text-yellow-300",
          icon: <Clock className="w-5 h-5 text-yellow-500 animate-spin" />,
          title: t.recording.processingAudio,
          subtitle: t.recording.processingFile,
          showDuration: true
        };

      case RecordingStatus.STOPPED:
        return {
          containerClass: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
          headerClass: "text-green-700 dark:text-green-300",
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          title: t.recording.recordingCompleted,
          subtitle: t.recording.recordingSaved,
          showDuration: true
        };

      case RecordingStatus.ERROR:
        return {
          containerClass: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
          headerClass: "text-red-700 dark:text-red-300",
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          title: t.recording.recordingError,
          subtitle: error || t.recording.errorOccurred,
          showDuration: false
        };

      default:
        return {
          containerClass: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700",
          headerClass: "text-gray-700 dark:text-gray-300",
          icon: <Mic className="w-5 h-5 text-gray-500" />,
          title: t.recording.unknownStatus,
          subtitle: t.recording.statusUnknown,
          showDuration: false
        };
    }
  };

  const config = getStateConfig();

  return (
    <div className={cn(
      "rounded-lg border-2 p-6 transition-all duration-300",
      config.containerClass,
      className
    )}>
      {/* State Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h3 className={cn("font-semibold text-lg", config.headerClass)}>
              {config.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Duration Display */}
        {config.showDuration && (
          <div className="text-right">
            <div className={cn("text-2xl font-mono font-bold", config.headerClass)}>
              {formatDuration(duration)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t.recording.recordingDuration}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar for Recording */}
      {status === RecordingStatus.RECORDING && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-1000 animate-recording-pulse"
              style={{ width: `${Math.min(100, (duration / 1800) * 100)}%` }} // 30 minutes max
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0:00</span>
            <span>30:00</span>
          </div>
        </div>
      )}

      {/* Loading Bar for Processing */}
      {status === RecordingStatus.PROCESSING && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="bg-yellow-500 h-2 rounded-full animate-pulse w-full" />
          </div>
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t.recording.processingPleaseWait}
          </div>
        </div>
      )}

      {/* Content Area */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}