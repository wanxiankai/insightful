"use client";

import { useState, useEffect } from 'react';
import { browserCompatibility, CompatibilityResult } from '@/lib/browser-compatibility';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface BrowserCompatibilityWarningProps {
  onDismiss?: () => void;
  showOnPartialSupport?: boolean;
}

export default function BrowserCompatibilityWarning({
  onDismiss,
  showOnPartialSupport = true
}: BrowserCompatibilityWarningProps) {
  const { t } = useLanguage();
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const result = browserCompatibility.checkCompatibility();
    setCompatibility(result);

    // Show warning if browser is not fully supported
    const shouldShow = !result.isFullySupported && 
                      (showOnPartialSupport || !result.isPartiallySupported) &&
                      !isDismissed;
    
    setIsOpen(shouldShow);
  }, [showOnPartialSupport, isDismissed]);

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    // Open browser download page based on current browser
    const browserInfo = compatibility?.browserInfo;
    let upgradeUrl = 'https://browsehappy.com/';

    if (browserInfo) {
      switch (browserInfo.name) {
        case 'chrome':
          upgradeUrl = 'https://www.google.com/chrome/';
          break;
        case 'firefox':
          upgradeUrl = 'https://www.mozilla.org/firefox/';
          break;
        case 'safari':
          upgradeUrl = 'https://support.apple.com/downloads/safari';
          break;
        case 'edge':
          upgradeUrl = 'https://www.microsoft.com/edge';
          break;
      }
    }

    window.open(upgradeUrl, '_blank');
  };

  if (!compatibility || !isOpen) {
    return null;
  }

  const { browserInfo, missingFeatures, fallbackOptions, upgradeRecommendations } = compatibility;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            {t.recording.compatibilityWarning}
          </DialogTitle>
          <DialogDescription>
            {t.recording.limitedSupport}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Browser Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-1">{t.recording.currentBrowser}</h4>
            <p className="text-sm text-gray-600">
              {browserInfo.name} {browserInfo.version}
            </p>
          </div>

          {/* Missing Features */}
          {missingFeatures.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">{t.recording.missingFeatures}</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {missingFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {browserInfo.warnings.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">{t.recording.warnings}</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {browserInfo.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fallback Options */}
          {fallbackOptions.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">{t.recording.availableOptions}</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                {fallbackOptions.map((option, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {upgradeRecommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">{t.recording.recommendations}</h4>
              <ul className="text-sm text-green-600 space-y-1">
                {upgradeRecommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {upgradeRecommendations.length > 0 && (
              <Button 
                onClick={handleUpgrade}
                className="flex-1"
                variant="default"
              >
                {t.recording.upgradebrowser}
              </Button>
            )}
            <Button 
              onClick={handleDismiss}
              variant="outline"
              className="flex-1"
            >
              {t.recording.continueAnyway}
            </Button>
          </div>

          {/* Additional Help */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            {t.recording.technicalSupport}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for using browser compatibility in components
export function useBrowserCompatibility() {
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);

  useEffect(() => {
    const result = browserCompatibility.checkCompatibility();
    setCompatibility(result);
  }, []);

  return {
    compatibility,
    isSupported: compatibility?.isFullySupported ?? false,
    isPartiallySupported: compatibility?.isPartiallySupported ?? false,
    browserInfo: compatibility?.browserInfo,
    missingFeatures: compatibility?.missingFeatures ?? [],
    fallbackOptions: compatibility?.fallbackOptions ?? [],
    upgradeRecommendations: compatibility?.upgradeRecommendations ?? [],
    getBestMimeType: () => browserCompatibility.getBestSupportedMimeType(),
    getSupportedMimeTypes: () => browserCompatibility.getSupportedMimeTypes(),
    getUnsupportedMessage: () => browserCompatibility.getUnsupportedBrowserMessage()
  };
}