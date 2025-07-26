/**
 * Recording Error Recovery Service
 * Handles error recovery, local caching, and device monitoring for audio recording
 */

import { RecordingRecoveryState, NetworkErrorInfo, RECORDING_ERROR_CODES } from '@/types/recording';

// Storage keys for recovery data
const RECOVERY_STORAGE_KEY = 'recording_recovery_data';
const NETWORK_STATE_KEY = 'recording_network_state';
const DEVICE_STATE_KEY = 'recording_device_state';

// Recovery data expiration time (1 hour)
const RECOVERY_DATA_EXPIRY = 60 * 60 * 1000;

export class RecordingErrorRecovery {
  private networkStateListeners: Set<(isOnline: boolean) => void> = new Set();
  private deviceStateListeners: Set<(isConnected: boolean) => void> = new Set();
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize network and device monitoring
   */
  private initializeMonitoring() {
    if (this.isMonitoring || typeof window === 'undefined') return;

    // Monitor network connectivity
    if (window.addEventListener) {
      window.addEventListener('online', this.handleNetworkOnline);
      window.addEventListener('offline', this.handleNetworkOffline);
    }

    // Monitor device changes
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);
    }

    this.isMonitoring = true;
  }

  /**
   * Clean up monitoring
   */
  public cleanup() {
    if (!this.isMonitoring || typeof window === 'undefined') return;

    if (window.removeEventListener) {
      window.removeEventListener('online', this.handleNetworkOnline);
      window.removeEventListener('offline', this.handleNetworkOffline);
    }

    if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
      navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange);
    }

    this.networkStateListeners.clear();
    this.deviceStateListeners.clear();
    this.isMonitoring = false;
  }

  /**
   * Handle network coming online
   */
  private handleNetworkOnline = () => {
    console.log('Network connection restored');
    this.updateNetworkState(true);
    this.notifyNetworkListeners(true);
  };

  /**
   * Handle network going offline
   */
  private handleNetworkOffline = () => {
    console.log('Network connection lost');
    this.updateNetworkState(false);
    this.notifyNetworkListeners(false);
  };

  /**
   * Handle device changes (microphone connect/disconnect)
   */
  private handleDeviceChange = async () => {
    console.log('Audio device change detected');
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const hasAudioInput = audioInputs.length > 0;
      
      this.updateDeviceState(hasAudioInput);
      this.notifyDeviceListeners(hasAudioInput);
      
      console.log('Audio input devices:', audioInputs.length);
    } catch (error) {
      console.error('Error checking device state:', error);
      this.notifyDeviceListeners(false);
    }
  };

  /**
   * Update network state in storage
   */
  private updateNetworkState(isOnline: boolean) {
    try {
      const networkState: NetworkErrorInfo = {
        isOnline,
        lastOnlineTime: isOnline ? new Date().toISOString() : this.getNetworkState()?.lastOnlineTime,
        retryCount: 0
      };

      localStorage.setItem(NETWORK_STATE_KEY, JSON.stringify(networkState));
    } catch (error) {
      console.warn('Failed to update network state:', error);
    }
  }

  /**
   * Update device state in storage
   */
  private updateDeviceState(isConnected: boolean) {
    try {
      const deviceState = {
        isConnected,
        lastConnectedTime: isConnected ? new Date().toISOString() : undefined,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(DEVICE_STATE_KEY, JSON.stringify(deviceState));
    } catch (error) {
      console.warn('Failed to update device state:', error);
    }
  }

  /**
   * Notify network state listeners
   */
  private notifyNetworkListeners(isOnline: boolean) {
    this.networkStateListeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });
  }

  /**
   * Notify device state listeners
   */
  private notifyDeviceListeners(isConnected: boolean) {
    this.deviceStateListeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error('Error in device state listener:', error);
      }
    });
  }

  /**
   * Save recording data for recovery
   */
  public saveRecoveryData(
    audioChunks: Blob[],
    duration: number,
    sessionId: string
  ): boolean {
    try {
      // Convert blobs to base64 for storage
      const chunksPromises = audioChunks.map(chunk => this.blobToBase64(chunk));
      
      Promise.all(chunksPromises).then(base64Chunks => {
        const recoveryData: RecordingRecoveryState = {
          hasRecoverableData: true,
          audioChunks: [], // Will be restored from base64
          duration,
          sessionId,
          timestamp: new Date().toISOString()
        };

        const storageData = {
          ...recoveryData,
          base64Chunks,
          expiryTime: Date.now() + RECOVERY_DATA_EXPIRY
        };

        localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(storageData));
        console.log('Recovery data saved:', { sessionId, duration, chunksCount: audioChunks.length });
      }).catch(error => {
        console.error('Failed to save recovery data:', error);
      });

      return true;
    } catch (error) {
      console.error('Failed to save recovery data:', error);
      return false;
    }
  }

  /**
   * Get saved recovery data
   */
  public getRecoveryData(): RecordingRecoveryState | null {
    try {
      const stored = localStorage.getItem(RECOVERY_STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Check if data has expired
      if (data.expiryTime && Date.now() > data.expiryTime) {
        this.clearRecoveryData();
        return null;
      }

      return {
        hasRecoverableData: data.hasRecoverableData,
        audioChunks: [], // Will be restored when needed
        duration: data.duration,
        sessionId: data.sessionId,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Failed to get recovery data:', error);
      return null;
    }
  }

  /**
   * Restore audio chunks from recovery data
   */
  public async restoreAudioChunks(): Promise<Blob[]> {
    try {
      const stored = localStorage.getItem(RECOVERY_STORAGE_KEY);
      if (!stored) return [];

      const data = JSON.parse(stored);
      if (!data.base64Chunks) return [];

      // Convert base64 back to blobs
      const chunks = await Promise.all(
        data.base64Chunks.map((base64: string) => this.base64ToBlob(base64))
      );

      return chunks;
    } catch (error) {
      console.error('Failed to restore audio chunks:', error);
      return [];
    }
  }

  /**
   * Clear recovery data
   */
  public clearRecoveryData(): void {
    try {
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
      console.log('Recovery data cleared');
    } catch (error) {
      console.warn('Failed to clear recovery data:', error);
    }
  }

  /**
   * Get current network state
   */
  public getNetworkState(): NetworkErrorInfo | null {
    try {
      const stored = localStorage.getItem(NETWORK_STATE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get network state:', error);
      return null;
    }
  }

  /**
   * Check if device is currently connected
   */
  public async checkDeviceConnection(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      return audioInputs.length > 0;
    } catch (error) {
      console.error('Failed to check device connection:', error);
      return false;
    }
  }

  /**
   * Monitor network connectivity changes
   */
  public onNetworkChange(listener: (isOnline: boolean) => void): () => void {
    this.networkStateListeners.add(listener);
    
    // Return cleanup function
    return () => {
      this.networkStateListeners.delete(listener);
    };
  }

  /**
   * Monitor device connectivity changes
   */
  public onDeviceChange(listener: (isConnected: boolean) => void): () => void {
    this.deviceStateListeners.add(listener);
    
    // Return cleanup function
    return () => {
      this.deviceStateListeners.delete(listener);
    };
  }

  /**
   * Check if recording can be recovered
   */
  public canRecover(): boolean {
    const recoveryData = this.getRecoveryData();
    return recoveryData?.hasRecoverableData === true;
  }

  /**
   * Get recovery suggestions based on error type
   */
  public getRecoverySuggestions(errorCode: string): string[] {
    const suggestions: string[] = [];

    switch (errorCode) {
      case RECORDING_ERROR_CODES.DEVICE_DISCONNECTED:
        suggestions.push('Please reconnect your microphone');
        suggestions.push('Check your device connections');
        if (this.canRecover()) {
          suggestions.push('Your recording data has been saved and can be recovered');
        }
        break;

      case RECORDING_ERROR_CODES.NETWORK_ERROR:
        suggestions.push('Check your internet connection');
        suggestions.push('Your recording will be saved locally until connection is restored');
        if (!navigator.onLine) {
          suggestions.push('You are currently offline');
        }
        break;

      case RECORDING_ERROR_CODES.RECORDING_INTERRUPTED:
        suggestions.push('Recording was interrupted unexpectedly');
        if (this.canRecover()) {
          suggestions.push('Click "Recover Recording" to restore your progress');
        }
        break;

      case RECORDING_ERROR_CODES.MEMORY_LIMIT_EXCEEDED:
        suggestions.push('Recording data exceeded memory limits');
        suggestions.push('Try recording shorter segments');
        suggestions.push('Clear browser cache and try again');
        break;

      default:
        suggestions.push('Please try recording again');
        if (this.canRecover()) {
          suggestions.push('Previous recording data is available for recovery');
        }
    }

    return suggestions;
  }

  /**
   * Convert blob to base64 for storage
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert base64 back to blob
   */
  private base64ToBlob(base64: string): Promise<Blob> {
    return new Promise((resolve) => {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/webm' });
      resolve(blob);
    });
  }

  /**
   * Check memory usage and warn if approaching limits
   */
  public checkMemoryUsage(audioChunks: Blob[]): { isNearLimit: boolean; totalSize: number } {
    const totalSize = audioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const memoryLimit = 100 * 1024 * 1024; // 100MB warning threshold
    
    return {
      isNearLimit: totalSize > memoryLimit,
      totalSize
    };
  }

  /**
   * Estimate storage space available
   */
  public async estimateStorageSpace(): Promise<{ available: number; used: number } | null> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          available: estimate.quota || 0,
          used: estimate.usage || 0
        };
      }
    } catch (error) {
      console.warn('Failed to estimate storage space:', error);
    }
    
    return null;
  }
}

// Create singleton instance
export const recordingErrorRecovery = new RecordingErrorRecovery();