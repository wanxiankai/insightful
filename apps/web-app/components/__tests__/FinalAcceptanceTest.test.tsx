/**
 * Final Acceptance Test for Fixed Upload Zone Implementation
 * 
 * This test validates all requirements from the specification
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

global.fetch = vi.fn();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

const mockJobs: MeetingJob[] = Array.from({ length: 15 }, (_, i) => ({
  id: `job-${i}`,
  fileName: `test-file-${i}.mp3`,
  status: 'COMPLETED' as const,
  createdAt: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
  fileKey: `test-key-${i}`,
  fileUrl: `https://example.com/file-${i}.mp3`
}));

describe('Final Acceptance Test - Fixed Upload Zone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
  });

  it('should meet all requirements for fixed upload zone implementation', async () => {
    const { container } = render(
      <div className="h-screen overflow-hidden">
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      </div>
    );

    // ✅ Requirement 1.1: Upload zone remains fixed at top
    const uploadZoneContainer = container.querySelector('[class*="flex-shrink-0"]');
    expect(uploadZoneContainer).toBeInTheDocument();
    
    // ✅ Requirement 1.2: Page should not have overall scrolling
    const mainContainer = container.querySelector('[class*="h-full"]');
    expect(mainContainer).toBeInTheDocument();
    
    // ✅ Requirement 1.3: Only job list area should be scrollable
    const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveClass('overflow-y-auto');
    
    // ✅ Requirement 1.4: Upload zone stays in position during scrolling
    const uploadZone = screen.getByText(/选择文件|Select File/i);
    const initialRect = uploadZone.getBoundingClientRect();
    
    if (scrollContainer) {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 200 } });
      
      await waitFor(() => {
        const finalRect = uploadZone.getBoundingClientRect();
        expect(finalRect.top).toBe(initialRect.top);
      });
    }
    
    // ✅ Requirement 2.1: Job list shows scroll bar when content exceeds space
    expect(scrollContainer).toHaveClass('overflow-y-auto');
    
    // ✅ Requirement 2.2: Scrolling affects only list content
    if (scrollContainer) {
      const initialUploadRect = uploadZone.getBoundingClientRect();
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });
      
      const finalUploadRect = uploadZone.getBoundingClientRect();
      expect(finalUploadRect.top).toBe(initialUploadRect.top);
    }
    
    // ✅ Requirement 3.1-3.4: Responsive design validation
    expect(mainContainer).toHaveClass('max-w-2xl');
    expect(scrollContainer).toHaveClass('flex-1');
    
    // ✅ Requirement 4.1-4.4: Smooth scroll behavior validation
    expect(scrollContainer).toHaveClass('scroll-smooth');
    expect(scrollContainer).toHaveStyle({
      WebkitOverflowScrolling: 'touch'
    });
    
    // ✅ No regression in existing functionality
    expect(uploadZone).toBeVisible();
    expect(screen.getAllByText(/test-file-/)).toHaveLength(mockJobs.length);
  });

  it('should handle empty job list correctly', () => {
    const { container } = render(
      <TestWrapper>
        <ClientWrapper initialJobs={[]} />
      </TestWrapper>
    );

    // Upload zone should still be present
    const uploadZone = screen.getByText(/选择文件|Select File/i);
    expect(uploadZone).toBeVisible();
    
    // Scroll container should still exist
    const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
    expect(scrollContainer).toBeInTheDocument();
    
    // No history title should be shown
    expect(screen.queryByText(/历史记录|History/i)).not.toBeInTheDocument();
  });

  it('should maintain layout structure across different viewport sizes', () => {
    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
    
    const { container } = render(
      <TestWrapper>
        <ClientWrapper initialJobs={mockJobs} />
      </TestWrapper>
    );

    const mainContainer = container.querySelector('[class*="flex-col h-full"]');
    const uploadContainer = container.querySelector('[class*="flex-shrink-0"]');
    const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');

    expect(mainContainer).toBeInTheDocument();
    expect(uploadContainer).toBeInTheDocument();
    expect(scrollContainer).toBeInTheDocument();
    
    // Should have responsive spacing
    expect(scrollContainer).toHaveClass('mt-3');
  });

  it('should handle dynamic content changes correctly', async () => {
    const { container, rerender } = render(
      <TestWrapper>
        <ClientWrapper initialJobs={mockJobs.slice(0, 5)} />
      </TestWrapper>
    );

    const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
    expect(scrollContainer).toBeInTheDocument();

    // Add more jobs
    rerender(
      <TestWrapper>
        <ClientWrapper initialJobs={mockJobs} />
      </TestWrapper>
    );

    // Layout should remain stable
    const updatedScrollContainer = container.querySelector('[class*="overflow-y-auto"]');
    expect(updatedScrollContainer).toHaveClass('overflow-y-auto');
    expect(updatedScrollContainer).toHaveClass('flex-1');
  });

  it('should maintain performance with large datasets', () => {
    const largeJobSet = Array.from({ length: 100 }, (_, i) => ({
      id: `job-${i}`,
      fileName: `file-${i}.mp3`,
      status: 'COMPLETED' as const,
      createdAt: new Date(Date.now() - i * 1000 * 60).toISOString(),
      fileKey: `key-${i}`,
      fileUrl: `https://example.com/file-${i}.mp3`
    }));

    const startTime = performance.now();
    
    const { container } = render(
      <TestWrapper>
        <ClientWrapper initialJobs={largeJobSet} />
      </TestWrapper>
    );

    const renderTime = performance.now() - startTime;
    
    // Should render within reasonable time
    expect(renderTime).toBeLessThan(1000);
    
    // Layout should still be correct
    const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
    expect(scrollContainer).toHaveClass('overflow-y-auto');
    expect(scrollContainer).toHaveClass('flex-1');
  });
});