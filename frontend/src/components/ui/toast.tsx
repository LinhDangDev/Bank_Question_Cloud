import React, { createContext, useState, useContext, useCallback } from 'react';
import { useThemeStyles, cx } from '../../utils/theme';
import { X } from 'lucide-react';

type ToastVariant = 'default' | 'destructive' | 'success';

interface Toast {
  id: string;
  title?: string;
  description: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, ...props }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useContext(ToastContext) as ToastContextValue;
  const styles = useThemeStyles();

  return (
    <div className="fixed bottom-0 right-0 flex flex-col items-end justify-end p-4 space-y-4 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx(
            "px-4 py-3 rounded-lg shadow-lg flex items-start max-w-sm w-full transition-all transform translate-y-0 opacity-100",
            styles.isDark ? "bg-gray-800 text-white" : "bg-white text-gray-800",
            toast.variant === 'destructive' && (styles.isDark ? "border-l-4 border-red-500" : "border-l-4 border-red-500"),
            toast.variant === 'success' && (styles.isDark ? "border-l-4 border-green-500" : "border-l-4 border-green-500")
          )}
        >
          <div className="flex-1">
            {toast.title && (
              <h4 className={cx("font-medium", styles.isDark ? "text-gray-100" : "text-gray-900")}>{toast.title}</h4>
            )}
            <p className={cx("text-sm", styles.isDark ? "text-gray-300" : "text-gray-600")}>{toast.description}</p>
          </div>
          <button onClick={() => dismiss(toast.id)} className="ml-4">
            <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
