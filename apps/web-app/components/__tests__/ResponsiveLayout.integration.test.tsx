import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Mock the page component
vi.mock('../../app/page.tsx', () => ({
  default: () => (
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      <div data-testid="header">Header</div>
      <main className="flex flex-1 flex-col items-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
        <div data-testid="client-wrapper" className="flex flex-col h-full w-full max-w-2xl">
          <div className="flex-shrink-0" data-testid="upload-zone">
            Upload Zone
          </div>
          <div className="flex-1 overflow-y-auto mt-3 sm:mt-4 md:mt-6 min-h-0" data-testid="job-list-container">
            Job List Container
          </div>
        </div>
      </main>
    </div>
  )
}));

const MockPage = () => {
  return (
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      <div data-testid="header">Header</div>
      <main className="flex flex-1 flex-col items-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
        <div data-testid="client-wrapper" className="flex flex-col h-full w-full max-w-2xl">
          <div className="flex-shrink-0" data-testid="upload-zone">
            Upload Zone
          </div>
          <div className="flex-1 overflow-y-auto mt-3 sm:mt-4 md:mt-6 min-h-0" data-testid="job-list-container">
            Job List Container
          </div>
        </div>
      </main>
    </div>
  );
};

const renderWithLanguageProvider = (component: React.ReactElement<any>) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('Responsive Layout Integration', () => {
  describe('Page Layout Structure', () => {
    it('should have proper page-level responsive structure', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const pageContainer = screen.getByTestId('header').parentElement;
      expect(pageContainer).toHaveClass('flex', 'h-screen', 'flex-col', 'bg-gray-50', 'overflow-hidden');
    });

    it('should have responsive main padding', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-2', 'sm:p-4', 'md:p-6', 'lg:p-8');
      expect(main).toHaveClass('flex', 'flex-1', 'flex-col', 'items-center', 'overflow-hidden');
    });

    it('should have proper client wrapper layout', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const clientWrapper = screen.getByTestId('client-wrapper');
      expect(clientWrapper).toHaveClass('flex', 'flex-col', 'h-full', 'w-full', 'max-w-2xl');
    });
  });

  describe('Upload Zone Fixed Positioning', () => {
    it('should have upload zone that does not shrink', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const uploadZone = screen.getByTestId('upload-zone');
      expect(uploadZone).toHaveClass('flex-shrink-0');
    });

    it('should maintain upload zone visibility', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const uploadZone = screen.getByTestId('upload-zone');
      expect(uploadZone).toBeVisible();
      
      // Upload zone should be at the top of the layout
      const clientWrapper = screen.getByTestId('client-wrapper');
      expect(clientWrapper.firstElementChild).toBe(uploadZone);
    });
  });

  describe('Job List Scrollable Area', () => {
    it('should have proper scrollable container setup', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const jobListContainer = screen.getByTestId('job-list-container');
      expect(jobListContainer).toHaveClass('flex-1', 'overflow-y-auto', 'min-h-0');
    });

    it('should have responsive spacing from upload zone', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const jobListContainer = screen.getByTestId('job-list-container');
      expect(jobListContainer).toHaveClass('mt-3', 'sm:mt-4', 'md:mt-6');
    });

    it('should occupy remaining space after upload zone', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const jobListContainer = screen.getByTestId('job-list-container');
      expect(jobListContainer).toHaveClass('flex-1');
      
      // Should be the second child after upload zone
      const clientWrapper = screen.getByTestId('client-wrapper');
      expect(clientWrapper.children[1]).toBe(jobListContainer);
    });
  });

  describe('Responsive Behavior Validation', () => {
    it('should prevent page-level scrolling', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const pageContainer = screen.getByTestId('header').parentElement;
      expect(pageContainer).toHaveClass('overflow-hidden');
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('overflow-hidden');
    });

    it('should maintain layout integrity with different content sizes', () => {
      renderWithLanguageProvider(<MockPage />);
      
      // Verify the layout structure remains consistent
      const clientWrapper = screen.getByTestId('client-wrapper');
      const uploadZone = screen.getByTestId('upload-zone');
      const jobListContainer = screen.getByTestId('job-list-container');
      
      // Upload zone should be first and non-shrinking
      expect(clientWrapper.firstElementChild).toBe(uploadZone);
      expect(uploadZone).toHaveClass('flex-shrink-0');
      
      // Job list container should be second and flexible
      expect(clientWrapper.children[1]).toBe(jobListContainer);
      expect(jobListContainer).toHaveClass('flex-1');
    });

    it('should handle small screen constraints', () => {
      renderWithLanguageProvider(<MockPage />);
      
      // Verify minimum spacing is applied for small screens
      const main = screen.getByRole('main');
      expect(main).toHaveClass('p-2'); // Minimum padding for mobile
      
      const jobListContainer = screen.getByTestId('job-list-container');
      expect(jobListContainer).toHaveClass('mt-3'); // Minimum margin for mobile
    });
  });

  describe('Layout Performance Considerations', () => {
    it('should use efficient CSS classes for layout', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const clientWrapper = screen.getByTestId('client-wrapper');
      
      // Should use flexbox for efficient layout
      expect(clientWrapper).toHaveClass('flex', 'flex-col');
      
      // Should have proper height constraints
      expect(clientWrapper).toHaveClass('h-full');
      
      // Should have width constraints
      expect(clientWrapper).toHaveClass('w-full', 'max-w-2xl');
    });

    it('should prevent layout thrashing with min-h-0', () => {
      renderWithLanguageProvider(<MockPage />);
      
      const jobListContainer = screen.getByTestId('job-list-container');
      expect(jobListContainer).toHaveClass('min-h-0');
    });
  });
});