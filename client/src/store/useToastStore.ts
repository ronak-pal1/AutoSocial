import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newItem: ToastItem = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newItem] }));

    const duration = toast.duration ?? 4500;
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
    return id;
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  success: (message, title) => get().addToast({ type: 'success', message, title }),
  error: (message, title) => get().addToast({ type: 'error', message, title }),
  info: (message, title) => get().addToast({ type: 'info', message, title }),
  warning: (message, title) => get().addToast({ type: 'warning', message, title })
}));
