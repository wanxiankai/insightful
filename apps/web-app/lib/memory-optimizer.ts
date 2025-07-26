/**
 * Memory Optimizer for Audio Recording
 * Manages memory usage and provides optimization strategies for audio data processing
 */

export interface MemoryStats {
  totalSize: number;
  chunkCount: number;
  averageChunkSize: number;
  compressionRatio?: number;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
}

export interface OptimizationStrategy {
  shouldCompress: boolean;
  shouldReduceQuality: boolean;
  shouldFlushChunks: boolean;
  maxChunkSize: number;
  compressionLevel: number;
}

export interface ChunkProcessingOptions {
  maxChunkSize: number;
  compressionEnabled: boolean;
  qualityReduction: boolean;
  memoryThreshold: number;
}

const DEFAULT_OPTIONS: ChunkProcessingOptions = {
  maxChunkSize: 1024 * 1024, // 1MB per chunk
  compressionEnabled: true,
  qualityReduction: false,
  memoryThreshold: 50 * 1024 * 1024 // 50MB threshold
};

export class MemoryOptimizer {
  private options: ChunkProcessingOptions;
  private processedChunks: Blob[] = [];
  private totalProcessedSize: number = 0;
  private compressionWorker?: Worker;
  private isOptimizing: boolean = false;

  constructor(options: Partial<ChunkProcessingOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initializeCompressionWorker();
  }

  /**
   * Initialize web worker for compression if available
   */
  private initializeCompressionWorker(): void {
    if (typeof Worker !== 'undefined') {
      try {
        // Create inline worker for audio compression
        const workerScript = `
          self.onmessage = function(e) {
            const { chunks, compressionLevel } = e.data;
            
            // Simple compression simulation (in real implementation, use actual compression)
            const compressedChunks = chunks.map(chunk => {
              // Simulate compression by reducing data (placeholder)
              return chunk;
            });
            
            self.postMessage({
              success: true,
              compressedChunks,
              originalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
              compressedSize: compressedChunks.reduce((sum, chunk) => sum + chunk.size, 0)
            });
          };
        `;
        
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        this.compressionWorker = new Worker(URL.createObjectURL(blob));
      } catch (error) {
        console.warn('Failed to initialize compression worker:', error);
      }
    }
  }

  /**
   * Analyze memory usage and determine optimization strategy
   */
  public analyzeMemoryUsage(audioChunks: Blob[]): MemoryStats {
    const totalSize = audioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const chunkCount = audioChunks.length;
    const averageChunkSize = chunkCount > 0 ? totalSize / chunkCount : 0;
    
    // Determine memory pressure level
    let memoryPressure: MemoryStats['memoryPressure'] = 'low';
    
    if (totalSize > this.options.memoryThreshold * 2) {
      memoryPressure = 'critical';
    } else if (totalSize > this.options.memoryThreshold * 1.5) {
      memoryPressure = 'high';
    } else if (totalSize > this.options.memoryThreshold) {
      memoryPressure = 'medium';
    }
    
    return {
      totalSize,
      chunkCount,
      averageChunkSize,
      memoryPressure
    };
  }

  /**
   * Get optimization strategy based on current memory usage
   */
  public getOptimizationStrategy(memoryStats: MemoryStats): OptimizationStrategy {
    const { memoryPressure, totalSize, averageChunkSize } = memoryStats;
    
    const strategy: OptimizationStrategy = {
      shouldCompress: false,
      shouldReduceQuality: false,
      shouldFlushChunks: false,
      maxChunkSize: this.options.maxChunkSize,
      compressionLevel: 1
    };
    
    switch (memoryPressure) {
      case 'critical':
        strategy.shouldCompress = true;
        strategy.shouldReduceQuality = true;
        strategy.shouldFlushChunks = true;
        strategy.maxChunkSize = this.options.maxChunkSize * 0.5;
        strategy.compressionLevel = 3;
        break;
        
      case 'high':
        strategy.shouldCompress = true;
        strategy.shouldFlushChunks = true;
        strategy.maxChunkSize = this.options.maxChunkSize * 0.75;
        strategy.compressionLevel = 2;
        break;
        
      case 'medium':
        strategy.shouldCompress = this.options.compressionEnabled;
        strategy.compressionLevel = 1;
        break;
        
      case 'low':
      default:
        // No optimization needed
        break;
    }
    
    // Adjust chunk size if chunks are too large
    if (averageChunkSize > this.options.maxChunkSize) {
      strategy.maxChunkSize = Math.min(strategy.maxChunkSize, averageChunkSize * 0.8);
    }
    
    return strategy;
  }

  /**
   * Optimize audio chunks based on strategy
   */
  public async optimizeChunks(
    audioChunks: Blob[], 
    strategy: OptimizationStrategy
  ): Promise<Blob[]> {
    if (this.isOptimizing) {
      console.warn('Optimization already in progress');
      return audioChunks;
    }
    
    this.isOptimizing = true;
    
    try {
      let optimizedChunks = [...audioChunks];
      
      // Apply chunk size optimization
      if (strategy.maxChunkSize < this.options.maxChunkSize) {
        optimizedChunks = await this.splitLargeChunks(optimizedChunks, strategy.maxChunkSize);
      }
      
      // Apply compression if needed
      if (strategy.shouldCompress && this.compressionWorker) {
        optimizedChunks = await this.compressChunks(optimizedChunks, strategy.compressionLevel);
      }
      
      // Apply quality reduction if needed
      if (strategy.shouldReduceQuality) {
        optimizedChunks = await this.reduceQuality(optimizedChunks);
      }
      
      // Flush processed chunks if needed
      if (strategy.shouldFlushChunks) {
        this.flushProcessedChunks();
      }
      
      return optimizedChunks;
      
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Split large chunks into smaller ones
   */
  private async splitLargeChunks(chunks: Blob[], maxSize: number): Promise<Blob[]> {
    const splitChunks: Blob[] = [];
    
    for (const chunk of chunks) {
      if (chunk.size <= maxSize) {
        splitChunks.push(chunk);
      } else {
        // Split large chunk into smaller pieces
        const buffer = await chunk.arrayBuffer();
        const chunkCount = Math.ceil(buffer.byteLength / maxSize);
        
        for (let i = 0; i < chunkCount; i++) {
          const start = i * maxSize;
          const end = Math.min(start + maxSize, buffer.byteLength);
          const subChunk = new Blob([buffer.slice(start, end)], { type: chunk.type });
          splitChunks.push(subChunk);
        }
      }
    }
    
    return splitChunks;
  }

  /**
   * Compress audio chunks using web worker
   */
  private async compressChunks(chunks: Blob[], compressionLevel: number): Promise<Blob[]> {
    if (!this.compressionWorker) {
      console.warn('Compression worker not available');
      return chunks;
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Compression timeout'));
      }, 30000); // 30 second timeout
      
      this.compressionWorker!.onmessage = (e) => {
        clearTimeout(timeout);
        const { success, compressedChunks, error } = e.data;
        
        if (success) {
          resolve(compressedChunks);
        } else {
          reject(new Error(error || 'Compression failed'));
        }
      };
      
      this.compressionWorker!.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
      
      // Send chunks for compression
      this.compressionWorker!.postMessage({
        chunks,
        compressionLevel
      });
    });
  }

  /**
   * Reduce audio quality to save memory
   */
  private async reduceQuality(chunks: Blob[]): Promise<Blob[]> {
    // This is a placeholder for quality reduction
    // In a real implementation, you would:
    // 1. Decode audio data
    // 2. Reduce sample rate or bit depth
    // 3. Re-encode with lower quality settings
    
    console.log('Quality reduction applied (placeholder)');
    return chunks;
  }

  /**
   * Flush processed chunks to free memory
   */
  private flushProcessedChunks(): void {
    this.processedChunks = [];
    this.totalProcessedSize = 0;
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    console.log('Processed chunks flushed');
  }

  /**
   * Monitor memory usage during recording
   */
  public monitorMemoryUsage(audioChunks: Blob[]): {
    shouldOptimize: boolean;
    strategy?: OptimizationStrategy;
    stats: MemoryStats;
  } {
    const stats = this.analyzeMemoryUsage(audioChunks);
    const shouldOptimize = stats.memoryPressure !== 'low';
    
    let strategy: OptimizationStrategy | undefined;
    if (shouldOptimize) {
      strategy = this.getOptimizationStrategy(stats);
    }
    
    return {
      shouldOptimize,
      strategy,
      stats
    };
  }

  /**
   * Get memory usage recommendations
   */
  public getMemoryRecommendations(stats: MemoryStats): string[] {
    const recommendations: string[] = [];
    
    switch (stats.memoryPressure) {
      case 'critical':
        recommendations.push('Critical memory usage - consider stopping recording');
        recommendations.push('Close other browser tabs and applications');
        recommendations.push('Reduce recording quality settings');
        break;
        
      case 'high':
        recommendations.push('High memory usage detected');
        recommendations.push('Consider reducing recording duration');
        recommendations.push('Enable compression to save memory');
        break;
        
      case 'medium':
        recommendations.push('Moderate memory usage');
        recommendations.push('Monitor memory levels during longer recordings');
        break;
        
      case 'low':
      default:
        recommendations.push('Memory usage is optimal');
        break;
    }
    
    if (stats.averageChunkSize > this.options.maxChunkSize) {
      recommendations.push('Large audio chunks detected - consider optimizing chunk size');
    }
    
    return recommendations;
  }

  /**
   * Estimate memory requirements for recording duration
   */
  public estimateMemoryRequirements(durationSeconds: number, bitrate: number = 128000): number {
    // Estimate based on bitrate and duration
    const bytesPerSecond = bitrate / 8; // Convert bits to bytes
    const estimatedSize = durationSeconds * bytesPerSecond;
    
    // Add overhead for chunk management and processing
    const overhead = estimatedSize * 0.2; // 20% overhead
    
    return estimatedSize + overhead;
  }

  /**
   * Check if system can handle estimated memory requirements
   */
  public async canHandleMemoryRequirements(estimatedSize: number): Promise<boolean> {
    try {
      // Check available storage quota
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const availableSpace = (estimate.quota || 0) - (estimate.usage || 0);
        
        if (estimatedSize > availableSpace * 0.8) { // Use 80% of available space
          return false;
        }
      }
      
      // Check memory info if available
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const availableMemory = memoryInfo.jsHeapSizeLimit - memoryInfo.usedJSHeapSize;
        
        if (estimatedSize > availableMemory * 0.6) { // Use 60% of available memory
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to check memory requirements:', error);
      return true; // Assume it's okay if we can't check
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.isOptimizing = false;
    this.flushProcessedChunks();
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = undefined;
    }
  }
}

// Create singleton instance
export const memoryOptimizer = new MemoryOptimizer();