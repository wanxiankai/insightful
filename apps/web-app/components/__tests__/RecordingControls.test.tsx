import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RecordingControls from '../RecordingControls';
import { RecordingStatus } from '@/types/recording';

describe('RecordingControls', () => {
  const mockOnStart = vi.fn();
  const mockOnStop = vi.fn();

  beforeEach(() => {
    mockOnStart.mockClear();
    mockOnStop.mockClear();
  });

  it('renders start button when idle', () => {
    render(
      <RecordingControls
        status={RecordingStatus.IDLE}
        onStart={mockOnStart}
        onStop={mockOnStop}
      />
    );

    expect(screen.getByText('开始录制')).toBeInTheDocument();
    expect(screen.queryByText('停止录制')).not.toBeInTheDocument();
  });

  it('renders stop button when recording', () => {
    render(
      <RecordingControls
        status={RecordingStatus.RECORDING}
        onStart={mockOnStart}
        onStop={mockOnStop}
      />
    );

    expect(screen.getByText('停止录制')).toBeInTheDocument();
    expect(screen.queryByText('开始录制')).not.toBeInTheDocument();
  });

  it('shows requesting permission state', () => {
    render(
      <RecordingControls
        status={RecordingStatus.REQUESTING_PERMISSION}
        onStart={mockOnStart}
        onStop={mockOnStop}
      />
    );

    expect(screen.getByText('请求权限中...')).toBeInTheDocument();
  });

  it('shows processing state', () => {
    render(
      <RecordingControls
        status={RecordingStatus.PROCESSING}
        onStart={mockOnStart}
        onStop={mockOnStop}
      />
    );

    // When processing, it shows the start button (disabled) since isRecording is false
    expect(screen.getByText('开始录制')).toBeInTheDocument();
    expect(screen.getByText('开始录制')).toBeDisabled();
  });

  it('calls onStart when start button is clicked', () => {
    render(
      <RecordingControls
        status={RecordingStatus.IDLE}
        onStart={mockOnStart}
        onStop={mockOnStop}
      />
    );

    fireEvent.click(screen.getByText('开始录制'));
    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });

  it('calls onStop when stop button is clicked', () => {
    render(
      <RecordingControls
        status={RecordingStatus.RECORDING}
        onStart={mockOnStart}
        onStop={mockOnStop}
      />
    );

    fireEvent.click(screen.getByText('停止录制'));
    expect(mockOnStop).toHaveBeenCalledTimes(1);
  });

  it('disables start button when disabled prop is true', () => {
    render(
      <RecordingControls
        status={RecordingStatus.IDLE}
        onStart={mockOnStart}
        onStop={mockOnStop}
        disabled={true}
      />
    );

    const startButton = screen.getByText('开始录制');
    expect(startButton).toBeDisabled();
  });

  it('disables start button when processing', () => {
    render(
      <RecordingControls
        status={RecordingStatus.PROCESSING}
        onStart={mockOnStart}
        onStop={mockOnStop}
      />
    );

    // When processing, start button is shown and disabled
    const startButton = screen.getByText('开始录制');
    expect(startButton).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <RecordingControls
        status={RecordingStatus.IDLE}
        onStart={mockOnStart}
        onStop={mockOnStop}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});