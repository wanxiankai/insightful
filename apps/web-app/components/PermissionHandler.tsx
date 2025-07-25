"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { PermissionStatus, RECORDING_ERROR_CODES } from '@/types/recording';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mic, MicOff, AlertCircle, Settings, RefreshCw } from 'lucide-react';

interface PermissionHandlerProps {
  hasPermission: PermissionStatus;
  onRequestPermission: () => void;
  error?: string | null;
  isLoading?: boolean;
}

export function PermissionHandler({
  hasPermission,
  onRequestPermission,
  error,
  isLoading = false
}: PermissionHandlerProps) {
  const { t } = useLanguage();

  // Helper function to get error-specific guidance
  const getErrorGuidance = (errorMessage: string | null) => {
    if (!errorMessage) return null;

    if (errorMessage.includes(RECORDING_ERROR_CODES.PERMISSION_DENIED)) {
      return {
        title: t.recording.permissionDenied,
        description: t.recording.permissionDeniedDesc,
        instructions: t.recording.permissionInstructions,
        actionText: t.recording.openSettings,
        actionIcon: Settings,
        showRetry: true
      };
    }

    if (errorMessage.includes(RECORDING_ERROR_CODES.DEVICE_NOT_FOUND)) {
      return {
        title: t.recording.deviceNotFound,
        description: t.recording.deviceNotFoundDesc,
        instructions: t.recording.checkMicrophone,
        actionText: t.recording.checkMicrophone,
        actionIcon: Mic,
        showRetry: true
      };
    }

    if (errorMessage.includes(RECORDING_ERROR_CODES.DEVICE_BUSY)) {
      return {
        title: t.recording.deviceBusy,
        description: t.recording.deviceBusyDesc,
        instructions: t.recording.closeOtherApps,
        actionText: t.recording.closeOtherApps,
        actionIcon: RefreshCw,
        showRetry: true
      };
    }

    if (errorMessage.includes(RECORDING_ERROR_CODES.UNSUPPORTED_BROWSER)) {
      return {
        title: t.recording.unsupportedBrowser,
        description: t.recording.unsupportedBrowserDesc,
        instructions: t.recording.upgradebrowser,
        actionText: t.recording.upgradebrowser,
        actionIcon: AlertCircle,
        showRetry: false
      };
    }

    // Generic error
    return {
      title: t.common.error,
      description: errorMessage,
      instructions: t.recording.tryAgain,
      actionText: t.recording.tryAgain,
      actionIcon: RefreshCw,
      showRetry: true
    };
  };

  // Render permission request UI
  if (hasPermission === PermissionStatus.UNKNOWN || hasPermission === PermissionStatus.PROMPT) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
          <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t.recording.permissionRequired}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
          {t.recording.permissionInstructions}
        </p>
        
        <Button
          onClick={onRequestPermission}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t.common.loading}
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              {t.recording.requestPermission}
            </>
          )}
        </Button>
      </div>
    );
  }

  // Render permission granted UI (minimal, just shows status)
  if (hasPermission === PermissionStatus.GRANTED && !error) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Mic className="w-4 h-4" />
        <span>{t.recording.permissionGranted}</span>
      </div>
    );
  }

  // Render permission denied or error UI
  if (hasPermission === PermissionStatus.DENIED || error) {
    const guidance = getErrorGuidance(error);
    
    if (!guidance) {
      return null;
    }

    const ActionIcon = guidance.actionIcon;

    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-center w-16 h-16 mb-4 bg-red-100 dark:bg-red-900 rounded-full">
          <MicOff className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          {guidance.title}
        </h3>
        
        <p className="text-sm text-red-700 dark:text-red-300 text-center mb-4 max-w-md">
          {guidance.description}
        </p>
        
        <div className="bg-red-100 dark:bg-red-900/50 rounded-md p-3 mb-6 max-w-md">
          <p className="text-xs text-red-800 dark:text-red-200 text-center">
            {guidance.instructions}
          </p>
        </div>
        
        <div className="flex gap-3">
          {guidance.showRetry && (
            <Button
              onClick={onRequestPermission}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {t.recording.tryAgain}
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={() => {
              // Open browser settings or provide guidance
              if (guidance.actionText === t.recording.openSettings) {
                // For Chrome/Edge
                if (navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge')) {
                  window.open('chrome://settings/content/microphone', '_blank');
                }
                // For Firefox
                else if (navigator.userAgent.includes('Firefox')) {
                  alert('请在地址栏输入 about:preferences#privacy 并找到"权限"部分来管理麦克风权限');
                }
                // For Safari
                else if (navigator.userAgent.includes('Safari')) {
                  alert('请在Safari菜单中选择"偏好设置" > "网站" > "麦克风"来管理权限');
                }
                else {
                  alert('请在浏览器设置中找到隐私或权限设置，允许此网站访问麦克风');
                }
              }
            }}
            variant="default"
            className="flex items-center gap-2"
          >
            <ActionIcon className="w-4 h-4" />
            {guidance.actionText}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}