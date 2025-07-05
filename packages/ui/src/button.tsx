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
  className = "btn btn-primary", 
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
