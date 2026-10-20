import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Obsidian Geist Modal Component
 * Follows Level 3 elevation guidelines with blurred dark backdrop and specular hairlines.
 * Uses createPortal to attach directly to document.body with peak z-index elevation.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const modalNode = (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[8px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`
          relative w-full ${sizeStyles[size] || sizeStyles.md}
          bg-[#141418] border border-[#3F3F46] rounded-[16px]
          shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_24px_48px_-8px_rgba(0,0,0,0.85)]
          p-6 z-10 overflow-hidden transform transition-all animate-scaleUp
          ${className}
        `}
      >
        {/* Subtle Radial Top Light */}
        <div className="absolute inset-0 pointer-events-none hero-radial-glow opacity-60" />

        <div className="relative z-10">
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[#27272A]/70">
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-[#FAFAFA] tracking-tight">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="rounded-[8px] p-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}

          <div>{children}</div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}

