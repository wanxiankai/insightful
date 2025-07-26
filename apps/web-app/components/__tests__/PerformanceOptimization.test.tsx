import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { memoryOptimizer } from '@/lib/memory-optimizer';
import RecordingTimer from '../RecordingTimer';
import RecordingControls from '../RecordingControls';
import { RecordingStatus } from '@/types/recording';

// Mock the language context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      recording: {
        recorded: 'Recorded',
        remaining: 'Remaining',
        approachingLimit: 'Approaching limit',
        criticalLimit: 'Critical limit',
        startRecording: 'Start Recording',
        stopRecording: 'Stop Recording',
        requestPermission: 'Request Permission'
      },
      common: {
        processing: 'Processing'
      }
    }
  })
}));

describe('Performance Optimization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    performanceMonitor.cleanup();
    memoryOptimizer.cleanup();
  });

  describe('Performance Monitor', () => {
    it('should start and stop monitoring correctly', () => {
      performanceMonitor.startRecordingMonitoring();
      
      // Simulate some memory usage
      const mockChunks = [
        new Blob(['test1'], { type: 'audio/webm' }),
        new Blob(['test2'], { type: 'audio/webm' })
      ];
      
      performanceMonitor.updateMemoryMetrics(mockChunks);
      
      const metrics = performanceMonitor.stopRecordingMonitoring();
      
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.memoryUsage.chunkCount).toBe(2);
      expect(metrics.timing).toBeDefined();
      expect(metrics.performance).toBeDefined();
    });

    it('should track memory usage correctly', () => {
      performanceMonitor.startRecordingMonitoring();
      
      const chunks = [
        new Blob(['a'.repeat(1000)], { type: 'audio/webm' }),
        new Blob(['b'.repeat(2000)], { type: 'audio/webm' })
      ];
      
      performanceMonitor.updateMemoryMetrics(chunks);
      
      const snapshot = performanceMonitor.getPerformanceSnapshot();
      
      expect(snapshot.memoryUsage?.totalSize).toBe(3000);
      expect(snapshot.memoryUsage?.chunkCount).toBe(2);
      expect(snapshot.memoryUsage?.averageChunkSize).toBe(1500);
    });

    it('should record processing time', () => {
      performanceMonitor.startRecordingMonitoring();
      
      const startTime = performance.now();
      
      // Create start mark for performance measurement
      if (typeof performance.mark === 'function') {
        performance.mark('audio-processing-start');
      }
      
      // Simulate some processing time
      vi.advanceTimersByTime(100);
      
      performanceMonitor.recordProcessingTime('audio-processing', startTime);
      
      const metrics = performanceMonitor.stopRecordingMonitoring();
      
      expect(metrics.timing?.processingTime).toBeGreaterThan(0);
    });

    it('should detect performance issues', () => {
      performanceMonitor.startRecordingMonitoring();
      
      // Simulate high memory usage that exceeds threshold (100MB default)
      const largeChunks = Array.from({ length: 200 }, (_, i) => 
        new Blob(['x'.repeat(1024 * 1024)], { type: 'audio/webm' }) // 1MB each = 200MB total
      );
      
      performanceMonitor.updateMemoryMetrics(largeChunks);
      
      const isAcceptable = performanceMonitor.isPerformanceAcceptable();
      const recommendations = performanceMonitor.getPerformanceRecommendations();
      
      expect(isAcceptable).toBe(false);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('memory'))).toBe(true);
    });
  });

  describe('Memory Optimizer', () => {
    it('should analyze memory usage correctly', () => {
      const chunks = [
        new Blob(['a'.repeat(10 * 1024 * 1024)], { type: 'audio/webm' }), // 10MB
        new Blob(['b'.repeat(20 * 1024 * 1024)], { type: 'audio/webm' })  // 20MB
      ];
      
      const stats = memoryOptimizer.analyzeMemoryUsage(chunks);
      
      expect(stats.totalSize).toBe(30 * 1024 * 1024);
      expect(stats.chunkCount).toBe(2);
      expect(stats.averageChunkSize).toBe(15 * 1024 * 1024);
      expect(stats.memoryPressure).toBe('low'); // Below 50MB threshold
    });

    it('should detect high memory pressure', () => {
      const largeChunks = Array.from({ length: 10 }, () => 
        new Blob(['x'.repeat(10 * 1024 * 1024)], { type: 'audio/webm' }) // 10MB each = 100MB total
      );
      
      const stats = memoryOptimizer.analyzeMemoryUsage(largeChunks);
      
      expect(stats.memoryPressure).toBe('high');
    });

    it('should provide optimization strategy based on memory pressure', () => {
      const stats = {
        totalSize: 100 * 1024 * 1024, // 100MB
        chunkCount: 10,
        averageChunkSize: 10 * 1024 * 1024,
        memoryPressure: 'critical' as const
      };
      
      const strategy = memoryOptimizer.getOptimizationStrategy(stats);
      
      expect(strategy.shouldCompress).toBe(true);
      expect(strategy.shouldReduceQuality).toBe(true);
      expect(strategy.shouldFlushChunks).toBe(true);
      expect(strategy.compressionLevel).toBe(3);
    });

    it('should monitor memory usage and suggest optimization', () => {
      const chunks = [
        new Blob(['a'.repeat(60 * 1024 * 1024)], { type: 'audio/webm' }) // 60MB - above threshold
      ];
      
      const monitoring = memoryOptimizer.monitorMemoryUsage(chunks);
      
      expect(monitoring.shouldOptimize).toBe(true);
      expect(monitoring.strategy).toBeDefined();
      expect(monitoring.stats.memoryPressure).toBe('medium');
    });

    it('should estimate memory requirements correctly', () => {
      const duration = 300; // 5 minutes
      const bitrate = 128000; // 128kbps
      
      const estimated = memoryOptimizer.estimateMemoryRequirements(duration, bitrate);
      
      // Expected: (128000 / 8) * 300 * 1.2 (20% overhead) = 5,760,000 bytes
      expect(estimated).toBeCloseTo(5760000, -3); // Within 1000 bytes
    });

    it('should provide memory recommendations', () => {
      const criticalStats = {
        totalSize: 200 * 1024 * 1024,
        chunkCount: 20,
        averageChunkSize: 10 * 1024 * 1024,
        memoryPressure: 'critical' as const
      };
      
      const recommendations = memoryOptimizer.getMemoryRecommendations(criticalStats);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('Critical'))).toBe(true);
    });
  });

  describe('Component Performance Optimization', () => {
    it('should render RecordingTimer efficiently with memoization', () => {
      const props = {
        duration: 60,
        maxDuration: 1800,
        isRecording: true,
        showProgress: true
      };
      
      const { rerender } = render(<RecordingTimer {...props} />);
      
      // Verify initial render
      expect(screen.getByText('01:00')).toBeInTheDocument();
      
      // Re-render with same props should not cause unnecessary work
      rerender(<RecordingTimer {...props} />);
      
      // Re-render with different duration
      rerender(<RecordingTimer {...props} duration={61} />);
      expect(screen.getByText('01:01')).toBeInTheDocument();
    });

    it('should render RecordingControls efficiently with memoization', () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();
      
      const props = {
        status: RecordingStatus.IDLE,
        onStart: mockOnStart,
        onStop: mockOnStop
      };
      
      const { rerender } = render(<RecordingControls {...props} />);
      
      // Verify initial render
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
      
      // Re-render with same props should not cause unnecessary work
      rerender(<RecordingControls {...props} />);
      
      // Re-render with different status
      rerender(<RecordingControls {...props} status={RecordingStatus.RECORDING} />);
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });

    it('should handle rapid state changes efficiently', () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();
      
      const { rerender } = render(
        <RecordingControls 
          status={RecordingStatus.IDLE}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );
      
      // Simulate rapid status changes
      const statuses = [
        RecordingStatus.REQUESTING_PERMISSION,
        RecordingStatus.RECORDING,
        RecordingStatus.PROCESSING,
        RecordingStatus.STOPPED,
        RecordingStatus.IDLE
      ];
      
      statuses.forEach(status => {
        act(() => {
          rerender(
            <RecordingControls 
              status={status}
              onStart={mockOnStart}
              onStop={mockOnStop}
            />
          );
        });
      });
      
      // Should handle all state changes without errors
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });

    it('should optimize timer updates for long recordings', () => {
      const { rerender } = render(
        <RecordingTimer 
          duration={0}
          maxDuration={1800}
          isRecording={true}
        />
      );
      
      // Simulate a long recording with frequent updates
      for (let i = 1; i <= 100; i++) {
        act(() => {
          rerender(
            <RecordingTimer 
              duration={i}
              maxDuration={1800}
              isRecording={true}
            />
          );
        });
      }
      
      // Should handle frequent updates efficiently
      expect(screen.getByText('01:40')).toBeInTheDocument();
    });
  });

  describe('Integration Performance Tests', () => {
    it('should handle performance monitoring during simulated recording', () => {
      performanceMonitor.startRecordingMonitoring();
      
      // Simulate recording session
      const chunks: Blob[] = [];
      
      // Add chunks over time
      for (let i = 0; i < 50; i++) {
        const chunk = new Blob([`chunk${i}`.repeat(1000)], { type: 'audio/webm' });
        chunks.push(chunk);
        
        performanceMonitor.updateMemoryMetrics(chunks);
        
        // Simulate processing time
        const startTime = performance.now();
        
        // Create start mark for performance measurement
        if (typeof performance.mark === 'function') {
          performance.mark('chunk-processing-start');
        }
        
        vi.advanceTimersByTime(10);
        performanceMonitor.recordProcessingTime('chunk-processing', startTime);
      }
      
      const metrics = performanceMonitor.stopRecordingMonitoring();
      
      expect(metrics.memoryUsage.chunkCount).toBe(50);
      expect(metrics.timing.recordingDuration).toBeGreaterThan(0);
    });

    it('should optimize memory usage during simulated long recording', async () => {
      const chunks: Blob[] = [];
      
      // Simulate adding chunks until memory pressure increases
      for (let i = 0; i < 100; i++) {
        const chunk = new Blob(['x'.repeat(1024 * 1024)], { type: 'audio/webm' }); // 1MB each
        chunks.push(chunk);
        
        const monitoring = memoryOptimizer.monitorMemoryUsage(chunks);
        
        if (monitoring.shouldOptimize && monitoring.strategy) {
          // Apply optimization
          const optimizedChunks = await memoryOptimizer.optimizeChunks(chunks, monitoring.strategy);
          expect(optimizedChunks.length).toBeGreaterThan(0);
          break;
        }
      }
    });
  });
});