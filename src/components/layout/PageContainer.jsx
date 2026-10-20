import React from 'react';

/**
 * Obsidian Geist PageContainer
 * Standardizes gutters, margins, and maximum widths across responsive viewports
 */
export default function PageContainer({
  children,
  maxWidth = '7xl',
  className = '',
  fullHeight = false,
}) {
  const maxWidthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`
        w-full mx-auto px-4 sm:px-6 lg:px-8 py-6
        ${maxWidthClasses[maxWidth] || maxWidthClasses['7xl']}
        ${fullHeight ? 'min-h-[calc(100vh-4rem)] flex flex-col' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
