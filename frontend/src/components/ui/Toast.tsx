'use client';
import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none max-w-[400px]">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-teal-400" />,
    error: <XCircle className="w-5 h-5 text-error" />,
    info: <AlertCircle className="w-5 h-5 text-blue-300" />,
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-4 bg-gray-900 text-white rounded-xl pointer-events-auto',
        'shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]',
        'animate-in fade-in slide-in-from-right-5 duration-300',
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="p-0.5 hover:bg-white/10 rounded">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}
