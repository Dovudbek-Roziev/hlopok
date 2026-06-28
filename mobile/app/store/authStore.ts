// Autentifikatsiya global holati / Auth global state (Zustand)
import { create } from 'zustand';
import { saveToken, removeToken, saveLang } from '../utils/storage';
import { queryClient } from '../utils/queryClient';
import { useCartStore } from './cartStore';
import { useAppStore } from './appStore';
import i18n from '../i18n';

interface User {
  _id: string;
  phone?: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  language: 'ru' | 'ky';
  role: string;
  bonusBalance: number;
  totalSaved: number;
  qrCode: string;
  favorites: string[];
  addresses: any[];
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser:    (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout:     () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  token:           null,
  isLoading:       true,
  isAuthenticated: false,

  setUser: (user, token) => {
    saveToken(token);
    const lang = user.language || 'ru';
    i18n.changeLanguage(lang);
    saveLang(lang);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  updateUser: (updates) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...updates };
    if (updates.language) {
      i18n.changeLanguage(updates.language);
      saveLang(updates.language);
    }
    set({ user: updated });
  },

  logout: async () => {
    await removeToken();
    set({ user: null, token: null, isAuthenticated: false });
    useCartStore.getState().clearCart();
    useAppStore.getState().clearAllNotifs();
    queryClient.clear();
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
