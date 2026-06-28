import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Globe, LayoutDashboard, ShoppingCart, Package, Gift, Settings, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import Sidebar from './Sidebar';
import { useAdminStore } from '../../store/adminStore';

const MOBILE_MENU = [
  { path: '/',         key: 'sidebar.dashboard',  Icon: LayoutDashboard },
  { path: '/orders',   key: 'sidebar.orders',     Icon: ShoppingCart },
  { path: '/products', key: 'sidebar.products',   Icon: Package },
  { path: '/bonus',    key: 'sidebar.bonus',      Icon: Gift },
  { path: '/settings', key: 'sidebar.settings',   Icon: Settings },
];

const PAGE_TITLES: Record<string, string> = {
  '/':           'sidebar.dashboard',
  '/orders':     'sidebar.orders',
  '/products':   'sidebar.products',
  '/inventory':  'sidebar.inventory',
  '/promotions': 'sidebar.promotions',
  '/categories': 'sidebar.categories',
  '/brands':     'sidebar.brands',
  '/banners':    'sidebar.banners',
  '/users':      'sidebar.users',
  '/bonus':      'sidebar.bonus',
  '/faq':        'sidebar.faq',
  '/settings':   'sidebar.settings',
};

const SIDEBAR_W = 240;

const useIsDesktop = () => {
  const [ok, setOk] = useState(typeof window !== 'undefined' && window.innerWidth >= 900);
  useEffect(() => {
    const h = () => setOk(window.innerWidth >= 900);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return ok;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

const Layout = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { t, i18n } = useTranslation();
  const isDesktop  = useIsDesktop();
  const { token, newOrderCount, addNewOrder, clearNewOrders } = useAdminStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on('new_order', () => addNewOrder());
    return () => { socket.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (location.pathname === '/orders') clearNewOrders();
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleLang = () => {
    const next = i18n.language === 'ru' ? 'ky' : 'ru';
    i18n.changeLanguage(next);
    localStorage.setItem('admin_lang', next);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F6F8' }}>

      {/* Mobile overlay */}
      {!isDesktop && mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.08)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 150,
        }} />
      )}

      {/* Sidebar spacer (desktop only) */}
      {isDesktop && <div style={{ width: SIDEBAR_W, flexShrink: 0 }} />}

      {/* Fixed sidebar */}
      <div style={{
        position: 'fixed', top: 0, left: isDesktop ? 0 : (mobileOpen ? 0 : -SIDEBAR_W - 4),
        width: SIDEBAR_W, height: '100vh', zIndex: 200,
        transition: 'left 0.22s ease',
        boxShadow: isDesktop ? '1px 0 0 #E5E7EB' : (mobileOpen ? '4px 0 20px rgba(0,0,0,0.10)' : 'none'),
      }}>
        <Sidebar />
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>

        {/* Top bar */}
        <div style={{
          height: 56, backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', paddingInline: 20,
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          {/* Mobile hamburger */}
          {!isDesktop && (
            <button onClick={() => setMobileOpen(o => !o)} style={{
              background: 'none', border: 'none', color: '#111827',
              cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex',
            }}>
              <Menu size={22} />
            </button>
          )}
          {isDesktop && (
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', paddingLeft: 4 }}>
              {t(PAGE_TITLES[location.pathname] || 'sidebar.dashboard')}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleLang} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              borderRadius: 20, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
              color: '#111827', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <Globe size={14} />
              {i18n.language === 'ru' ? t('common.langKy') : t('common.langRu')}
            </button>

            <button onClick={() => navigate('/orders')} style={{
              position: 'relative', background: 'none', border: 'none',
              cursor: 'pointer', padding: 8, borderRadius: 8, color: '#6B7280', display: 'flex',
            }}>
              <Bell size={20} />
              {newOrderCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16,
                  borderRadius: 8, backgroundColor: '#EF4444', color: '#fff',
                  fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: '0 3px',
                }}>
                  {newOrderCount > 99 ? '99+' : newOrderCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: isDesktop ? '24px 28px' : '14px 12px' }}>
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>

        {/* Mobile bottom nav */}
        {!isDesktop && (
          <div style={{
            display: 'flex', position: 'sticky', bottom: 0, zIndex: 100,
            backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB',
            padding: '4px 0', boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
          }}>
            {MOBILE_MENU.map(({ path, key, Icon }) => {
              const active = location.pathname === path;
              return (
                <button key={path} onClick={() => navigate(path)} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
                  color: active ? '#92400E' : '#9CA3AF',
                }}>
                  <Icon size={21} />
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{t(key)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
