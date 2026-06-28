import { create } from 'zustand';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
};

type ConfirmState = {
  visible: boolean;
  options: ConfirmOptions | null;
  ask: (options: ConfirmOptions) => void;
  close: () => void;
};

export const useConfirmStore = create<ConfirmState>((set) => ({
  visible: false,
  options: null,
  ask: (options) => set({ visible: true, options }),
  close: () => set({ visible: false }),
}));
