import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ShoppingCart, TrendingUp, TrendingDown, Users, AlertTriangle, Package, Trash2, Gift, UserPlus, XCircle, Receipt } from 'lucide-react';
import api from '../api/client';
import { toast } from '../components/Toast';
import { useIsMobile } from '../hooks/useIsMobile';

const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20,
  border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const STATUS_COLORS: Record<string, string> = {
  pending:   '#D97706',
  confirmed: '#2563EB',
  preparing: '#7C3AED',
  ready:     '#16A34A',
  cancelled: '#DC2626',
};

const StatCard = ({ icon: Icon, label, value, color, hint }: any) => (
  <div className="card-hover stat-card" style={{ ...card, flex: 1, minWidth: 140 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <span style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.3 }}>{label}</span>
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, color: '#1A1A1A' }}>{value}</div>
    {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
  </div>
);

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const lang   = i18n.language;
  const months = t('dashboard.months', { returnObjects: true }) as string[];
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearStats = async () => {
    setClearing(true);
    try {
      await api.delete('/orders/clear-all-stats');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('dashboard.clearSuccess'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setClearing(false);
      setShowConfirm(false);
    }
  };

  const isMobile = useIsMobile();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => api.get('/orders/dashboard').then(r => r.data.stats),
    refetchInterval: 30000,
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn:  () => api.get('/products/low-stock?threshold=3').then(r => r.data.products),
  });

  const stats       = data || {};
  const products    = lowStock || [];
  const topProducts = stats.topProducts || [];
  const growth      = stats.monthGrowth ?? 0;
  const isPositive  = growth >= 0;

  const monthlyChart = (stats.monthlyData || []).map((d: any) => {
    const [, m] = d._id.split('-');
    return { name: months[Number(m) - 1] || d._id, revenue: d.revenue, orders: d.orders };
  });

  const statusChart = (stats.statusCounts || []).map((s: any) => ({
    name: t(`orders.statuses.${s._id}`) || s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] || '#9CA3AF',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: '#1A1A1A', fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: 0 }}>{t('dashboard.title')}</h1>
        <button onClick={() => setShowConfirm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
            backgroundColor: '#FEE2E2', border: '1.5px solid #FECACA', borderRadius: 10,
            color: '#DC2626', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Trash2 size={15} /> {t('dashboard.clearStats')}
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div onClick={() => setShowConfirm(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} className="modal-in"
            style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%',
              border: '1px solid #E5E7EB', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><AlertTriangle size={36} color="#D97706" /></div>
            <h3 style={{ color: '#1A1A1A', textAlign: 'center', margin: '0 0 10px', fontWeight: 700 }}>
              {t('dashboard.clearConfirmTitle')}
            </h3>
            <p style={{ color: '#6B7280', textAlign: 'center', fontSize: 14, margin: '0 0 22px', lineHeight: 1.5 }}>
              {t('dashboard.clearConfirmText')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: 12, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
                  borderRadius: 10, color: '#1A1A1A', cursor: 'pointer', fontWeight: 500 }}>
                {t('dashboard.clearConfirmNo')}
              </button>
              <button onClick={handleClearStats} disabled={clearing}
                style={{ flex: 1, padding: 12, backgroundColor: '#DC2626', border: 'none',
                  borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 700,
                  opacity: clearing ? 0.7 : 1 }}>
                {clearing ? t('dashboard.clearingProgress') : t('dashboard.clearConfirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ padding: 48, textAlign: 'center', color: '#6B7280', fontSize: 14, backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB' }}>
          {t('common.loading')}
        </div>
      )}

      {/* Qator 1: Asosiy ko'rsatkichlar */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard icon={ShoppingCart} label={t('dashboard.todayOrders')}  value={stats.todayOrders ?? 0}              color="#FFD700" />
        <StatCard icon={TrendingUp}   label={t('dashboard.todayRevenue')} value={`${(stats.todayRevenue || 0).toLocaleString()} ${t('common.som')}`} color="#16A34A" />
        <StatCard icon={ShoppingCart} label={t('dashboard.totalOrders')}  value={stats.totalOrders ?? 0}              color="#2563EB" />
        <StatCard icon={Users}        label={t('dashboard.pendingOrders')} value={stats.pendingOrders ?? 0}           color="#D97706" />
      </div>

      {/* Qator 2: Qo'shimcha ko'rsatkichlar */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 12 }}>
        <StatCard
          icon={Gift}
          label={t('dashboard.bonusIssued')}
          value={`${(stats.bonusIssued || 0).toLocaleString()} ${t('common.som')}`}
          color="#7C3AED"
        />
        <StatCard
          icon={Receipt}
          label={t('dashboard.bonusUsed')}
          value={`${(stats.bonusUsed || 0).toLocaleString()} ${t('common.som')}`}
          color="#0891B2"
        />
        <StatCard
          icon={XCircle}
          label={t('dashboard.cancelRate')}
          value={`${stats.cancelRate ?? 0}%`}
          color="#DC2626"
          hint={t('dashboard.cancelRateHint')}
        />
        <StatCard
          icon={TrendingUp}
          label={t('dashboard.avgOrder')}
          value={`${(stats.avgOrder || 0).toLocaleString()} ${t('common.som')}`}
          color="#059669"
        />
        <StatCard
          icon={UserPlus}
          label={t('dashboard.newUsers')}
          value={stats.newUsersThisMonth ?? 0}
          color="#EA580C"
          hint={t('dashboard.newUsersHint')}
        />
      </div>

      {/* Monthly revenue + Top products */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Monthly revenue */}
        <div className="card-hover" style={card}>
          <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>{t('dashboard.monthlyRevenue')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>
            {(stats.thisMonthRevenue || 0).toLocaleString()} {t('common.som')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              backgroundColor: isPositive ? '#DCFCE7' : '#FEE2E2',
              color: isPositive ? '#16A34A' : '#DC2626',
            }}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isPositive ? '+' : ''}{growth}%
            </div>
            <span style={{ color: '#6B7280', fontSize: 12 }}>
              {t('dashboard.vsLastMonth')}: {(stats.lastMonthRevenue || 0).toLocaleString()} {t('common.som')}
            </span>
          </div>
        </div>

        {/* Top-5 products */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Package size={16} color="#16A34A" />
            <span style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 700 }}>{t('dashboard.topProducts')}</span>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', paddingTop: 12 }}>
              {t('dashboard.noSales')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProducts.map((p: any, i: number) => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 20, fontSize: 13, fontWeight: 700, color: i < 3 ? '#FFD700' : '#9CA3AF', flexShrink: 0 }}>
                    #{i + 1}
                  </span>
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lang === 'ky' ? (p.name_ky || p.name_ru) : p.name_ru}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: 11 }}>
                      {(p.price || 0).toLocaleString()} {t('common.som')}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', flexShrink: 0 }}>
                    {p.totalSold} {t('dashboard.soldCount')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 16 }}>

        {/* Bar chart — 6 month revenue */}
        <div style={card}>
          <h2 style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 700, margin: '0 0 20px' }}>
            {t('dashboard.revenueChart')}
          </h2>
          {monthlyChart.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 13 }}>
              {t('dashboard.noSales')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyChart} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 12 }} width={60}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}
                  formatter={(v: any) => [`${Number(v).toLocaleString()} ${t('common.som')}`, t('dashboard.revenueChart')]}
                />
                <Bar dataKey="revenue" fill="#FFD700" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut chart — orders status */}
        <div style={card}>
          <h2 style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>
            {t('dashboard.ordersChart')}
          </h2>
          {statusChart.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 13 }}>
              {t('dashboard.noSales')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={statusChart}
                  cx="50%" cy="45%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChart.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle" iconSize={9}
                  formatter={(value) => <span style={{ fontSize: 12, color: '#1A1A1A' }}>{value}</span>}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low stock */}
      {products.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} color="#D97706" />
            </div>
            <h2 style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 700, margin: 0 }}>{t('dashboard.lowStock')}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.slice(0, 5).map((p: any) => (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                <span style={{ color: '#1A1A1A', fontSize: 14 }}>
                  {lang === 'ky' ? (p.name_ky || p.name_ru) : p.name_ru}
                </span>
                <span style={{ color: '#92400E', fontSize: 12, fontWeight: 600,
                  backgroundColor: '#FEF9C3', padding: '3px 8px', borderRadius: 6 }}>
                  {(p.variants || []).filter((v: any) => v.stock < 3 && v.stock > 0)
                    .map((v: any) => `${v.size}: ${v.stock}`).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
