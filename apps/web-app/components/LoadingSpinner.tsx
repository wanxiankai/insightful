import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'default';
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'default' 
}: LoadingSpinnerProps) {
  // 根据尺寸确定宽高
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }[size];
  
  // 根据颜色确定边框颜色
  const colorClass = {
    default: 'border-[#61d0dc]'
  }[color];
  
  return (
    <div className="flex items-center justify-center">
      <div 
        className={`animate-spin rounded-full ${sizeClass} border-2 border-t-transparent ${colorClass}`}
        aria-label="加载中"
      ></div>
    </div>
  )
}
