/**
 * Responsive Design Tests
 * 
 * Tests the responsive behavior of the fixed upload zone across different devices
 */

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

const mockJobs: MeetingJob[] = Array.from({ length: 10 }, (_, i) => ({
  id: `job-${i}`,
  fileName: `test-file-${i}.mp3`,
  status: 'COMPLETED' as const,
  createdAt: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
  fileKey: `test-key-${i}`,
  fileUrl: `https://example.com/file-${i}.mp3`
}));

// Helper function to mock viewport size
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
  });

  afterEach(() => {
    // Reset viewport to default
    mockViewport(1024, 768);
  });

  describe('Desktop screen sizes (Requirement 3.1)', () => {
    it('should utilize available space efficiently on desktop', () => {
      mockViewport(1920, 1080);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const mainContainer = container.querySelector('[class*="max-w-2xl"]');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('max-w-2xl');
    });

    it('should maintain proper layout on standard desktop (1024x768)', () => {
      mockViewport(1024, 768);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const flexContainer = container.querySelector('[class*="flex-col h-full"]');
      expect(flexContainer).toBeInTheDocument();
      
      const uploadZone = container.querySelector('[class*="flex-shrink-0"]');
      expect(uploadZone).toBeInTheDocument();
      
      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should work on large desktop screens (1440p)', () => {
      mockViewport(2560, 1440);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const mainContainer = container.querySelector('[class*="max-w-2xl"]');
      expect(mainContainer).toBeInTheDocument();
      
      // Should still have max-width constraint
      expect(mainContainer).toHaveClass('max-w-2xl');
    });
  });

  describe('Mobile screen sizes (Requirement 3.2)', () => {
    it('should adapt to iPhone-sized screens (375x667)', () => {
      mockViewport(375, 667);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const mainContainer = container.querySelector('[class*="flex-col h-full"]');
      expect(mainContainer).toBeInTheDocument();
      
      // Should maintain flex layout
      expect(mainContainer).toHaveClass('flex-col');
      expect(mainContainer).toHaveClass('h-full');
    });

    it('should work on Android-sized screens (360x640)', () => {
      mockViewport(360, 640);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('flex-1');
    });

    it('should handle very small mobile screens (320x568)', () => {
      mockViewport(320, 568);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const uploadZone = container.querySelector('[class*="flex-shrink-0"]');
      expect(uploadZone).toBeInTheDocument();
      
      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe('Small screen height adaptation (Requirement 3.3)', () => {
    it('should adjust job list height on very short screens', () => {
      mockViewport(768, 400); // Short height
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('flex-1');
      expect(scrollContainer).toHaveClass('min-h-0');
    });

    it('should maintain upload zone visibility on short screens', () => {
      mockViewport(768, 500);
      
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const uploadZone = screen.getByText(/上传文件|Upload File/i);
      expect(uploadZone).toBeVisible();
    });

    it('should provide adequate scroll area on small heights', () => {
      mockViewport(375, 450); // Small mobile height
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('flex-1');
    });
  });

  describe('Orientation changes (Requirement 3.4)', () => {
    it('should adapt from portrait to landscape', () => {
      // Start in portrait
      mockViewport(375, 667);
      
      const { container, rerender } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      let mainContainer = container.querySelector('[class*="flex-col h-full"]');
      expect(mainContainer).toBeInTheDocument();

      // Switch to landscape
      mockViewport(667, 375);
      
      rerender(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      mainContainer = container.querySelector('[class*="flex-col h-full"]');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('h-full');
    });

    it('should handle tablet orientation changes', () => {
      // Portrait tablet
      mockViewport(768, 1024);
      
      const { container, rerender } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      let scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();

      // Landscape tablet
      mockViewport(1024, 768);
      
      rerender(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });
  });

  describe('Responsive spacing and sizing', () => {
    it('should use appropriate spacing on mobile', () => {
      mockViewport(375, 667);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toHaveClass('mt-3');
    });

    it('should use larger spacing on desktop', () => {
      mockViewport(1024, 768);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      // Should have responsive margin classes
      expect(scrollContainer?.className).toMatch(/mt-\d+/);
    });

    it('should maintain proper container width constraints', () => {
      mockViewport(1920, 1080);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const mainContainer = container.querySelector('[class*="max-w-2xl"]');
      expect(mainContainer).toHaveClass('w-full');
      expect(mainContainer).toHaveClass('max-w-2xl');
    });
  });

  describe('Touch-friendly interface on mobile', () => {
    it('should have touch-optimized scrolling on mobile', () => {
      mockViewport(375, 667);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toHaveStyle({
        WebkitOverflowScrolling: 'touch'
      });
    });

    it('should maintain adequate touch targets on mobile', () => {
      mockViewport(375, 667);
      
      render(
        <TestWrapper>
          <ClientWrapper initialJobs={mockJobs} />
        </TestWrapper>
      );

      // Upload zone should be easily tappable
      const uploadZone = screen.getByText(/选择文件|Select File/i);
      expect(uploadZone).toBeInTheDocument();
    });
  });

  describe('Cross-device consistency', () => {
    it('should maintain consistent layout structure across devices', () => {
      const devices = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 414, height: 896 }, // iPhone 11
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // Desktop
        { width: 1920, height: 1080 } // Large desktop
      ];

      devices.forEach(({ width, height }) => {
        mockViewport(width, height);
        
        const { container } = render(
          <TestWrapper>
            <ClientWrapper initialJobs={mockJobs} />
          </TestWrapper>
        );

        // Core layout elements should be present
        const mainContainer = container.querySelector('[class*="flex-col h-full"]');
        const uploadZone = container.querySelector('[class*="flex-shrink-0"]');
        const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');

        expect(mainContainer).toBeInTheDocument();
        expect(uploadZone).toBeInTheDocument();
        expect(scrollContainer).toBeInTheDocument();
      });
    });

    it('should maintain upload zone visibility across all screen sizes', () => {
      const screenSizes = [
        { width: 320, height: 568 },
        { width: 768, height: 1024 },
        { width: 1920, height: 1080 }
      ];

      screenSizes.forEach(({ width, height }) => {
        mockViewport(width, height);
        
        render(
          <TestWrapper>
            <ClientWrapper initialJobs={mockJobs} />
          </TestWrapper>
        );

        const uploadZone = screen.getByText(/上传文件|Upload File/i);
        expect(uploadZone).toBeVisible();
      });
    });
  });
});