import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.jpg';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Gift,
  Image, Grid3X3, Award, Tag, Settings, LogOut, Warehouse, HelpCircle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminStore } from '../../store/adminStore';

const MENU = [
  { path: '/',           icon: LayoutDashboard, key: 'sidebar.dashboard',  group: 1 },
  { path: '/orders',     icon: ShoppingCart,    key: 'sidebar.orders',     group: 1 },
  { path: '/products',   icon: Package,         key: 'sidebar.products',   group: 2 },
  { path: '/inventory',  icon: Warehouse,       key: 'sidebar.inventory',  group: 2 },
  { path: '/promotions', icon: Tag,             key: 'sidebar.promotions', group: 2 },
  { path: '/categories', icon: Grid3X3,         key: 'sidebar.categories', group: 2 },
  { path: '/brands',     icon: Award,           key: 'sidebar.brands',     group: 2 },
  { path: '/banners',    icon: Image,           key: 'sidebar.banners',    group: 2 },
  { path: '/users',      icon: Users,           key: 'sidebar.users',      group: 3 },
  { path: '/bonus',      icon: Gift,            key: 'sidebar.bonus',      group: 3 },
  { path: '/faq',        icon: HelpCircle,      key: 'sidebar.faq',        group: 3 },
  { path: '/settings',   icon: Settings,        key: 'sidebar.settings',   group: 3 },
];

const GROUP_LABEL_KEYS: Record<number, string> = {
  1: 'nav.main',
  2: 'nav.catalog',
  3: 'nav.settings',
};

const Sidebar = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { t }       = useTranslation();
  const queryClient = useQueryClient();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname === path;

  const groups = [1, 2, 3];

  return (
    <div style={{
      width: 240, height: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
      overflowY: 'auto',
      boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
    }} className="hide-scroll">

      {/* Logo */}
      <div style={{
        padding: '18px 20px 16px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', gap: 12,
        backgroundColor: '#FFFFFF',
      }}>
        <img src={logo} alt="Хлопок" style={{
          width: 38, height: 38, borderRadius: 10, objectFit: 'cover',
          border: '1px solid #E5E7EB',
        }} />
        <div>
          <div style={{
            fontSize: 16, fontWeight: 800, color: '#111827',
            letterSpacing: -0.3, lineHeight: 1.2,
          }}>
            Хлопок
          </div>
          <div style={{
            fontSize: 10, color: '#9CA3AF', marginTop: 2,
            letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600,
          }}>
            Admin Panel
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }} className="hide-scroll">
        {groups.map(g => {
          const items = MENU.filter(m => m.group === g);
          return (
            <div key={g} style={{ marginBottom: 4 }}>
              <div style={{
                padding: '10px 20px 4px',
                fontSize: 10, fontWeight: 700, color: '#9CA3AF',
                letterSpacing: 1.4, textTransform: 'uppercase',
              }}>
                {t(GROUP_LABEL_KEYS[g])}
              </div>
              {items.map(item => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      margin: '2px 10px', padding: '10px 13px',
                      borderRadius: 10, textDecoration: 'none',
                      color: active ? '#111827' : '#6B7280',
                      backgroundColor: active ? '#FFFDE7' : 'transparent',
                      borderLeft: active ? '3px solid #FFD700' : '3px solid transparent',
                      fontSize: 13.5, fontWeight: active ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e: any) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                    onMouseLeave={(e: any) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6B7280';
                      }
                    }}
                  >
                    <item.icon size={17} />
                    {t(item.key)}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={() => { queryClient.clear(); useAdminStore.getState().logout(); navigate('/login'); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', border: 'none',
            backgroundColor: '#FEF2F2',
            color: '#B91C1C', cursor: 'pointer', fontSize: 13.5, borderRadius: 10,
            fontWeight: 500, transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FECACA')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
        >
          <LogOut size={16} />
          {t('sidebar.logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
