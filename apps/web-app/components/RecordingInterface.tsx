"use client";

import { RecordingStatus } from "@/types/recording";
import RecordingStateManager from "./RecordingStateManager";
import RecordingControls from "./RecordingControls";
import { cn } from "@/lib/utils";

export interface RecordingInterfaceProps {
  status: RecordingStatus;
  duration: number;
  error?: string | null;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function RecordingInterface({
  status,
  duration,
  error,
  onStart,
  onStop,
  disabled = false,
  className = "",
  children
}: RecordingInterfaceProps) {
  // Determine interface layout based on status
  const getLayoutConfig = () => {
    const isRecording = status === RecordingStatus.RECORDING;
    const isProcessing = status === RecordingStatus.PROCESSING;
    const isActive = isRecording || isProcessing;

    return {
      showStateManager: true,
      showControls: true,
      containerClass: cn(
        "space-y-6 transition-all duration-500",
        isActive && "transform scale-[1.02]"
      ),
      stateManagerClass: cn(
        "transition-all duration-300",
        isRecording && "shadow-lg shadow-red-500/20",
        isProcessing && "shadow-lg shadow-yellow-500/20"
      )
    };
  };

  const layout = getLayoutConfig();

  return (
    <div className={cn(layout.containerClass, className)}>
      {/* Recording State Manager */}
      {layout.showStateManager && (
        <RecordingStateManager
          status={status}
          duration={duration}
          error={error}
          className={layout.stateManagerClass}
        >
          {children}
        </RecordingStateManager>
      )}

      {/* Recording Controls */}
      {layout.showControls && (
        <div className="flex justify-center">
          <RecordingControls
            status={status}
            onStart={onStart}
            onStop={onStop}
            disabled={disabled}
            className="justify-center"
          />
        </div>
      )}

      {/* Status-specific additional UI */}
      {status === RecordingStatus.ERROR && error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
            错误详情
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 font-mono">
            {error}
          </p>
        </div>
      )}

      {/* Recording tips for idle state */}
      {status === RecordingStatus.IDLE && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            录制提示
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• 确保您的麦克风已连接并正常工作</li>
            <li>• 选择安静的环境进行录制</li>
            <li>• 录制时长最多30分钟</li>
            <li>• 支持的格式：WebM (Opus编码)</li>
          </ul>
        </div>
      )}

      {/* Success message for completed recording */}
      {status === RecordingStatus.STOPPED && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
            录制成功
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            您的录音已成功保存，时长 {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </p>
        </div>
      )}
    </div>
  );
}