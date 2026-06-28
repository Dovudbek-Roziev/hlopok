import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'info',
  show: (message, type = 'info') => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: true, message, type });
    hideTimer = setTimeout(() => set({ visible: false }), 2800);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: false });
  },
}));

export const toast = {
  success: (message: string) => useToastStore.getState().show(message, 'success'),
  error:   (message: string) => useToastStore.getState().show(message, 'error'),
  info:    (message: string) => useToastStore.getState().show(message, 'info'),
};
