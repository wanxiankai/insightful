import React from 'react';
import { render, screen, fireEvent } from '../../../src/test/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionHandler } from '../PermissionHandler';
import { PermissionStatus } from '@/types/recording';

describe('PermissionHandler', () => {
  const mockOnRequestPermission = vi.fn();

  beforeEach(() => {
    mockOnRequestPermission.mockClear();
  });

  it('renders permission request UI when permission is unknown', () => {
    render(
      <PermissionHandler
        hasPermission={PermissionStatus.UNKNOWN}
        onRequestPermission={mockOnRequestPermission}
      />
    );

    expect(screen.getByText('需要麦克风权限')).toBeInTheDocument();
    expect(screen.getByText('请求权限')).toBeInTheDocument();
  });

  it('renders permission request UI when permission is prompt', () => {
    render(
      <PermissionHandler
        hasPermission={PermissionStatus.PROMPT}
        onRequestPermission={mockOnRequestPermission}
      />
    );

    expect(screen.getByText('需要麦克风权限')).toBeInTheDocument();
    expect(screen.getByText('请求权限')).toBeInTheDocument();
  });

  it('renders granted status when permission is granted', () => {
    render(
      <PermissionHandler
        hasPermission={PermissionStatus.GRANTED}
        onRequestPermission={mockOnRequestPermission}
      />
    );

    expect(screen.getByText('麦克风已就绪')).toBeInTheDocument();
  });

  it('renders error UI when permission is denied', () => {
    render(
      <PermissionHandler
        hasPermission={PermissionStatus.DENIED}
        onRequestPermission={mockOnRequestPermission}
        error="PERMISSION_DENIED: Permission denied"
      />
    );

    expect(screen.getByText('麦克风权限被拒绝')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
    expect(screen.getByText('打开设置')).toBeInTheDocument();
  });

  it('calls onRequestPermission when request button is clicked', () => {
    render(
      <PermissionHandler
        hasPermission={PermissionStatus.UNKNOWN}
        onRequestPermission={mockOnRequestPermission}
      />
    );

    const requestButton = screen.getByText('请求权限');
    fireEvent.click(requestButton);

    expect(mockOnRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <PermissionHandler
        hasPermission={PermissionStatus.UNKNOWN}
        onRequestPermission={mockOnRequestPermission}
        isLoading={true}
      />
    );

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders device not found error correctly', () => {
    render(
      <PermissionHandler
        hasPermission={PermissionStatus.DENIED}
        onRequestPermission={mockOnRequestPermission}
        error="DEVICE_NOT_FOUND: No microphone found"
      />
    );

    expect(screen.getByText('未找到麦克风设备')).toBeInTheDocument();
    expect(screen.getByText('检查麦克风')).toBeInTheDocument();
  });

  it('renders device busy error correctly', () => {
    render(
      <PermissionHandler
        hasPermission={PermissionStatus.DENIED}
        onRequestPermission={mockOnRequestPermission}
        error="DEVICE_BUSY: Device is busy"
      />
    );

    expect(screen.getByText('麦克风正在被其他应用使用')).toBeInTheDocument();
    expect(screen.getByText('关闭其他应用')).toBeInTheDocument();
  });

  it('renders unsupported browser error correctly', () => {
    render(
      <PermissionHandler
        hasPermission={PermissionStatus.DENIED}
        onRequestPermission={mockOnRequestPermission}
        error="UNSUPPORTED_BROWSER: Browser not supported"
      />
    );

    expect(screen.getByText('浏览器不支持录制功能')).toBeInTheDocument();
    expect(screen.getByText('升级浏览器')).toBeInTheDocument();
    // Should not show retry button for unsupported browser
    expect(screen.queryByText('重试')).not.toBeInTheDocument();
  });
});