import React from 'react';

/**
 * Obsidian Geist Card Component
 * Surface token hierarchy with specular micro-borders, glassmorphism, and interactive elevation.
 * Children are rendered directly inside the card container so layout classes (flex, grid, gap)
 * passed via className apply seamlessly to child elements.
 */
export default function Card({
  children,
  level = 1,
  interactive = false,
  selected = false,
  radialGlow = false,
  onClick,
  className = '',
  ...props
}) {
  const levelStyles = {
    0: 'bg-white dark:bg-[#09090B]',
    1: 'bg-[#0F0F12] border-[#27272A] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.4)]',
    2: 'bg-[#F9FAFB] dark:bg-[#141418] border-[#E4E4E7] dark:border-[#27272A] shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.5)]',
    3: 'bg-[#F4F4F5] dark:bg-[#1C1C21] border-[#D4D4D8] dark:border-[#3F3F46] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_12px_28px_rgba(0,0,0,0.6)]',
    glass: 'glass-panel',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#D4D4D8] dark:hover:border-[#3F3F46] hover:bg-[#F9FAFB] dark:hover:bg-[#141418] active:scale-[0.99]'
    : '';

  const selectedStyles = selected
    ? '!border-[#09090B] dark:!border-[#FAFAFA] !bg-[#F4F4F6] dark:!bg-[#18181B] ring-1 ring-[#09090B] dark:ring-[#FAFAFA] shadow-md dark:shadow-[0_0_20px_rgba(250,250,250,0.1)]'
    : '';

  // Apply default p-5 only if caller did not supply custom padding
  const hasPadding = /(^|\s)p[xytrbl]?-/.test(className);

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`
        relative rounded-[12px] border border-[#E4E4E7] dark:border-[#27272A] overflow-hidden
        ${!hasPadding ? 'p-5' : ''}
        ${levelStyles[level] || levelStyles[1]}
        ${interactiveStyles}
        ${selectedStyles}
        ${className}
      `}
      {...props}
    >
      {radialGlow && (
        <div className="absolute inset-0 pointer-events-none hero-radial-glow opacity-80" />
      )}
      {children}
    </div>
  );
}

