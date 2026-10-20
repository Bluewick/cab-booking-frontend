import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Obsidian Geist Responsive Drawer & Bottom Sheet
 * Seamlessly adapts from desktop floating card to mobile bottom drawer with drag handle.
 * Uses createPortal to mount cleanly to document.body.
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom', // 'bottom' | 'left' | 'right'
  showHandle = true,
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const drawerNode = (
    <div className="fixed inset-0 z-[800] overflow-hidden">
      {/* Blurred Dim Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[4px] transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {position === 'bottom' && (
        <div className="fixed inset-x-0 bottom-0 z-[800] flex flex-col justify-end pointer-events-none">
          <div
            className={`
              pointer-events-auto w-full max-w-xl mx-auto
              bg-[#0F0F12]/95 backdrop-blur-[20px] border-t border-x border-[#27272A]
              rounded-t-[22px] shadow-[0_-12px_40px_rgba(0,0,0,0.85)]
              p-5 max-h-[85vh] flex flex-col overflow-hidden animate-slideUp
              ${className}
            `}
          >
            {/* Mobile Drag Handle */}
            {showHandle && (
              <div className="w-full flex justify-center pb-2 cursor-grab">
                <div className="w-10 h-1.5 bg-[#3F3F46] rounded-full" />
              </div>
            )}

            {title && (
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#27272A]">
                <h3 className="text-base font-semibold text-[#FAFAFA]">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-[6px] text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <div className="overflow-y-auto pr-1">{children}</div>
          </div>
        </div>
      )}

      {position === 'left' && (
        <div className="fixed inset-y-0 left-0 z-[800] flex pointer-events-none">
          <div
            className={`
              pointer-events-auto w-full max-w-md h-full
              bg-[#0F0F12]/95 backdrop-blur-[20px] border-r border-[#27272A]
              shadow-[12px_0_40px_rgba(0,0,0,0.85)]
              p-5 flex flex-col overflow-hidden animate-slideRight
              ${className}
            `}
          >
            {title && (
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#27272A]">
                <h3 className="text-base font-semibold text-[#FAFAFA]">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-[6px] text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto flex-1">{children}</div>
          </div>
        </div>
      )}

      {position === 'right' && (
        <div className="fixed inset-y-0 right-0 z-[800] flex justify-end pointer-events-none">
          <div
            className={`
              pointer-events-auto w-full max-w-md h-full
              bg-[#0F0F12]/95 backdrop-blur-[20px] border-l border-[#27272A]
              shadow-[-12px_0_40px_rgba(0,0,0,0.85)]
              p-5 flex flex-col overflow-hidden animate-slideLeft
              ${className}
            `}
          >
            {title && (
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#27272A]">
                <h3 className="text-base font-semibold text-[#FAFAFA]">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-[6px] text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto flex-1">{children}</div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerNode, document.body) : drawerNode;
}

