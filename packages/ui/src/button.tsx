"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button = ({ 
  children, 
  className = "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors", 
  appName, 
  onClick,
  disabled = false
}: ButtonProps) => {
  const handleClick = () => {
    if (disabled) return;
    
    if (onClick) {
      onClick();
    } else if (appName) {
      alert(`Hello from your ${appName} app!`);
    }
  };

  return (
    <button
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
