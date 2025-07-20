'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CopyButton({ text, className = '', size = 'md' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // 2秒后重置状态
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      // 如果现代API失败，尝试使用传统方法
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy method also failed:', fallbackError);
      }
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
      onClick={handleCopy}
      className={`
        inline-flex items-center justify-center rounded-lg border transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-[#61d0de]/20 focus:border-[#61d0de]
        ${copied
          ? 'border-green-200 bg-green-50 text-green-600'
          : className.includes('bg-white/')
            ? 'border-white/30 text-white hover:bg-white/30 hover:border-white/50'
            : 'border-gray-200 bg-white text-gray-600 hover:border-[#61d0de] hover:bg-[#61d0de]/5 hover:text-[#61d0de]'
        }
        ${buttonSizeClasses[size]} ${className}
      `}
      title={copied ? t.common.copySuccess : t.common.copy}
      disabled={copied}
    >
      {copied ? (
        <Check className={`${sizeClasses[size]} transition-all duration-200`} />
      ) : (
        <Copy className={`${sizeClasses[size]} transition-all duration-200`} />
      )}
    </button>
  );
}