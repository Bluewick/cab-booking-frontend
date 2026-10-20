import React, { forwardRef } from 'react';

/**
 * Obsidian Geist Input Component
 * Recessed surface-container well with specular hairline border, shadcn-style ring focus, and inline error support.
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    iconPosition = 'left',
    kbd,
    type = 'text',
    disabled = false,
    required = false,
    id,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-xs font-medium text-[#A1A1AA] select-none">
            {label} {required && <span className="text-[#F87171]">*</span>}
          </label>
          {hint && <span className="text-[11px] text-[#71717A]">{hint}</span>}
        </div>
      )}

      <div className="relative flex items-center">
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3.5 pointer-events-none text-[#71717A] flex items-center justify-center">
            <Icon className="size-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          className={`
            w-full h-11 bg-[#141418] text-[#FAFAFA] placeholder:text-[#71717A] text-sm rounded-[9px]
            border border-[#27272A] transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]
            focus:outline-none focus:border-[#FAFAFA] focus:ring-2 focus:ring-[#FAFAFA]/10
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]
            ${Icon && iconPosition === 'left' ? 'pl-10' : 'pl-3.5'}
            ${(Icon && iconPosition === 'right') || kbd ? 'pr-12' : 'pr-3.5'}
            ${error ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20' : ''}
            ${className}
          `}
          {...props}
        />

        {Icon && iconPosition === 'right' && (
          <div className="absolute right-3.5 pointer-events-none text-[#71717A] flex items-center justify-center">
            <Icon className="size-4" />
          </div>
        )}

        {kbd && (
          <div className="absolute right-2.5 pointer-events-none">
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono text-[#A1A1AA] bg-[#1C1C21] border border-[#27272A] rounded-[4px]">
              {kbd}
            </kbd>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[#F87171] mt-0.5 flex items-center gap-1 animate-fadeIn">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export default Input;
