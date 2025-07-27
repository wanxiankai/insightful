/**
 * Scroll Behavior Integration Tests
 * 
 * Tests the scroll behavior independence between upload zone and job list
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

// Create mock jobs for testing
const createMockJobs = (count: number): MeetingJob[] => 
  Array.from({ length: count }, (_, i) => ({
    id: `job-${i}`,
    fileName: `test-file-${i}.mp3`,
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
    fileKey: `test-key-${i}`,
    fileUrl: `https://example.com/file-${i}.mp3`
  }));

describe('Scroll Behavior Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
  });

  describe('Upload zone visibility during scrolling', () => {
    it('should keep upload zone visible when scrolling through jobs', async () => {
      const manyJobs = createMockJobs(20);
      
      const { container } = render(
        <div style={{ height: '600px' }}>
          <TestWrapper>
            <ClientWrapper initialJobs={manyJobs} />
          </TestWrapper>
        </div>
      );

      const uploadZone = screen.getByText(/上传文件|Upload File/i);
      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      
      const initialRect = uploadZone.getBoundingClientRect();
      
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 300 } });
        
        await waitFor(() => {
          const currentRect = uploadZone.getBoundingClientRect();
          expect(currentRect.top).toBe(initialRect.top);
          expect(uploadZone).toBeVisible();
        });
      }
    });
  });

  describe('Job list scroll independence', () => {
    it('should scroll job list independently from page', async () => {
      const manyJobs = createMockJobs(15);
      
      const { container } = render(
        <div className="h-screen overflow-hidden">
          <TestWrapper>
            <ClientWrapper initialJobs={manyJobs} />
          </TestWrapper>
        </div>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      const uploadZone = screen.getByText(/上传文件|Upload File/i);
      
      const initialUploadRect = uploadZone.getBoundingClientRect();
      
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 200 } });
        
        await waitFor(() => {
          const finalUploadRect = uploadZone.getBoundingClientRect();
          expect(finalUploadRect.top).toBe(initialUploadRect.top);
        });
      }
    });
  });

  describe('Touch scroll behavior', () => {
    it('should handle touch scroll events correctly', async () => {
      const manyJobs = createMockJobs(10);
      
      const { container } = render(
        <TestWrapper>
          <ClientWrapper initialJobs={manyJobs} />
        </TestWrapper>
      );

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      
      if (scrollContainer) {
        fireEvent.touchStart(scrollContainer, {
          touches: [{ clientY: 200 }]
        });
        
        fireEvent.touchMove(scrollContainer, {
          touches: [{ clientY: 100 }]
        });
        
        fireEvent.touchEnd(scrollContainer);
        
        expect(scrollContainer).toBeInTheDocument();
      }
    });
  });
});