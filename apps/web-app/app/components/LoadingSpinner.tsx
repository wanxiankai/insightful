import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'gray';
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue' 
}: LoadingSpinnerProps) {
  // 根据尺寸确定宽高
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }[size];
  
  // 根据颜色确定边框颜色
  const colorClass = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    gray: 'border-gray-600'
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
