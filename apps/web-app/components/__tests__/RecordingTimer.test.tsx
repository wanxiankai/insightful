import { render, screen } from '@testing-library/react';
import RecordingTimer from '../RecordingTimer';

describe('RecordingTimer', () => {
  const defaultProps = {
    duration: 0,
    maxDuration: 1800, // 30 minutes
    isRecording: false
  };

  it('renders timer with correct initial time format', () => {
    render(<RecordingTimer {...defaultProps} />);
    
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('formats time correctly for various durations', () => {
    const { rerender } = render(<RecordingTimer {...defaultProps} duration={65} />);
    expect(screen.getByText('01:05')).toBeInTheDocument();

    rerender(<RecordingTimer {...defaultProps} duration={3661} />);
    expect(screen.getByText('61:01')).toBeInTheDocument();
  });

  it('shows progress bar when showProgress is true', () => {
    render(<RecordingTimer {...defaultProps} duration={900} showProgress={true} />);
    
    expect(screen.getByText('已录制')).toBeInTheDocument();
    expect(screen.getByText('剩余 15:00')).toBeInTheDocument();
  });

  it('hides progress bar when showProgress is false', () => {
    render(<RecordingTimer {...defaultProps} duration={900} showProgress={false} />);
    
    expect(screen.queryByText('已录制')).not.toBeInTheDocument();
    expect(screen.queryByText('剩余 15:00')).not.toBeInTheDocument();
  });

  it('shows warning when approaching time limit', () => {
    render(<RecordingTimer {...defaultProps} duration={1500} />); // 25 minutes
    
    expect(screen.getByText('⚠️ 录制时间即将达到上限')).toBeInTheDocument();
  });

  it('shows critical warning when very close to limit', () => {
    render(<RecordingTimer {...defaultProps} duration={1750} />); // 29 minutes 10 seconds
    
    expect(screen.getByText('🚨 录制即将自动停止')).toBeInTheDocument();
  });

  it('applies recording animation when isRecording is true', () => {
    render(<RecordingTimer {...defaultProps} isRecording={true} />);
    
    const clockIcon = screen.getByRole('img', { hidden: true });
    expect(clockIcon).toHaveClass('animate-pulse');
  });

  it('calculates progress correctly', () => {
    const { container } = render(<RecordingTimer {...defaultProps} duration={900} />); // 15 minutes
    
    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles zero max duration gracefully', () => {
    render(<RecordingTimer {...defaultProps} maxDuration={0} />);
    
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.queryByText('已录制')).not.toBeInTheDocument();
  });

  it('displays max duration in timer when provided', () => {
    render(<RecordingTimer {...defaultProps} duration={300} />);
    
    expect(screen.getByText('/ 30:00')).toBeInTheDocument();
  });
});