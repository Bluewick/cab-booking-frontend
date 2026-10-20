import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Obsidian Geist Select Component
 */
const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    icon: Icon,
    options = [],
    value,
    onChange,
    disabled = false,
    required = false,
    id,
    placeholder = 'Select an option...',
    children,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={selectId} className="text-xs font-medium text-[#A1A1AA] select-none">
            {label} {required && <span className="text-[#F87171]">*</span>}
          </label>
          {hint && <span className="text-[11px] text-[#71717A]">{hint}</span>}
        </div>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-[#71717A] flex items-center justify-center">
            <Icon className="size-4" />
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full h-11 bg-[#141418] text-[#FAFAFA] text-sm rounded-[9px] appearance-none
            border border-[#27272A] transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]
            focus:outline-none focus:border-[#FAFAFA] focus:ring-2 focus:ring-[#FAFAFA]/10
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]
            ${Icon ? 'pl-10' : 'pl-3.5'}
            pr-10
            ${error ? 'border-[#EF4444] focus:border-[#EF4444]' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="" disabled className="bg-[#141418] text-[#71717A]">{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-[#141418] text-[#FAFAFA]">
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-[#71717A] flex items-center justify-center">
          <ChevronDown className="size-4" />
        </div>
      </div>

      {error && (
        <p className="text-xs text-[#F87171] mt-0.5 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
