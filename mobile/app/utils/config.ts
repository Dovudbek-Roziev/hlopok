// API va app sozlamalari / API and app configuration
// .env faylida EXPO_PUBLIC_API_URL va EXPO_PUBLIC_SOCKET_URL ni to'ldiring
// Misol: EXPO_PUBLIC_API_URL=https://hlopok-api.onrender.com/api
// LOCAL TEST: kompyuter IP si (deploy bo'lgach Vercel URL ga o'zgartiriladi)
const API_URL    = process.env.EXPO_PUBLIC_API_URL    || 'http://10.233.108.147:5001/api';
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://10.233.108.147:5001';

export { API_URL, SOCKET_URL };
