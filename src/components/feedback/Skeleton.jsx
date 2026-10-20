import React from 'react';

/**
 * Obsidian Geist Shimmer Skeleton Placeholder
 * Oscillates between #141418 and #27272A to prevent layout shifts
 */
export default function Skeleton({
  variant = 'rect', // 'rect' | 'circle' | 'text'
  width,
  height,
  className = '',
  count = 1,
}) {
  const variantStyles = {
    rect: 'rounded-[8px]',
    circle: 'rounded-full',
    text: 'rounded-[4px] h-3.5 my-1.5',
  };

  const items = Array.from({ length: count });

  const renderSkeleton = (key) => (
    <div
      key={key}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || undefined,
      }}
      className={`
        bg-gradient-to-r from-[#141418] via-[#27272A] to-[#141418]
        bg-[length:200%_100%] animate-[shimmer_1.8s_infinite]
        border border-[#27272A]/40 shrink-0
        ${variantStyles[variant] || variantStyles.rect}
        ${className}
      `}
    />
  );

  if (count === 1) return renderSkeleton(0);

  return (
    <div className="flex flex-col gap-2 w-full">
      {items.map((_, i) => renderSkeleton(i))}
    </div>
  );
}

/**
 * Card Skeleton Layout Shimmer for Ride and Trip lists
 */
export function CardSkeleton() {
  return (
    <div className="p-4 rounded-[12px] bg-[#0F0F12] border border-[#27272A] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="40%" height="16px" />
        <Skeleton variant="rect" width="60px" height="22px" className="rounded-full" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" width="40px" height="40px" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton variant="text" width="60%" height="14px" />
          <Skeleton variant="text" width="35%" height="12px" />
        </div>
      </div>
      <Skeleton variant="rect" width="100%" height="36px" className="rounded-[8px] mt-2" />
    </div>
  );
}
