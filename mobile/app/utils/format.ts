// Formatlash yordamchi funksiyalari / Formatting utility functions

// Narxni formatlash / Format price
export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('ru-RU')} сом`;
};

// Sanani formatlash / Format date
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

// Vaqtni formatlash / Format datetime
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// Initsialni olish (Avatar uchun) / Get initials for avatar
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

// Telefon raqamni formatlash: 0555123456 → 0555 12 34 56
export const formatPhone = (phone: string): string => {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0,4)} ${d.slice(4,6)} ${d.slice(6,8)} ${d.slice(8)}`;
  if (d.length === 9)  return `${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,7)} ${d.slice(7)}`;
  return phone;
};

// Faqat raqam qoldirish (input uchun) / Strip non-digits for phone input
export const cleanPhone = (value: string): string =>
  value.replace(/\D/g, '').slice(0, 10);
