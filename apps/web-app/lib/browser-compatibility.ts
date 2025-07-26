/**
 * Browser Compatibility Service
 * Handles browser compatibility detection and provides fallback solutions
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  supportedFeatures: SupportedFeatures;
  warnings: string[];
  recommendations: string[];
}

export interface SupportedFeatures {
  mediaRecorder: boolean;
  getUserMedia: boolean;
  webAudio: boolean;
  webRTC: boolean;
  localStorage: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
  webAssembly: boolean;
  audioWorklet: boolean;
  mediaDevices: boolean;
  permissions: boolean;
}

export interface CompatibilityResult {
  isFullySupported: boolean;
  isPartiallySupported: boolean;
  browserInfo: BrowserInfo;
  missingFeatures: string[];
  fallbackOptions: string[];
  upgradeRecommendations: string[];
}

// Minimum browser versions for full support
const MIN_BROWSER_VERSIONS = {
  chrome: 47,
  firefox: 25,
  safari: 14,
  edge: 79,
  opera: 36
};

// MediaRecorder MIME types by browser
const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav'
];

export class BrowserCompatibilityChecker {
  private browserInfo: BrowserInfo | null = null;

  /**
   * Get comprehensive browser compatibility information
   */
  public checkCompatibility(): CompatibilityResult {
    const browserInfo = this.getBrowserInfo();
    const missingFeatures = this.getMissingFeatures(browserInfo.supportedFeatures);
    const fallbackOptions = this.getFallbackOptions(missingFeatures);
    const upgradeRecommendations = this.getUpgradeRecommendations(browserInfo);

    const isFullySupported = missingFeatures.length === 0;
    const isPartiallySupported = browserInfo.supportedFeatures.mediaRecorder && 
                                browserInfo.supportedFeatures.getUserMedia;

    return {
      isFullySupported,
      isPartiallySupported,
      browserInfo,
      missingFeatures,
      fallbackOptions,
      upgradeRecommendations
    };
  }

  /**
   * Get detailed browser information
   */
  public getBrowserInfo(): BrowserInfo {
    if (this.browserInfo) {
      return this.browserInfo;
    }

    const userAgent = navigator.userAgent;
    const browserData = this.parseBrowserInfo(userAgent);
    const supportedFeatures = this.checkSupportedFeatures();
    const warnings = this.generateWarnings(browserData, supportedFeatures);
    const recommendations = this.generateRecommendations(browserData, supportedFeatures);

    this.browserInfo = {
      name: browserData.name,
      version: browserData.version,
      isSupported: this.isBrowserSupported(browserData, supportedFeatures),
      supportedFeatures,
      warnings,
      recommendations
    };

    return this.browserInfo;
  }

  /**
   * Parse browser information from user agent
   */
  private parseBrowserInfo(userAgent: string): { name: string; version: string; versionNumber: number } {
    let name = 'unknown';
    let version = '0';
    let versionNumber = 0;

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      if (match && match[1]) {
        version = match[1];
        versionNumber = parseInt(match[1], 10);
      }
    }
    // Edge (Chromium-based)
    else if (userAgent.includes('Edg')) {
      name = 'edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      if (match && match[1]) {
        version = match[1];
        versionNumber = parseInt(match[1], 10);
      }
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      name = 'firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      if (match && match[1]) {
        version = match[1];
        versionNumber = parseInt(match[1], 10);
      }
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'safari';
      const match = userAgent.match(/Version\/(\d+)/);
      if (match && match[1]) {
        version = match[1];
        versionNumber = parseInt(match[1], 10);
      }
    }
    // Opera
    else if (userAgent.includes('OPR')) {
      name = 'opera';
      const match = userAgent.match(/OPR\/(\d+)/);
      if (match && match[1]) {
        version = match[1];
        versionNumber = parseInt(match[1], 10);
      }
    }

    return { name, version, versionNumber };
  }

  /**
   * Check which features are supported
   */
  private checkSupportedFeatures(): SupportedFeatures {
    return {
      mediaRecorder: this.checkMediaRecorderSupport(),
      getUserMedia: this.checkGetUserMediaSupport(),
      webAudio: this.checkWebAudioSupport(),
      webRTC: this.checkWebRTCSupport(),
      localStorage: this.checkLocalStorageSupport(),
      indexedDB: this.checkIndexedDBSupport(),
      serviceWorker: this.checkServiceWorkerSupport(),
      webAssembly: this.checkWebAssemblySupport(),
      audioWorklet: this.checkAudioWorkletSupport(),
      mediaDevices: this.checkMediaDevicesSupport(),
      permissions: this.checkPermissionsSupport()
    };
  }

  /**
   * Check MediaRecorder API support
   */
  private checkMediaRecorderSupport(): boolean {
    if (!window.MediaRecorder) {
      return false;
    }

    // Check if any supported MIME type is available
    return SUPPORTED_MIME_TYPES.some(mimeType => 
      MediaRecorder.isTypeSupported(mimeType)
    );
  }

  /**
   * Check getUserMedia support
   */
  private checkGetUserMediaSupport(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check Web Audio API support
   */
  private checkWebAudioSupport(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  /**
   * Check WebRTC support
   */
  private checkWebRTCSupport(): boolean {
    return !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection);
  }

  /**
   * Check localStorage support
   */
  private checkLocalStorageSupport(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check IndexedDB support
   */
  private checkIndexedDBSupport(): boolean {
    return !!(window.indexedDB || (window as any).webkitIndexedDB);
  }

  /**
   * Check Service Worker support
   */
  private checkServiceWorkerSupport(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Check WebAssembly support
   */
  private checkWebAssemblySupport(): boolean {
    return typeof WebAssembly === 'object';
  }

  /**
   * Check AudioWorklet support
   */
  private checkAudioWorkletSupport(): boolean {
    return !!(window.AudioContext && AudioContext.prototype.audioWorklet);
  }

  /**
   * Check MediaDevices support
   */
  private checkMediaDevicesSupport(): boolean {
    return !!navigator.mediaDevices;
  }

  /**
   * Check Permissions API support
   */
  private checkPermissionsSupport(): boolean {
    return !!(navigator.permissions && navigator.permissions.query);
  }

  /**
   * Check if browser version meets minimum requirements
   */
  private isBrowserSupported(
    browserData: { name: string; versionNumber: number },
    features: SupportedFeatures
  ): boolean {
    const minVersion = MIN_BROWSER_VERSIONS[browserData.name as keyof typeof MIN_BROWSER_VERSIONS];
    const versionSupported = minVersion ? browserData.versionNumber >= minVersion : false;
    
    // Core features required for basic functionality
    const coreFeatures = features.mediaRecorder && features.getUserMedia;
    
    return versionSupported && coreFeatures;
  }

  /**
   * Generate warnings based on browser and feature support
   */
  private generateWarnings(
    browserData: { name: string; versionNumber: number },
    features: SupportedFeatures
  ): string[] {
    const warnings: string[] = [];

    if (!features.mediaRecorder) {
      warnings.push('MediaRecorder API is not supported - recording functionality will not work');
    }

    if (!features.getUserMedia) {
      warnings.push('getUserMedia API is not supported - microphone access will not work');
    }

    if (!features.localStorage) {
      warnings.push('localStorage is not available - settings and recovery data cannot be saved');
    }

    if (!features.permissions) {
      warnings.push('Permissions API is not supported - permission status detection may be limited');
    }

    // Browser-specific warnings
    if (browserData.name === 'safari' && browserData.versionNumber < 14) {
      warnings.push('Safari versions below 14 have limited MediaRecorder support');
    }

    if (browserData.name === 'firefox' && browserData.versionNumber < 29) {
      warnings.push('Firefox versions below 29 may have audio recording issues');
    }

    // Mobile browser warnings
    if (this.isMobileBrowser()) {
      warnings.push('Mobile browsers may have limited recording capabilities');
      warnings.push('Background recording may be interrupted by the system');
    }

    return warnings;
  }

  /**
   * Generate recommendations for better compatibility
   */
  private generateRecommendations(
    browserData: { name: string; versionNumber: number },
    features: SupportedFeatures
  ): string[] {
    const recommendations: string[] = [];

    if (!features.mediaRecorder || !features.getUserMedia) {
      recommendations.push('Please use a modern browser like Chrome, Firefox, or Edge');
      recommendations.push('Ensure your browser is updated to the latest version');
    }

    if (browserData.name === 'safari') {
      recommendations.push('For best results on Safari, use version 14 or later');
      recommendations.push('Enable microphone permissions in Safari settings');
    }

    if (browserData.name === 'firefox') {
      recommendations.push('Firefox users should enable media.recorder.enabled in about:config');
    }

    if (!features.localStorage) {
      recommendations.push('Enable cookies and local storage for full functionality');
    }

    if (this.isMobileBrowser()) {
      recommendations.push('Use desktop browser for best recording experience');
      recommendations.push('Keep the browser tab active during recording');
    }

    return recommendations;
  }

  /**
   * Get list of missing critical features
   */
  private getMissingFeatures(features: SupportedFeatures): string[] {
    const missing: string[] = [];

    if (!features.mediaRecorder) missing.push('MediaRecorder API');
    if (!features.getUserMedia) missing.push('getUserMedia API');
    if (!features.mediaDevices) missing.push('MediaDevices API');
    if (!features.localStorage) missing.push('localStorage');

    return missing;
  }

  /**
   * Get fallback options for missing features
   */
  private getFallbackOptions(missingFeatures: string[]): string[] {
    const fallbacks: string[] = [];

    if (missingFeatures.includes('MediaRecorder API')) {
      fallbacks.push('File upload is still available for pre-recorded audio');
      fallbacks.push('Use a supported browser for recording functionality');
    }

    if (missingFeatures.includes('getUserMedia API')) {
      fallbacks.push('Manual file upload can be used instead of recording');
    }

    if (missingFeatures.includes('localStorage')) {
      fallbacks.push('Settings will not persist between sessions');
      fallbacks.push('Recovery data will not be available');
    }

    return fallbacks;
  }

  /**
   * Get upgrade recommendations
   */
  private getUpgradeRecommendations(browserInfo: BrowserInfo): string[] {
    const recommendations: string[] = [];

    if (!browserInfo.isSupported) {
      recommendations.push('Upgrade to a modern browser version');
      
      switch (browserInfo.name) {
        case 'chrome':
          recommendations.push(`Chrome ${MIN_BROWSER_VERSIONS.chrome}+ is recommended`);
          break;
        case 'firefox':
          recommendations.push(`Firefox ${MIN_BROWSER_VERSIONS.firefox}+ is recommended`);
          break;
        case 'safari':
          recommendations.push(`Safari ${MIN_BROWSER_VERSIONS.safari}+ is recommended`);
          break;
        case 'edge':
          recommendations.push(`Edge ${MIN_BROWSER_VERSIONS.edge}+ is recommended`);
          break;
        default:
          recommendations.push('Use Chrome, Firefox, Safari, or Edge for best compatibility');
      }
    }

    return recommendations;
  }

  /**
   * Check if running on mobile browser
   */
  private isMobileBrowser(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Get best supported MIME type for current browser
   */
  public getBestSupportedMimeType(): string {
    for (const mimeType of SUPPORTED_MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return 'audio/webm'; // fallback
  }

  /**
   * Get all supported MIME types for current browser
   */
  public getSupportedMimeTypes(): string[] {
    return SUPPORTED_MIME_TYPES.filter(mimeType => 
      MediaRecorder.isTypeSupported(mimeType)
    );
  }

  /**
   * Check if specific feature is supported
   */
  public isFeatureSupported(feature: keyof SupportedFeatures): boolean {
    const features = this.checkSupportedFeatures();
    return features[feature];
  }

  /**
   * Get user-friendly error message for unsupported browser
   */
  public getUnsupportedBrowserMessage(): string {
    const browserInfo = this.getBrowserInfo();
    
    if (!browserInfo.supportedFeatures.mediaRecorder) {
      return `Your browser (${browserInfo.name} ${browserInfo.version}) does not support audio recording. Please use Chrome 47+, Firefox 25+, Safari 14+, or Edge 79+ for full functionality.`;
    }
    
    if (!browserInfo.supportedFeatures.getUserMedia) {
      return `Your browser does not support microphone access. Please update to a newer version or use a different browser.`;
    }
    
    return `Your browser has limited support for recording features. Some functionality may not work as expected.`;
  }

  /**
   * Clear cached browser info (useful for testing)
   */
  public clearCache(): void {
    this.browserInfo = null;
  }
}

// Create singleton instance
export const browserCompatibility = new BrowserCompatibilityChecker();