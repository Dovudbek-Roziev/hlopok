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
  try { return JSON.parse(localStorage.getItem('admin_user') || 'null'); }
  catch { return null; }
};

export const useAdminStore = create<AdminState>((set, get) => ({
  token:           localStorage.getItem('admin_token'),
  admin:           savedAdmin(),
  isAuthenticated: !!localStorage.getItem('admin_token'),
  newOrderCount:   Number(localStorage.getItem('admin_new_orders') || 0),

  setAuth: (token, admin) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(admin));
    set({ token, admin, isAuthenticated: true });
  },

  updateAdmin: (updates) => {
    const current = get().admin;
    const updated = { ...current, ...updates };
    localStorage.setItem('admin_user', JSON.stringify(updated));
    set({ admin: updated });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_new_orders');
    set({ token: null, admin: null, isAuthenticated: false, newOrderCount: 0 });
  },

  addNewOrder: () => {
    const count = get().newOrderCount + 1;
    localStorage.setItem('admin_new_orders', String(count));
    set({ newOrderCount: count });
  },

  clearNewOrders: () => {
    localStorage.removeItem('admin_new_orders');
    set({ newOrderCount: 0 });
  },
}));
