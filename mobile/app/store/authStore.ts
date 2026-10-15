// Autentifikatsiya global holati / Auth global state (Zustand)
import { create } from 'zustand';
import { saveToken, removeToken, saveLang, getPushToken, removePushToken } from '../utils/storage';
import { queryClient } from '../utils/queryClient';
import { useCartStore } from './cartStore';
import { useAppStore } from './appStore';
import i18n from '../i18n';
import { API_URL } from '../utils/config';

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
  bonusExpiresAt?: string | null;
  marketingPush?: boolean;
  blockedUsers?: string[];
  totalSaved: number;
  qrCode: string;
  favorites: string[];
  addresses: any[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser:    (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout:     (revoke?: boolean) => Promise<void>;
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

  logout: async (revoke = true) => {
    const token = get().token;
    if (token && revoke) {
      try {
        const pushToken = await getPushToken();
        await Promise.race([fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ pushToken }),
        }), new Promise(resolve => setTimeout(resolve, 2000))]);
      } catch {}
    }
    await removePushToken();
    await removeToken();
    set({ user: null, token: null, isAuthenticated: false });
    useCartStore.getState().clearCart();
    useAppStore.getState().clearAllNotifs();
    queryClient.clear();
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
