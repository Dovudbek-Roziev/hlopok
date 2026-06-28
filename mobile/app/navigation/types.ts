// Navigatsiya type'lari / Navigation types
export type AuthStackParamList = {
  Login:          undefined;
  OTPVerify:      { phone: string };
  Register:       { phone?: string; verified?: boolean } | undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab:    undefined;
  CatalogTab: undefined;
  CartTab:    undefined;
  OrdersTab:  undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home:              undefined;
  Notifications:     undefined;
  Product:           { id: string; promoDiscount?: number; promoId?: string };
  Category:          { id: string; name: string };
  Promotions:        undefined;
  PromotionDetail:   { id: string };
  Support:           undefined;
  Reviews:           { productId: string; productName: string };
};

export type CatalogStackParamList = {
  Catalog:  { category?: string; search?: string; brand?: string } | undefined;
  Category: { id: string; name: string };
  Product:  { id: string; promoDiscount?: number; promoId?: string };
  Contacts: undefined;
  Reviews:  { productId: string; productName: string };
};

export type CartStackParamList = {
  Cart:         undefined;
  Checkout:     undefined;
  Payment: {
    orderNumber:     string;
    orderId:         string;
    total:           number;
    subtotal:        number;
    bonusUsed:       number;
    deliveryType:    'pickup' | 'delivery';
    deliveryAddress: string;
    contactName:     string;
    contactPhone:    string;
    note:            string;
    items: Array<{
      name_ru: string;
      name_ky: string;
      price:   number;
      qty:     number;
      size:    string;
      color?:  string;
      image?:  string;
    }>;
  };
  OrderSuccess: {
    orderNumber:     string;
    orderId:         string;
    paymentMethod:   'cash' | 'online';
    total:           number;
    subtotal:        number;
    bonusUsed:       number;
    deliveryType:    'pickup' | 'delivery';
    deliveryAddress: string;
    contactName:     string;
    contactPhone:    string;
    note:            string;
    items: Array<{
      name_ru: string;
      name_ky: string;
      price:   number;
      qty:     number;
      size:    string;
      color?:  string;
      image?:  string;
    }>;
  };
};

export type OrdersStackParamList = {
  Orders:      undefined;
  OrderDetail: { id: string };
};

export type ProfileStackParamList = {
  Profile:        undefined;
  EditProfile:    undefined;
  Favorites:      undefined;
  Product:        { id: string; promoDiscount?: number; promoId?: string };
  Reviews:        { productId: string; productName: string };
  BonusCard:      undefined;
  StoreInfo:      undefined;
  FAQ:            undefined;
  ChangePassword: undefined;
};

