import React, { createContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  };

  const icons = {
    success: <CheckCircle2 className="size-4 text-[#34D399] shrink-0" />,
    error: <AlertCircle className="size-4 text-[#F87171] shrink-0" />,
    warning: <AlertTriangle className="size-4 text-[#FBBF24] shrink-0" />,
    info: <Info className="size-4 text-[#60A5FA] shrink-0" />,
  };

  const borders = {
    success: 'border-[rgba(16,185,129,0.3)] bg-[#052E16]/90',
    error: 'border-[rgba(239,68,68,0.3)] bg-[#450A0A]/90',
    warning: 'border-[rgba(245,158,11,0.3)] bg-[#451A03]/90',
    info: 'border-[rgba(59,130,246,0.3)] bg-[#172554]/90',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-3.5 rounded-[10px]
              backdrop-blur-[16px] border shadow-[0_12px_32px_rgba(0,0,0,0.85)]
              transition-all duration-200 animate-slideUp
              ${borders[t.type] || borders.info}
            `}
          >
            <div className="mt-0.5">{icons[t.type]}</div>
            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="text-xs font-semibold text-[#FAFAFA] leading-tight mb-0.5">
                  {t.title}
                </p>
              )}
              <p className="text-xs text-[#E4E4E7] leading-relaxed break-words">
                {t.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-[#A1A1AA] hover:text-[#FAFAFA] p-0.5 rounded transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export { ToastContext };
