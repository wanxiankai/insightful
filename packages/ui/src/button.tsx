"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName?: string;
  onClick?: () => void;
}

export const Button = ({ children, className, appName, onClick }: ButtonProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (appName) {
      alert(`Hello from your ${appName} app!`);
    }
  };

  return (
    <button
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
