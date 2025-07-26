"use client";

import { useEffect, useState, useMemo, memo } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface RecordingTimerProps {
  duration: number; // Duration in seconds
  maxDuration: number; // Maximum duration in seconds
  isRecording: boolean;
  showProgress?: boolean;
  className?: string;
}

const RecordingTimer = memo(function RecordingTimer({
  duration,
  maxDuration,
  isRecording,
  showProgress = true,
  className = ""
}: RecordingTimerProps) {
  const { t } = useLanguage();
  const [displayDuration, setDisplayDuration] = useState(duration);

  // Update display duration when prop changes
  useEffect(() => {
    setDisplayDuration(duration);
  }, [duration]);

  // Memoized format time function to avoid recreation on every render
  const formatTime = useMemo(() => {
    return (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
  }, []);

  // Memoized calculations to avoid recalculation on every render
  const timeCalculations = useMemo(() => {
    const remainingTime = Math.max(0, maxDuration - displayDuration);
    const progress = Math.min(1, displayDuration / maxDuration);
    const isApproachingLimit = remainingTime <= 300; // 5 minutes
    const isCritical = remainingTime <= 60; // 1 minute
    
    return {
      remainingTime,
      progress,
      isApproachingLimit,
      isCritical
    };
  }, [displayDuration, maxDuration]);

  // Memoized styling functions to avoid recreation
  const timerStyle = useMemo(() => {
    if (timeCalculations.isCritical) {
      return "text-red-600 font-bold";
    } else if (timeCalculations.isApproachingLimit) {
      return "text-orange-600 font-semibold";
    } else {
      return "text-gray-700";
    }
  }, [timeCalculations.isCritical, timeCalculations.isApproachingLimit]);

  const progressColor = useMemo(() => {
    if (timeCalculations.isCritical) {
      return "bg-red-500";
    } else if (timeCalculations.isApproachingLimit) {
      return "bg-orange-500";
    } else {
      return "bg-blue-500";
    }
  }, [timeCalculations.isCritical, timeCalculations.isApproachingLimit]);

  // Memoized formatted times to avoid recalculation
  const formattedTimes = useMemo(() => ({
    current: formatTime(displayDuration),
    max: formatTime(maxDuration),
    remaining: formatTime(timeCalculations.remainingTime)
  }), [displayDuration, maxDuration, timeCalculations.remainingTime, formatTime]);

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Timer Display */}
      <div className="flex items-center space-x-2">
        <Clock 
          className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''} ${timerStyle}`} 
        />
        <span className={`text-2xl font-mono ${timerStyle}`}>
          {formattedTimes.current}
        </span>
        {maxDuration > 0 && (
          <span className="text-sm text-gray-500">
            / {formattedTimes.max}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && maxDuration > 0 && (
        <div className="w-full max-w-xs">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
              style={{ width: `${timeCalculations.progress * 100}%` }}
            />
          </div>
          
          {/* Remaining Time Display */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t.recording.recorded}</span>
            <span className={timeCalculations.isApproachingLimit ? timerStyle : ''}>
              {t.recording.remaining} {formattedTimes.remaining}
            </span>
          </div>
        </div>
      )}

      {/* Warning Messages */}
      {timeCalculations.isApproachingLimit && !timeCalculations.isCritical && (
        <div className="text-xs text-orange-600 text-center">
          {t.recording.approachingLimit}
        </div>
      )}
      
      {timeCalculations.isCritical && (
        <div className="text-xs text-red-600 text-center font-semibold animate-pulse">
          {t.recording.criticalLimit}
        </div>
      )}
    </div>
  );
});

export default RecordingTimer;