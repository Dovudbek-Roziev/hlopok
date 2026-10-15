import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdminStore } from './store/adminStore';
import { ToastProvider } from './components/Toast';
import Layout from './components/layout/Layout';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const BonusPage = lazy(() => import('./pages/BonusPage'));
const BannersPage = lazy(() => import('./pages/BannersPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, admin } = useAdminStore();
  return (token && admin?.role === 'admin') ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
    <BrowserRouter>
      <Suspense fallback={<div role="status" style={{ padding: 24 }}>…</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="bonus" element={<BonusPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="faq" element={<FAQPage />} />
        </Route>
        <Route path="/delete-account" element={<PrivacyPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    </BrowserRouter>
    </ToastProvider>
  </QueryClientProvider>
);

export default App;
