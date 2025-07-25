"use client";

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export interface RecordingTimerProps {
  duration: number; // Duration in seconds
  maxDuration: number; // Maximum duration in seconds
  isRecording: boolean;
  showProgress?: boolean;
  className?: string;
}

export default function RecordingTimer({
  duration,
  maxDuration,
  isRecording,
  showProgress = true,
  className = ""
}: RecordingTimerProps) {
  const [displayDuration, setDisplayDuration] = useState(duration);

  // Update display duration when prop changes
  useEffect(() => {
    setDisplayDuration(duration);
  }, [duration]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate remaining time
  const remainingTime = Math.max(0, maxDuration - displayDuration);
  const progress = Math.min(1, displayDuration / maxDuration);
  
  // Determine if we're approaching the time limit (last 5 minutes)
  const isApproachingLimit = remainingTime <= 300; // 5 minutes
  const isCritical = remainingTime <= 60; // 1 minute

  // Get appropriate styling based on time remaining
  const getTimerStyle = () => {
    if (isCritical) {
      return "text-red-600 font-bold";
    } else if (isApproachingLimit) {
      return "text-orange-600 font-semibold";
    } else {
      return "text-gray-700";
    }
  };

  // Get progress bar color
  const getProgressColor = () => {
    if (isCritical) {
      return "bg-red-500";
    } else if (isApproachingLimit) {
      return "bg-orange-500";
    } else {
      return "bg-blue-500";
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Timer Display */}
      <div className="flex items-center space-x-2">
        <Clock 
          className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''} ${getTimerStyle()}`} 
        />
        <span className={`text-2xl font-mono ${getTimerStyle()}`}>
          {formatTime(displayDuration)}
        </span>
        {maxDuration > 0 && (
          <span className="text-sm text-gray-500">
            / {formatTime(maxDuration)}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && maxDuration > 0 && (
        <div className="w-full max-w-xs">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          
          {/* Remaining Time Display */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>已录制</span>
            <span className={isApproachingLimit ? getTimerStyle() : ''}>
              剩余 {formatTime(remainingTime)}
            </span>
          </div>
        </div>
      )}

      {/* Warning Messages */}
      {isApproachingLimit && !isCritical && (
        <div className="text-xs text-orange-600 text-center">
          ⚠️ 录制时间即将达到上限
        </div>
      )}
      
      {isCritical && (
        <div className="text-xs text-red-600 text-center font-semibold animate-pulse">
          🚨 录制即将自动停止
        </div>
      )}
    </div>
  );
}