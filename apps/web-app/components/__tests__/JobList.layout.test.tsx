import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JobList from '../JobList';
import { MeetingJob } from '../JobItem';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Mock the JobItem component
vi.mock('../JobItem', () => ({
  default: ({ job }: { job: MeetingJob }) => (
    <div data-testid={`job-item-${job.id}`}>{job.fileName || 'Untitled'}</div>
  ),
  MeetingJob: {} as any,
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
  })),
}));

const mockJobs: MeetingJob[] = [
  {
    id: '1',
    createdAt: '2024-01-01T00:00:00Z',
    fileName: 'Test Job 1',
    status: 'completed',
    fileKey: 'test-key-1',
    fileUrl: 'https://example.com/test1.mp3',
  },
  {
    id: '2',
    createdAt: '2024-01-02T00:00:00Z',
    fileName: 'Test Job 2',
    status: 'processing',
    fileKey: 'test-key-2',
    fileUrl: 'https://example.com/test2.mp3',
  },
];

const renderWithLanguageProvider = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('JobList Layout Optimization', () => {
  it('should render without external margin-top class', () => {
    const { container } = renderWithLanguageProvider(
      <JobList initialJobs={mockJobs} />
    );
    
    const jobListContainer = container.firstChild as HTMLElement;
    expect(jobListContainer).not.toHaveClass('mt-6');
    expect(jobListContainer).toHaveClass('w-full');
  });

  it('should have proper spacing between title and job items', () => {
    renderWithLanguageProvider(<JobList initialJobs={mockJobs} />);
    
    const title = screen.getByText('历史文件记录');
    expect(title).toHaveClass('mb-4');
  });

  it('should render job items in a space-y-4 container', () => {
    const { container } = renderWithLanguageProvider(
      <JobList initialJobs={mockJobs} />
    );
    
    const jobItemsContainer = container.querySelector('.space-y-4');
    expect(jobItemsContainer).toBeInTheDocument();
  });

  it('should render all job items correctly within scroll container', () => {
    renderWithLanguageProvider(<JobList initialJobs={mockJobs} />);
    
    expect(screen.getByTestId('job-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('job-item-2')).toBeInTheDocument();
    expect(screen.getByText('Test Job 1')).toBeInTheDocument();
    expect(screen.getByText('Test Job 2')).toBeInTheDocument();
  });

  it('should not show title when no jobs are present', () => {
    renderWithLanguageProvider(<JobList initialJobs={[]} />);
    
    expect(screen.queryByText('历史文件记录')).not.toBeInTheDocument();
  });

  it('should handle dynamic content addition correctly', () => {
    // Test with empty jobs first
    const { unmount } = renderWithLanguageProvider(
      <JobList initialJobs={[]} />
    );
    
    // Initially no jobs
    expect(screen.queryByText('历史文件记录')).not.toBeInTheDocument();
    
    unmount();
    
    // Test with jobs
    renderWithLanguageProvider(<JobList initialJobs={mockJobs} />);
    
    // Should now show title and jobs
    expect(screen.getByText('历史文件记录')).toBeInTheDocument();
    expect(screen.getByTestId('job-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('job-item-2')).toBeInTheDocument();
  });
});