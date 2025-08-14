import React, { useEffect } from 'react';

type NotificationProps = {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
  duration?: number;
};

const iconMap = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

const colorMap = {
  info: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
  success: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

export function Notification({ message, type, onClose, duration = 5000 }: NotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  return (
    <div 
      className={`fixed top-5 right-5 w-full max-w-sm p-4 rounded-lg shadow-lg flex items-center gap-4 z-50 animate-in fade-in slide-in-from-top-5 duration-300 border bg-[var(--bg-secondary)] ${colorMap[type]}`}
      role="alert"
    >
      <span className="material-symbols-outlined text-2xl">{iconMap[type]}</span>
      <p className="flex-grow font-medium text-[var(--text-primary)]">{message}</p>
      <button onClick={onClose} aria-label="Close notification" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}