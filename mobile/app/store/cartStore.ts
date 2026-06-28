// Savat global holati / Cart global state (Zustand)
import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name_ru:   string;
  name_ky:   string;
  image:     string;
  price:     number;
  size:      string;
  color:     string;
  qty:       number;
  maxStock:  number;
  promotionId?: string; // Agar aksiya orqali qo'shilgan bo'lsa / Set when added via a promotion
}

interface CartState {
  items: CartItem[];
  addItem:    (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQty:  (productId: string, size: string, color: string, qty: number) => void;
  clearCart:  () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const itemKey = (productId: string, size: string, color: string) =>
  `${productId}_${size}_${color}`;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    const items = [...get().items];
    const key = itemKey(item.productId, item.size, item.color);
    const existing = items.find(i => itemKey(i.productId, i.size, i.color) === key);
    if (existing) {
      existing.qty = Math.min(existing.qty + item.qty, item.maxStock);
    } else {
      items.push(item);
    }
    set({ items });
  },

  removeItem: (productId, size, color) => {
    set({ items: get().items.filter(i => itemKey(i.productId, i.size, i.color) !== itemKey(productId, size, color)) });
  },

  updateQty: (productId, size, color, qty) => {
    const items = get().items.map(i =>
      itemKey(i.productId, i.size, i.color) === itemKey(productId, size, color)
        ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock)) }
        : i
    );
    set({ items });
  },

  clearCart: () => set({ items: [] }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),

  totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));
