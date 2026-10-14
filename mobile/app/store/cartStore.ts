import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  promotionId?: string;
}

interface CartState {
  items: CartItem[];
  addItem:    (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string, promotionId?: string) => void;
  updateQty:  (productId: string, size: string, color: string, qty: number, promotionId?: string) => void;
  clearCart:  () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const itemKey = (productId: string, size: string, color: string, promotionId?: string) =>
  `${productId}_${size}_${color}_${promotionId || 'regular'}`;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = [...get().items];
        const key = itemKey(item.productId, item.size, item.color, item.promotionId);
        const existing = items.find(i => itemKey(i.productId, i.size, i.color, i.promotionId) === key);
        if (existing) {
          existing.maxStock = item.maxStock;
          existing.qty = Math.min(existing.qty + item.qty, existing.maxStock);
        } else {
          items.push({ ...item, qty: Math.min(item.qty, item.maxStock) });
        }
        set({ items });
      },

      removeItem: (productId, size, color, promotionId) => {
        set({ items: get().items.filter(i => itemKey(i.productId, i.size, i.color, i.promotionId) !== itemKey(productId, size, color, promotionId)) });
      },

      updateQty: (productId, size, color, qty, promotionId) => {
        const items = get().items.map(i =>
          itemKey(i.productId, i.size, i.color, i.promotionId) === itemKey(productId, size, color, promotionId)
            ? { ...i, qty: Math.max(1, Math.min(qty, Number.isInteger(i.maxStock) ? i.maxStock : i.qty)) }
            : i
        );
        set({ items });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    {
      name: 'hlopok-cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
