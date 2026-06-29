import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
  id: string;
  orderNumber: string;
  status: string;
  orderId: string;
  time: number;
  read: boolean;
}

interface AppState {
  isFirstLaunch: boolean;
  setFirstLaunch: (value: boolean) => void;
  notifications: AppNotification[];
  notifCount: number;
  addNotif: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  clearNotif: () => void;
  removeNotif: (id: string) => void;
  clearAllNotifs: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isFirstLaunch: true,
      setFirstLaunch: (value) => set({ isFirstLaunch: value }),

      notifications: [],
      notifCount: 0,

      addNotif: (n) => set({
        notifications: [
          { ...n, id: Date.now().toString(), time: Date.now(), read: false },
          ...get().notifications,
        ],
        notifCount: get().notifCount + 1,
      }),

      clearNotif: () => set({ notifCount: 0 }),

      removeNotif: (id) => set({
        notifications: get().notifications.filter(n => n.id !== id),
        notifCount: Math.max(0, get().notifCount - 1),
      }),

      clearAllNotifs: () => set({ notifications: [], notifCount: 0 }),
    }),
    {
      name: 'hlopok-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isFirstLaunch: state.isFirstLaunch,
        notifications: state.notifications,
        notifCount: state.notifCount,
      }),
    }
  )
);
