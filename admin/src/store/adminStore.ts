localStorage.removeItem('admin_token');
localStorage.removeItem('admin_user');
import { create } from 'zustand';

interface AdminState {
  token: string | null;
  admin: any | null;
  isAuthenticated: boolean;
  newOrderCount: number;
  setAuth: (token: string, admin: any) => void;
  updateAdmin: (updates: Partial<any>) => void;
  logout: () => void;
  addNewOrder: () => void;
  clearNewOrders: () => void;
}

const savedAdmin = () => {
  try { return JSON.parse(sessionStorage.getItem('admin_user') || 'null'); }
  catch { return null; }
};

export const useAdminStore = create<AdminState>((set, get) => ({
  token:           sessionStorage.getItem('admin_token'),
  admin:           savedAdmin(),
  isAuthenticated: !!sessionStorage.getItem('admin_token'),
  newOrderCount:   Number(sessionStorage.getItem('admin_new_orders') || 0),

  setAuth: (token, admin) => {
    sessionStorage.setItem('admin_token', token);
    sessionStorage.setItem('admin_user', JSON.stringify(admin));
    set({ token, admin, isAuthenticated: true });
  },

  updateAdmin: (updates) => {
    const current = get().admin;
    const updated = { ...current, ...updates };
    sessionStorage.setItem('admin_user', JSON.stringify(updated));
    set({ admin: updated });
  },

  logout: () => {
    const token = get().token;
    if (token) void fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_new_orders');
    set({ token: null, admin: null, isAuthenticated: false, newOrderCount: 0 });
  },

  addNewOrder: () => {
    const count = get().newOrderCount + 1;
    sessionStorage.setItem('admin_new_orders', String(count));
    set({ newOrderCount: count });
  },

  clearNewOrders: () => {
    sessionStorage.removeItem('admin_new_orders');
    set({ newOrderCount: 0 });
  },
}));
