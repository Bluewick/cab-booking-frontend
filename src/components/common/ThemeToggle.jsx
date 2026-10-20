import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

/**
 * Obsidian Geist Theme Toggle Component
 * Supports 3 modes: 'light' | 'dark' | 'system'
 *
 * Variants:
 * - 'segmented' (Default): Micro segmented control pill for Navbar & toolbars
 * - 'dropdown': Single icon button expanding to a popup menu
 * - 'cards': Visual preview cards for Settings / Profile pages
 */
export default function ThemeToggle({
  variant = 'segmented',
  size = 'sm',
  showLabels = false,
  className = '',
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const options = [
    {
      id: 'light',
      label: 'Light',
      description: 'Crisp alabaster interface optimized for bright daylight',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark',
      description: 'Deep obsidian carbon contrast engineered for low eye strain',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System',
      description: 'Synchronize seamlessly with your device OS appearance',
      icon: Laptop,
    },
  ];

  // ----------------------------------------------------
  // Variant 1: Segmented Control (Navbar & Headers)
  // ----------------------------------------------------
  if (variant === 'segmented') {
    const sizeConfig = {
      sm: {
        container: 'p-0.5 rounded-[8px]',
        button: 'px-2 py-1 text-xs rounded-[6px] gap-1.5',
        iconSize: 'size-3.5',
      },
      md: {
        container: 'p-1 rounded-[10px]',
        button: 'px-3 py-1.5 text-xs rounded-[7px] gap-2',
        iconSize: 'size-4',
      },
      lg: {
        container: 'p-1.5 rounded-[12px]',
        button: 'px-4 py-2 text-sm rounded-[9px] gap-2.5',
        iconSize: 'size-4.5',
      },
    };

    const currentSize = sizeConfig[size] || sizeConfig.sm;

    return (
      <div
        role="radiogroup"
        aria-label="Theme selector"
        className={`inline-flex items-center bg-[#141418] border border-[#27272A] shadow-inner select-none transition-colors ${currentSize.container} ${className}`}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.id)}
              title={`${opt.label} Theme ${opt.id === 'system' ? `(${resolvedTheme})` : ''}`}
              className={`
                relative flex items-center justify-center font-medium transition-all duration-150 cursor-pointer
                ${currentSize.button}
                ${
                  isSelected
                    ? 'bg-[#27272A] text-[#FAFAFA] shadow-[0_1px_3px_rgba(0,0,0,0.4)]'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]/60'
                }
              `}
            >
              <Icon
                className={`${currentSize.iconSize} transition-transform duration-150 ${
                  isSelected ? 'scale-105 text-[#3B82F6]' : 'text-[#71717A]'
                }`}
              />
              {showLabels && (
                <span className="leading-none tracking-tight">{opt.label}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ----------------------------------------------------
  // Variant 2: Dropdown Menu (Compact Header Action)
  // ----------------------------------------------------
  if (variant === 'dropdown') {
    const ActiveIcon =
      theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-label={`Current theme: ${theme}. Click to change theme`}
          className="size-9 rounded-[9px] bg-[#141418] border border-[#27272A] hover:border-[#3F3F46] flex items-center justify-center text-[#FAFAFA] transition-all cursor-pointer shadow-sm hover:bg-[#1C1C21]"
        >
          <ActiveIcon className="size-4 text-[#FAFAFA]" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-[12px] bg-[#141418]/95 backdrop-blur-[20px] border border-[#27272A] shadow-[0_16px_36px_rgba(0,0,0,0.8)] p-1.5 z-50 animate-scaleUp flex flex-col gap-0.5">
            <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#71717A] border-b border-[#27272A]/70 mb-1">
              Select Appearance
            </div>

            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setDropdownOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-2.5 py-2 rounded-[8px] text-xs font-medium transition-colors cursor-pointer text-left
                    ${
                      isSelected
                        ? 'bg-[#1C1C21] text-[#FAFAFA]'
                        : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]/60'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${isSelected ? 'text-[#3B82F6]' : 'text-[#71717A]'}`} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="size-3.5 text-[#3B82F6]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // Variant 3: Visual Option Cards (Settings & Profile Page)
  // ----------------------------------------------------
  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 w-full ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`
                group relative p-4 rounded-[14px] border transition-all duration-200 cursor-pointer flex flex-col justify-between
                ${
                  isSelected
                    ? 'border-[#FAFAFA] bg-[#141418] shadow-[0_0_24px_rgba(0,0,0,0.5)] ring-1 ring-[#FAFAFA]'
                    : 'border-[#27272A] bg-[#0F0F12] hover:border-[#3F3F46] hover:bg-[#141418]'
                }
              `}
            >
              {/* Mini Preview Graphic */}
              <div className="w-full h-20 rounded-[9px] mb-3 border border-[#27272A]/70 overflow-hidden relative p-2.5 flex flex-col justify-between select-none">
                {opt.id === 'light' && (
                  <div className="absolute inset-0 bg-[#FFFFFF] flex flex-col p-2 justify-between">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-2 rounded-full bg-[#E4E4E7]" />
                      <div className="size-3 rounded-full bg-[#09090B]" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded bg-[#F4F4F5] border border-[#E4E4E7]" />
                      <div className="w-3/4 h-2 rounded bg-[#F4F4F5]" />
                    </div>
                  </div>
                )}

                {opt.id === 'dark' && (
                  <div className="absolute inset-0 bg-[#09090B] flex flex-col p-2 justify-between">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-2 rounded-full bg-[#27272A]" />
                      <div className="size-3 rounded-full bg-[#FAFAFA]" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded bg-[#141418] border border-[#27272A]" />
                      <div className="w-3/4 h-2 rounded bg-[#141418]" />
                    </div>
                  </div>
                )}

                {opt.id === 'system' && (
                  <div className="absolute inset-0 flex">
                    {/* Left Light */}
                    <div className="w-1/2 bg-[#FFFFFF] p-2 flex flex-col justify-between border-r border-[#E4E4E7]">
                      <div className="w-8 h-2 rounded-full bg-[#E4E4E7]" />
                      <div className="w-full h-2 rounded bg-[#F4F4F5]" />
                    </div>
                    {/* Right Dark */}
                    <div className="w-1/2 bg-[#09090B] p-2 flex flex-col justify-between">
                      <div className="size-3 rounded-full bg-[#FAFAFA] ml-auto" />
                      <div className="w-full h-2 rounded bg-[#141418]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-7 rounded-[7px] border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#3B82F6]/15 border-[#3B82F6]/40 text-[#60A5FA]'
                        : 'bg-[#18181B] border-[#27272A] text-[#71717A] group-hover:text-[#FAFAFA]'
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#FAFAFA] leading-tight">
                      {opt.label}
                    </h4>
                    {opt.id === 'system' && (
                      <span className="text-[10px] font-mono text-[#34D399]">
                        Active: {resolvedTheme}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                      : 'border-[#3F3F46] bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="size-2.5 stroke-[3]" />}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#A1A1AA] mt-2 leading-relaxed">
                {opt.description}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
