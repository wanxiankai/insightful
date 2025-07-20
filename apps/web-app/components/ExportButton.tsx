'use client';

import { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExportButtonProps {
  content: string;
  fileName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ExportButton({ content, fileName, className = '', size = 'md' }: ExportButtonProps) {
  const [exported, setExported] = useState(false);
  const { t } = useLanguage();

  const handleExport = () => {
    try {
      // 创建 Blob 对象
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 确保文件名有 .md 扩展名
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_\s]/g, '').trim();
      const finalFileName = sanitizedFileName.endsWith('.md') 
        ? sanitizedFileName 
        : `${sanitizedFileName}.md`;
      
      link.download = finalFileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理 URL 对象
      URL.revokeObjectURL(url);
      
      // 显示成功状态
      setExported(true);
      setTimeout(() => {
        setExported(false);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to export file:', error);
      // 可以在这里添加错误提示
    }
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  return (
    <button
      onClick={handleExport}
      className={`
        inline-flex items-center justify-center rounded-lg border transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-[#61d0de]/20 focus:border-[#61d0de]
        ${exported 
          ? 'border-green-200 bg-green-50 text-green-600' 
          : className.includes('bg-white/') 
            ? 'border-white/30 text-white hover:bg-white/30 hover:border-white/50' 
            : 'border-gray-200 bg-white text-gray-600 hover:border-[#61d0de] hover:bg-[#61d0de]/5 hover:text-[#61d0de]'
        }
        ${buttonSizeClasses[size]} ${className}
      `}
      title={exported ? t.jobDetail.exportSuccess : t.jobDetail.exportMarkdown}
      disabled={exported}
    >
      {exported ? (
        <Check className={`${sizeClasses[size]} transition-all duration-200`} />
      ) : (
        <Download className={`${sizeClasses[size]} transition-all duration-200`} />
      )}
    </button>
  );
}