import { create } from 'zustand';

export interface ToastItem {
  id: number;
  type: 'error' | 'success' | 'info';
  title: string;
  message?: string;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (type: ToastItem['type'], title: string, message?: string) => void;
  removeToast: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, title, message) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, type, title, message }] }));
    const duration = type === 'error' ? 8000 : 4000;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
