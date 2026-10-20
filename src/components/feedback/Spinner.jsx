import React from 'react';

/**
 * Obsidian Geist Inline Spinner
 * Designed for micro-interactions, buttons, and async loading states
 */
export default function Spinner({ size = 'md', color = 'current', className = '' }) {
  const sizeClasses = {
    xs: 'w-3 h-3 border-[1.5px]',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-[2.5px]',
    xl: 'w-8 h-8 border-3',
  };

  const colorClasses = {
    current: 'border-current border-t-transparent',
    white: 'border-[#FAFAFA] border-t-transparent',
    dark: 'border-[#09090B] border-t-transparent',
    brand: 'border-[#3B82F6] border-t-transparent',
    success: 'border-[#10B981] border-t-transparent',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full animate-spin shrink-0 ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.current} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
