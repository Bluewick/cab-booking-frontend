import React from 'react';
import Spinner from '../feedback/Spinner';

/**
 * Obsidian Geist Standard Button Component
 * Strictly adheres to DESIGN.md button specifications & async loading state rules
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  const baseStyles = 'inline-flex items-center justify-center font-medium select-none transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA]/20 active:scale-[0.985] cursor-pointer disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-50';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs rounded-[6px] gap-1.5',
    md: 'h-10 px-4 text-sm rounded-[8px] gap-2',
    lg: 'h-12 px-6 text-base rounded-[10px] gap-2.5 font-semibold',
    icon: 'h-9 w-9 p-0 rounded-[8px] justify-center',
    'icon-sm': 'h-8 w-8 p-0 rounded-[6px] justify-center',
  };

  const variantStyles = {
    primary: 'bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.5)] active:bg-[#D4D4D8]',
    secondary: 'bg-[#141418] text-[#FAFAFA] border border-[#27272A] hover:bg-[#1C1C21] hover:border-[#3F3F46] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] active:bg-[#27272A]',
    outline: 'bg-transparent text-[#FAFAFA] border border-[#27272A] hover:bg-[#141418] hover:border-[#3F3F46]',
    destructive: 'bg-[rgba(239,68,68,0.14)] text-[#F87171] border border-[rgba(239,68,68,0.3)] hover:bg-[#EF4444] hover:text-[#FFFFFF] hover:border-[#EF4444] active:bg-[#DC2626]',
    ghost: 'bg-transparent text-[#A1A1AA] hover:bg-[#1C1C21] hover:text-[#FAFAFA]',
    brand: 'bg-[#3B82F6] text-[#FFFFFF] hover:bg-[#2563EB] shadow-[0_0_16px_rgba(59,130,246,0.25)] border border-[#3B82F6]/50',
  };

  const spinnerColor = variant === 'primary' ? 'dark' : 'white';

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size === 'lg' ? 'md' : 'sm'} color={spinnerColor} />
          {loadingText ? <span>{loadingText}</span> : (children && <span>{children}</span>)}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="shrink-0 size-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="shrink-0 size-4" />}
        </>
      )}
    </button>
  );
}
