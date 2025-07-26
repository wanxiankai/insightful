/**
 * Performance Monitor for Recording System
 * Tracks and reports performance metrics during recording operations
 */

export interface PerformanceMetrics {
  // Memory metrics
  memoryUsage: {
    totalSize: number;
    chunkCount: number;
    averageChunkSize: number;
    peakMemoryUsage: number;
  };
  
  // Timing metrics
  timing: {
    recordingStartTime: number;
    recordingDuration: number;
    processingTime: number;
    uploadTime: number;
  };
  
  // Performance metrics
  performance: {
    frameDrops: number;
    audioGaps: number;
    cpuUsage: number;
    renderTime: number;
  };
  
  // Browser metrics
  browser: {
    userAgent: string;
    memoryInfo?: any;
    connectionType?: string;
  };
}

export interface PerformanceThresholds {
  maxMemoryUsage: number; // bytes
  maxProcessingTime: number; // ms
  maxRenderTime: number; // ms
  maxFrameDrops: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  maxProcessingTime: 5000, // 5 seconds
  maxRenderTime: 16, // 16ms (60fps)
  maxFrameDrops: 10
};

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private thresholds: PerformanceThresholds;
  private startTime: number = 0;
  private peakMemory: number = 0;
  private frameDropCount: number = 0;
  private lastFrameTime: number = 0;
  private renderTimes: number[] = [];
  private isMonitoring: boolean = false;
  private performanceObserver?: PerformanceObserver;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.initializeBrowserMetrics();
    this.setupPerformanceObserver();
  }

  /**
   * Initialize browser-specific metrics
   */
  private initializeBrowserMetrics() {
    this.metrics.browser = {
      userAgent: navigator.userAgent,
      memoryInfo: (performance as any).memory,
      connectionType: (navigator as any).connection?.effectiveType
    };
  }

  /**
   * Setup performance observer for monitoring
   */
  private setupPerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure') {
              this.recordMeasurement(entry.name, entry.duration);
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  /**
   * Start monitoring recording performance
   */
  public startRecordingMonitoring(): void {
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.peakMemory = 0;
    this.frameDropCount = 0;
    this.renderTimes = [];
    
    this.metrics.timing = {
      recordingStartTime: this.startTime,
      recordingDuration: 0,
      processingTime: 0,
      uploadTime: 0
    };
    
    this.metrics.performance = {
      frameDrops: 0,
      audioGaps: 0,
      cpuUsage: 0,
      renderTime: 0
    };
    
    this.metrics.memoryUsage = {
      totalSize: 0,
      chunkCount: 0,
      averageChunkSize: 0,
      peakMemoryUsage: 0
    };

    // Start frame monitoring
    this.monitorFrameRate();
    
    console.log('Performance monitoring started');
  }

  /**
   * Stop monitoring and return final metrics
   */
  public stopRecordingMonitoring(): PerformanceMetrics {
    this.isMonitoring = false;
    
    if (this.metrics.timing) {
      this.metrics.timing.recordingDuration = performance.now() - this.startTime;
    }
    
    // Calculate average render time
    if (this.renderTimes.length > 0) {
      const avgRenderTime = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
      if (this.metrics.performance) {
        this.metrics.performance.renderTime = avgRenderTime;
      }
    }
    
    console.log('Performance monitoring stopped', this.metrics);
    return this.metrics as PerformanceMetrics;
  }

  /**
   * Update memory usage metrics
   */
  public updateMemoryMetrics(audioChunks: Blob[]): void {
    if (!this.isMonitoring) return;
    
    const totalSize = audioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const chunkCount = audioChunks.length;
    const averageChunkSize = chunkCount > 0 ? totalSize / chunkCount : 0;
    
    // Update peak memory usage
    if (totalSize > this.peakMemory) {
      this.peakMemory = totalSize;
    }
    
    this.metrics.memoryUsage = {
      totalSize,
      chunkCount,
      averageChunkSize,
      peakMemoryUsage: this.peakMemory
    };
    
    // Check memory threshold
    if (totalSize > this.thresholds.maxMemoryUsage) {
      console.warn('Memory usage exceeded threshold:', {
        current: totalSize,
        threshold: this.thresholds.maxMemoryUsage
      });
    }
  }

  /**
   * Record processing time for operations
   */
  public recordProcessingTime(operation: string, startTime: number): void {
    const duration = performance.now() - startTime;
    
    if (operation === 'audio-processing' && this.metrics.timing) {
      this.metrics.timing.processingTime = duration;
    } else if (operation === 'upload' && this.metrics.timing) {
      this.metrics.timing.uploadTime = duration;
    }
    
    // Check processing time threshold
    if (duration > this.thresholds.maxProcessingTime) {
      console.warn(`${operation} exceeded processing time threshold:`, {
        duration,
        threshold: this.thresholds.maxProcessingTime
      });
    }
    
    // Create performance mark for detailed analysis
    if (typeof performance.mark === 'function' && typeof performance.measure === 'function') {
      try {
        performance.mark(`${operation}-end`);
        
        // Check if start mark exists before measuring
        const marks = performance.getEntriesByName(`${operation}-start`, 'mark');
        if (marks.length > 0) {
          performance.measure(`${operation}-duration`, `${operation}-start`, `${operation}-end`);
        } else {
          // Create a measure without start mark
          performance.measure(`${operation}-duration`);
        }
      } catch (error) {
        // Silently handle performance API errors in test environments
        console.debug('Performance measurement failed:', error);
      }
    }
  }

  /**
   * Record a performance measurement
   */
  private recordMeasurement(name: string, duration: number): void {
    console.log(`Performance measurement: ${name} took ${duration.toFixed(2)}ms`);
  }

  /**
   * Monitor frame rate and detect drops
   */
  private monitorFrameRate(): void {
    if (!this.isMonitoring) return;
    
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const frameDuration = now - this.lastFrameTime;
      this.renderTimes.push(frameDuration);
      
      // Detect frame drops (assuming 60fps target = 16.67ms per frame)
      if (frameDuration > 33) { // More than 2 frames
        this.frameDropCount++;
        if (this.metrics.performance) {
          this.metrics.performance.frameDrops = this.frameDropCount;
        }
      }
      
      // Keep only recent render times (last 100 frames)
      if (this.renderTimes.length > 100) {
        this.renderTimes = this.renderTimes.slice(-100);
      }
    }
    
    this.lastFrameTime = now;
    
    // Continue monitoring
    if (this.isMonitoring) {
      requestAnimationFrame(() => this.monitorFrameRate());
    }
  }

  /**
   * Record audio gap detection
   */
  public recordAudioGap(): void {
    if (!this.isMonitoring || !this.metrics.performance) return;
    
    this.metrics.performance.audioGaps++;
    console.warn('Audio gap detected');
  }

  /**
   * Get current performance snapshot
   */
  public getPerformanceSnapshot(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  public isPerformanceAcceptable(): boolean {
    if (!this.metrics.memoryUsage || !this.metrics.performance) return true;
    
    const memoryAcceptable = this.metrics.memoryUsage.totalSize <= this.thresholds.maxMemoryUsage;
    const frameDropsAcceptable = this.metrics.performance.frameDrops <= this.thresholds.maxFrameDrops;
    const renderTimeAcceptable = this.renderTimes.length === 0 || 
      this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length <= this.thresholds.maxRenderTime;
    
    return memoryAcceptable && frameDropsAcceptable && renderTimeAcceptable;
  }

  /**
   * Get performance recommendations
   */
  public getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.metrics.memoryUsage || !this.metrics.performance) {
      return recommendations;
    }
    
    if (this.metrics.memoryUsage.totalSize > this.thresholds.maxMemoryUsage * 0.8) {
      recommendations.push('Consider reducing recording duration or quality to manage memory usage');
    }
    
    if (this.metrics.performance.frameDrops > this.thresholds.maxFrameDrops * 0.5) {
      recommendations.push('Frame drops detected - consider closing other applications');
    }
    
    const avgRenderTime = this.renderTimes.length > 0 
      ? this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length 
      : 0;
      
    if (avgRenderTime > this.thresholds.maxRenderTime) {
      recommendations.push('Slow rendering detected - consider reducing UI complexity');
    }
    
    if (this.metrics.performance.audioGaps > 0) {
      recommendations.push('Audio gaps detected - check microphone connection and system resources');
    }
    
    return recommendations;
  }

  /**
   * Export performance data for analysis
   */
  public exportPerformanceData(): string {
    return JSON.stringify({
      ...this.metrics,
      thresholds: this.thresholds,
      timestamp: new Date().toISOString(),
      recommendations: this.getPerformanceRecommendations()
    }, null, 2);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.isMonitoring = false;
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    // Clear performance marks
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks();
    }
    
    if (typeof performance.clearMeasures === 'function') {
      performance.clearMeasures();
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();