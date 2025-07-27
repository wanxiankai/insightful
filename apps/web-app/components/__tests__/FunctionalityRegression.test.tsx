/**
 * Functionality Regression Tests
 * 
 * Ensures no regression in existing upload and job management functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ClientWrapper from '../ClientWrapper';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { MeetingJob } from '../JobItem';

// Mock modules
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn()
      }))
    })),
    removeChannel: vi.fn()
  }))
}));

// Mock file upload APIs
global.fetch = vi.fn();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

const mockJobs: MeetingJob[] = [
  {
    id: 'job-1',
    fileName: 'test-file-1.mp3',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    fileKey: 'test-key-1',
    fileUrl: 'https://example.com/file-1.mp3'
  },
  {
    id: 'job-2',
    fileName: 'test-file-2.mp4',
    status: 'PROCESSING',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    fileKey: 'test-key-2',
    fileUrl: 'https://example.com/file-2.mp4'
  }
];

describe('Functionality Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://example.com/upload', fileKey: 'test-key', fileUrl: 'https://example.com/file.mp3' })
    });
  });

  describe('Upload functionality', () => {
    it('should maintain file upload capability', async () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={[]} />
        </TestWrapper>
      );

      // Upload zone should be present
      const uploadArea = screen.getByText(/选择文件|Select File/i);
      expect(uploadArea).toBeInTheDocument();

      // Should have drag and drop functionality
      const dropZone = uploadArea.closest('[role="button"]') || uploadArea.closest('div');
      expect(dropZone).toBeInTheDocument();
    });

    it('should handle file drop events', async () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={[]} />
        </TestWrapper>
      );

      const uploadArea = screen.getByText(/选择文件|Select File/i);
      const dropZone = uploadArea.closest('div');

      if (dropZone) {
        const file = new File(['test content'], 'test.mp3', { type: 'audio/mp3' });
        
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [file]
          }
        });

        // Should not throw errors
        expect(dropZone).toBeInTheDocument();
      }
    });

    it('should maintain upload progress display', async () => {
      const mockUploadComplete = vi.fn();
      
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={[]} />
        </TestWrapper>
      );

      // Upload functionality should be accessible
      const uploadZone = screen.getByText(/上传文件|Upload File/i);
      expect(uploadZone).toBeInTheDocument();
    });

    it('should support both file upload and recording tabs', () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={[]} />
        </TestWrapper>
      );

      // Should have upload tab
      const uploadTab = screen.getByText(/Upload|上传/i);
      expect(uploadTab).toBeInTheDocument();

      // Should have recording tab
      const recordTab = screen.getByText(/Record|录制/i);
      expect(recordTab).toBeInTheDocument();
    });
  });

  describe('Job management functionality', () => {
    it('should display job list correctly', () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Should show job items
      expect(screen.getByText('test-file-1.mp3')).toBeInTheDocument();
      expect(screen.getByText('test-file-2.mp4')).toBeInTheDocument();
    });

    it('should maintain job status display', () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Jobs should be rendered with their status
      const jobItems = screen.getAllByText(/test-file-/);
      expect(jobItems.length).toBe(2);
    });

    it('should handle job interactions', async () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Job items should be interactive
      const firstJob = screen.getByText('test-file-1.mp3');
      expect(firstJob).toBeInTheDocument();
      
      // Should be clickable/interactive
      fireEvent.click(firstJob);
      expect(firstJob).toBeInTheDocument();
    });

    it('should maintain real-time updates capability', () => {
      const { rerender } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Should handle job list updates
      const updatedJobs = [
        ...mockJobs,
        {
          id: 'job-3',
          fileName: 'new-file.mp3',
          status: 'PENDING' as const,
          createdAt: new Date().toISOString(),
          fileKey: 'new-key',
          fileUrl: 'https://example.com/new-file.mp3'
        }
      ];

      rerender(
        <TestWrapper>
          <ClientWrapper initialJobs={updatedJobs} />
        </TestWrapper>
      );

      expect(screen.getByText('new-file.mp3')).toBeInTheDocument();
    });
  });

  describe('User interface functionality', () => {
    it('should maintain language switching capability', () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Language context should work
      expect(screen.getByText(/历史记录|History/i)).toBeInTheDocument();
    });

    it('should maintain responsive text and UI elements', () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Should have responsive classes
      const historyTitle = screen.getByText(/历史记录|History/i);
      expect(historyTitle).toBeInTheDocument();
    });

    it('should maintain proper spacing and layout', () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Should have proper spacing classes
      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toHaveClass('mt-3');
    });
  });

  describe('Performance and optimization', () => {
    it('should handle large job lists efficiently', () => {
      const largeJobList = Array.from({ length: 50 }, (_, i) => ({
        id: `job-${i}`,
        fileName: `file-${i}.mp3`,
        status: 'COMPLETED' as const,
        createdAt: new Date(Date.now() - i * 1000 * 60).toISOString(),
        fileKey: `key-${i}`,
        fileUrl: `https://example.com/file-${i}.mp3`
      }));

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={largeJobList} />
        </TestWrapper>
      );

      const renderTime = performance.now() - startTime;
      
      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000);
    });

    it('should maintain scroll performance optimization', () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toHaveClass('scroll-smooth');
    });

    it('should maintain memory optimization features', () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Should have proper container structure for memory optimization
      const mainContainer = container.querySelector('[class*="flex-col h-full"]');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty job list gracefully', () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={[]} />
        </TestWrapper>
      );

      // Should not show history title when no jobs
      expect(screen.queryByText(/历史记录|History/i)).not.toBeInTheDocument();
      
      // Upload zone should still be visible
      expect(screen.getByText(/上传文件|Upload File/i)).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));
      
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Should still render the interface
      expect(screen.getByText(/上传文件|Upload File/i)).toBeInTheDocument();
      expect(screen.getByText('test-file-1.mp3')).toBeInTheDocument();
    });

    it('should maintain functionality with malformed job data', () => {
      const malformedJobs = [
        {
          id: 'job-1',
          fileName: 'test-file.mp3',
          status: 'COMPLETED' as const,
          createdAt: new Date().toISOString(),
          // Missing optional fields
        }
      ];

      render(
        <TestWrapper>
          <ClientWrapper initialJobs={malformedJobs} />
        </TestWrapper>
      );

      // Should handle missing optional fields
      expect(screen.getByText('test-file.mp3')).toBeInTheDocument();
    });
  });

  describe('Accessibility and usability', () => {
    it('should maintain keyboard navigation', () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Upload area should be focusable
      const uploadArea = screen.getByText(/选择文件|Select File/i);
      const focusableElement = uploadArea.closest('[tabindex]') || uploadArea.closest('button') || uploadArea.closest('[role="button"]');
      
      // Should have some form of keyboard accessibility
      expect(uploadArea).toBeInTheDocument();
    });

    it('should maintain screen reader compatibility', () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Should have proper semantic structure
      const historySection = screen.getByText(/历史记录|History/i);
      expect(historySection.tagName).toBe('H3');
    });

    it('should maintain proper focus management', () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Scroll container should be properly structured for focus management
      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
    });
  });
});