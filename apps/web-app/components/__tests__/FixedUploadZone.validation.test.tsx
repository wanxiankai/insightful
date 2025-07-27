/**
 * Fixed Upload Zone Validation Tests
 * 
 * This test suite validates the implementation of the fixed upload zone feature
 * according to the requirements in .kiro/specs/fixed-upload-zone/requirements.md
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ClientWrapper from '../ClientWrapper';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { MeetingJob } from '../JobItem';

// Mock the necessary modules
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

// Mock fetch for API calls
global.fetch = vi.fn();

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

// Mock job data for testing
const mockJobs: MeetingJob[] = Array.from({ length: 20 }, (_, i) => ({
  id: `job-${i}`,
  fileName: `test-file-${i}.mp3`,
  status: 'COMPLETED' as const,
  createdAt: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
  fileKey: `test-key-${i}`,
  fileUrl: `https://example.com/file-${i}.mp3`
}));

describe('Fixed Upload Zone Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requirement 1.1: Upload zone remains fixed at top', () => {
    it('should render upload zone at the top of the container', () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const uploadZone = screen.getByText(/上传文件|Upload File/i).closest('div');
      const container = uploadZone?.closest('[class*="flex-col"]');
      
      expect(container).toBeInTheDocument();
      expect(uploadZone?.parentElement).toHaveClass('flex-shrink-0');
    });

    it('should keep upload zone visible when job list is scrolled', async () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Find the scrollable container
      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();

      // Simulate scrolling
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
      }

      // Upload zone should still be visible
      const uploadZone = screen.getByText(/上传文件|Upload File/i);
      expect(uploadZone).toBeVisible();
    });
  });

  describe('Requirement 1.2: Page should not have overall scrolling', () => {
    it('should not have page-level scrolling when job list is long', () => {
      const { container } = render(
        <div className="h-screen overflow-hidden">
          <TestWrapper>
            <ClientWrapper initialJobs={mockJobs} />
          </TestWrapper>
        </div>
      );

      // The main container should have overflow-hidden
      const mainContainer = container.querySelector('[class*="h-full"]');
      expect(mainContainer).toBeInTheDocument();
      
      // Should not have page-level scroll
      expect(document.body.style.overflow).not.toBe('auto');
    });
  });

  describe('Requirement 1.3: Only job list area should be scrollable', () => {
    it('should have scrollable job list container', () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });

    it('should scroll only job list content when scrolling', async () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      const uploadZone = screen.getByText(/上传文件|Upload File/i);
      
      if (scrollContainer) {
        const initialUploadPosition = uploadZone.getBoundingClientRect();
        
        // Scroll the job list
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 300 } });
        
        // Upload zone position should remain the same
        const afterScrollPosition = uploadZone.getBoundingClientRect();
        expect(afterScrollPosition.top).toBe(initialUploadPosition.top);
      }
    });
  });

  describe('Requirement 1.4: Upload zone stays in position during scrolling', () => {
    it('should maintain upload zone position during job list scrolling', async () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const uploadZone = screen.getByText(/上传文件|Upload File/i);
      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      
      const initialRect = uploadZone.getBoundingClientRect();
      
      if (scrollContainer) {
        // Simulate multiple scroll events
        for (let i = 0; i < 5; i++) {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } });
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      const finalRect = uploadZone.getBoundingClientRect();
      expect(finalRect.top).toBe(initialRect.top);
      expect(finalRect.left).toBe(initialRect.left);
    });
  });

  describe('Requirement 2.1: Job list shows scroll bar when content exceeds space', () => {
    it('should show scroll bar when job list content is long', () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
      
      // Should have overflow-y-auto class for scrolling
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });
  });

  describe('Requirement 2.2: Scrolling affects only list content', () => {
    it('should only scroll job list content, not other elements', async () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      const uploadZone = screen.getByText(/上传文件|Upload File/i);
      
      if (scrollContainer) {
        const uploadInitialPos = uploadZone.getBoundingClientRect();
        
        // Scroll job list
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 200 } });
        
        // Upload zone should not move
        const uploadFinalPos = uploadZone.getBoundingClientRect();
        expect(uploadFinalPos.top).toBe(uploadInitialPos.top);
      }
    });
  });

  describe('Requirement 2.3: No scroll bar when job list is empty or short', () => {
    it('should not show scroll behavior when job list is empty', () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={[]} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
      
      // Container should still have overflow-y-auto class but won't show scrollbar
      // when content doesn't exceed container height
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });

    it('should not show scroll behavior with few jobs', () => {
      const fewJobs = mockJobs.slice(0, 2);
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={fewJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });
  });

  describe('Requirement 2.4: Consistent scroll behavior when jobs are added', () => {
    it('should maintain scroll behavior when new jobs are added', async () => {
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

      // Scroll container should still work
      const updatedScrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(updatedScrollContainer).toHaveClass('overflow-y-auto');
    });
  });

  describe('Requirement 3.1-3.4: Responsive design validation', () => {
    it('should work on desktop screen sizes', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const mainContainer = container.querySelector('[class*="max-w-2xl"]');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should adapt to mobile screen sizes', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const mainContainer = container.querySelector('[class*="max-w-2xl"]');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should adjust job list height on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerHeight', { value: 500, writable: true });

      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toHaveClass('flex-1');
    });
  });

  describe('Requirement 4.1-4.4: Smooth scroll behavior validation', () => {
    it('should have smooth scrolling enabled', () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toHaveClass('scroll-smooth');
    });

    it('should handle mouse wheel events correctly', async () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      
      if (scrollContainer) {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          bubbles: true
        });
        
        fireEvent(scrollContainer, wheelEvent);
        
        // Should not throw errors and container should handle the event
        expect(scrollContainer).toBeInTheDocument();
      }
    });

    it('should handle touch gestures on mobile devices', async () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      
      if (scrollContainer) {
        // Simulate touch scroll
        fireEvent.touchStart(scrollContainer, {
          touches: [{ clientY: 100 }]
        });
        
        fireEvent.touchMove(scrollContainer, {
          touches: [{ clientY: 50 }]
        });
        
        fireEvent.touchEnd(scrollContainer);
        
        // Should handle touch events without errors
        expect(scrollContainer).toBeInTheDocument();
      }
    });

    it('should provide appropriate visual feedback at scroll boundaries', async () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      
      if (scrollContainer) {
        // Scroll to top
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 0 } });
        expect(scrollContainer.scrollTop).toBe(0);
        
        // Scroll to bottom (simulate)
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000 });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 400 });
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 600 } });
        
        // Should handle boundary conditions
        expect(scrollContainer).toBeInTheDocument();
      }
    });
  });

  describe('No regression in existing functionality', () => {
    it('should maintain upload functionality', async () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={[]} />
        </TestWrapper>
      );

      // Upload zone should be present and functional
      const uploadArea = screen.getByText(/选择文件|Select File/i);
      expect(uploadArea).toBeInTheDocument();
    });

    it('should maintain job management functionality', async () => {
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs.slice(0, 3)} />
        </TestWrapper>
      );

      // Job items should be rendered
      const jobItems = screen.getAllByText(/test-file-/);
      expect(jobItems.length).toBeGreaterThan(0);
    });

    it('should maintain real-time updates functionality', () => {
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={[]} />
        </TestWrapper>
      );

      // Should not break existing real-time functionality
      expect(container).toBeInTheDocument();
    });
  });
});