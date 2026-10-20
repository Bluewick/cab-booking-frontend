import React from 'react';

/**
 * Obsidian Geist Luminous Semantic Badge & Status Pill
 * Adheres strictly to DESIGN.md dark-mode jewel container rules
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-[5px] gap-1',
    md: 'text-xs px-2.5 py-1 rounded-[6px] gap-1.5',
    lg: 'text-sm px-3 py-1.5 rounded-[8px] gap-2 font-medium',
  };

  const variantStyles = {
    neutral: 'bg-[#1C1C21] text-[#A1A1AA] border border-[#27272A]',
    brand: 'bg-[rgba(59,130,246,0.12)] text-[#60A5FA] border border-[rgba(59,130,246,0.25)]',
    success: 'bg-[rgba(16,185,129,0.12)] text-[#34D399] border border-[rgba(16,185,129,0.25)]',
    warning: 'bg-[rgba(245,158,11,0.12)] text-[#FBBF24] border border-[rgba(245,158,11,0.25)]',
    error: 'bg-[rgba(239,68,68,0.12)] text-[#F87171] border border-[rgba(239,68,68,0.25)]',
    purple: 'bg-[rgba(167,139,250,0.12)] text-[#C4B5FD] border border-[rgba(167,139,250,0.25)]',
  };

  const dotColors = {
    neutral: 'bg-[#71717A]',
    brand: 'bg-[#3B82F6]',
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    error: 'bg-[#EF4444]',
    purple: 'bg-[#A78BFA]',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium select-none tabular-nums
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.neutral}
        ${className}
      `}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant] || dotColors.neutral}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[variant] || dotColors.neutral}`} />
        </span>
      )}
      {Icon && <Icon className="size-3.5 shrink-0" />}
      {children}
    </span>
  );
}

/**
 * Ride Lifecycle Status Pill Helper
 */
export function StatusPill({ status, className = '' }) {
  const statusConfig = {
    requested: { label: 'Searching Drivers', variant: 'warning', pulse: true },
    driver_assigned: { label: 'Driver Assigned', variant: 'brand', pulse: true },
    arrived: { label: 'Driver Arrived', variant: 'warning', pulse: false },
    in_progress: { label: 'On Trip', variant: 'success', pulse: true },
    completed: { label: 'Completed', variant: 'success', pulse: false },
    cancelled: { label: 'Cancelled', variant: 'error', pulse: false },
    online: { label: 'Online', variant: 'success', pulse: true },
    offline: { label: 'Offline', variant: 'neutral', pulse: false },
  };

  const config = statusConfig[status?.toLowerCase()] || {
    label: status || 'Unknown',
    variant: 'neutral',
    pulse: false,
  };

  return (
    <Badge variant={config.variant} pulse={config.pulse} className={className}>
      {config.label}
    </Badge>
  );
}
