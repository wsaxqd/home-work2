import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import './Toast.css';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = toastId++;
    setToasts(prev => [...prev, { id, type, message }]);

    // 3秒后自动移除
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const success = (message: string) => addToast('success', message);
  const error = (message: string) => addToast('error', message);
  const info = (message: string) => addToast('info', message);
  const warning = (message: string) => addToast('warning', message);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'ℹ'}
              {toast.type === 'warning' && '⚠'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
