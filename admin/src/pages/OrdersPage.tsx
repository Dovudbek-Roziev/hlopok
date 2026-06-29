import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, Search, Phone, Trash2, MapPin, MessageSquare, Star, CreditCard, Banknote, Truck, Package, Check } from 'lucide-react';
import { toast } from '../components/Toast';
import { Confirm } from '../components/Confirm';
import { io } from 'socket.io-client';
import api from '../api/client';
import { useAdminStore } from '../store/adminStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { sizeLabelBoth } from '../utils/sizeLabel';

const STATUS_KEYS = ['pending','confirmed','preparing','ready','cancelled'];

// Badge style helper — rangli statuslar
const statusBadgeStyle = (status: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#FEF9C3', color: '#854D0E' },
    confirmed: { bg: '#DBEAFE', color: '#1E40AF' },
    preparing: { bg: '#EDE9FE', color: '#5B21B6' },
    ready:     { bg: '#DCFCE7', color: '#15803D' },
    cancelled: { bg: '#FEE2E2', color: '#991B1B' },
    delivered: { bg: '#CCFBF1', color: '#115E59' },
  };
  const s = map[status] || { bg: '#F3F4F6', color: '#6B7280' };
  return {
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' as const,
    backgroundColor: s.bg, color: s.color,
  };
};

// Filter button active color per status
const STATUS_FILTER_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  pending:   { bg: '#FEF9C3', border: '#FDE047', color: '#854D0E' },
  confirmed: { bg: '#DBEAFE', border: '#93C5FD', color: '#1E40AF' },
  preparing: { bg: '#EDE9FE', border: '#C4B5FD', color: '#5B21B6' },
  ready:     { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' },
  cancelled: { bg: '#FEE2E2', border: '#FCA5A5', color: '#991B1B' },
};

const card = { backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

const fmt = (n: number) => n?.toLocaleString('ru-RU') ?? '0';

const OrdersPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ky' ? 'ky-KG' : 'ru-RU';
  const isKy   = i18n.language === 'ky';
  const [filter, setFilter]             = useState('');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<any>(null);
  const [newStatus, setStatus]          = useState('');
  const [comment, setComment]           = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const queryClient = useQueryClient();
  const { token } = useAdminStore();
  const isMobile  = useIsMobile();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', filter],
    queryFn: () => api.get('/orders/all', { params: { status: filter || undefined, limit: 500 } }).then(r => r.data.orders),
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, comment, cancelReason }: any) =>
      api.put(`/orders/${id}/status`, { status, comment, cancelReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(t('orders.saved'));
      setSelected(null);
    },
    onError: () => toast.error(t('common.error')),
  });

  const confirmPayment = useMutation({
    mutationFn: (id: string) => api.put(`/orders/${id}/confirm-payment`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelected((prev: any) => prev?._id === id ? { ...prev, paymentConfirmed: true } : prev);
      toast.success(t('orders.paymentConfirmedOk'));
    },
    onError: () => toast.error(t('common.error')),
  });

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const socket = io(socketUrl, { auth: { token } });
    socket.on('connect', () => socket.emit('join_admin'));
    socket.on('new_order', () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }));
    return () => { socket.disconnect(); };
  }, [token]);

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', backgroundColor: '#F9FAFB',
    border: '1.5px solid #E5E7EB', borderRadius: 8, color: '#1A1A1A',
    fontSize: 14, marginBottom: 12, boxSizing: 'border-box',
  };

  const filtered = (data || []).filter((o: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      `${o.user?.firstName} ${o.user?.lastName}`.toLowerCase().includes(q) ||
      o.contactPhone?.includes(q) ||
      o.contactName?.toLowerCase().includes(q)
    );
  });

  const openOrder = (order: any) => {
    setSelected(order);
    setStatus(order.status);
    setComment('');
    setCancelReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('orders.title')}</h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '2px 0 0' }}>{filtered.length} {t('orders.count')}</p>
        </div>
        {(data || []).length > 0 && (
          <button onClick={() => setShowClearConfirm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              backgroundColor: '#FEE2E2', border: '1.5px solid #FECACA', borderRadius: 10,
              color: '#DC2626', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Trash2 size={15} /> {t('orders.clearOrders')}
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('orders.search')}
          style={{ width: '100%', padding: '11px 14px 11px 40px', backgroundColor: '#FFFFFF', border: '1.5px solid #E5E7EB',
            borderRadius: 10, color: '#1A1A1A', fontSize: 14, boxSizing: 'border-box' }} />
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('')}
          style={{ padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
            border: !filter ? '1.5px solid #1A1A1A' : '1.5px solid #E5E7EB',
            backgroundColor: !filter ? '#1A1A1A' : '#FFFFFF', color: !filter ? '#fff' : '#1A1A1A', fontSize: 13, fontWeight: 500 }}>
          {t('orders.all')}
        </button>
        {STATUS_KEYS.map(k => {
          const fc = STATUS_FILTER_COLORS[k];
          const isActive = filter === k;
          return (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${isActive ? fc.border : '#E5E7EB'}`,
                backgroundColor: isActive ? fc.bg : '#FFFFFF',
                color: isActive ? fc.color : '#6B7280' }}>
              {t(`orders.statuses.${k}`)}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#6B7280', backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 14 }}>
          {t('common.loading')}
        </div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              {t('orders.noOrders')}
            </div>
          )}
          {filtered.map((order: any) => (
            <div key={order._id} onClick={() => openOrder(order)}
              style={{ ...card, padding: '14px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#1A1A1A' }}>
                  #{order.orderNumber}
                </span>
                <span style={statusBadgeStyle(order.status)}>
                  {t(`orders.statuses.${order.status}`)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                    {order.contactName || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || '—'}
                  </div>
                  {order.contactPhone && (
                    <a href={`tel:${order.contactPhone}`} onClick={e => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16A34A', fontSize: 12, textDecoration: 'none', marginTop: 2 }}>
                      <Phone size={11} />{order.contactPhone}
                    </a>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#16A34A' }}>
                    {fmt(order.total)} {t('common.som')}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    {new Date(order.createdAt).toLocaleDateString(locale)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  backgroundColor: order.deliveryType === 'delivery' ? '#DBEAFE' : '#DCFCE7',
                  color: order.deliveryType === 'delivery' ? '#1E40AF' : '#15803D' }}>
                  {order.deliveryType === 'delivery' ? t('orders.deliveryType') : t('orders.pickupType')}
                </span>
                {order.paymentMethod === 'online' ? (
                  order.paymentConfirmed ? (
                    <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      backgroundColor: '#DCFCE7', color: '#15803D', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Check size={11} />{t('orders.paymentConfirmed')}
                    </span>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); confirmPayment.mutate(order._id); }}
                      style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1.5px solid #93C5FD', cursor: 'pointer' }}>
                      {t('orders.confirmPayment')}
                    </button>
                  )
                ) : (
                  <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    backgroundColor: '#DCFCE7', color: '#15803D' }}>
                    {t('orders.cash')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                  {[t('orders.number'), t('orders.client'), t('orders.phone'), t('orders.total'), t('orders.delivery'), t('orders.payment'), t('orders.status'), t('orders.date'), ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 14px', textAlign: 'left', color: '#9CA3AF', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order: any) => (
                  <tr key={order._id} className="tr-hover tr-clickable" style={{ borderBottom: '1px solid #F3F4F6' }}
                    onClick={() => openOrder(order)}>
                    <td style={{ padding: '13px 14px', color: '#1A1A1A', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
                      {order.orderNumber}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 500 }}>
                        {order.contactName || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      {order.contactPhone ? (
                        <a href={`tel:${order.contactPhone}`} onClick={e => e.stopPropagation()}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16A34A', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                          <Phone size={12} />{order.contactPhone}
                        </a>
                      ) : <span style={{ color: '#9CA3AF', fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 14px', color: '#16A34A', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {fmt(order.total)} {t('common.som')}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        backgroundColor: order.deliveryType === 'delivery' ? '#DBEAFE' : '#DCFCE7',
                        color: order.deliveryType === 'delivery' ? '#1E40AF' : '#15803D' }}>
                        {order.deliveryType === 'delivery' ? t('orders.deliveryType') : t('orders.pickupType')}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px' }} onClick={e => e.stopPropagation()}>
                      {order.paymentMethod === 'online' ? (
                        order.paymentConfirmed ? (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            backgroundColor: '#DCFCE7', color: '#15803D', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Check size={11} />{t('orders.paymentConfirmed')}
                          </span>
                        ) : (
                          <button onClick={() => confirmPayment.mutate(order._id)}
                            style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1.5px solid #93C5FD',
                              cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {t('orders.confirmPayment')}
                          </button>
                        )
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          backgroundColor: '#DCFCE7', color: '#15803D', whiteSpace: 'nowrap' }}>
                          {t('orders.cash')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={statusBadgeStyle(order.status)}>
                        {t(`orders.statuses.${order.status}`)}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', color: '#9CA3AF', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(order.createdAt).toLocaleDateString(locale)}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      {!['ready', 'delivered', 'cancelled'].includes(order.status) && (
                        <button onClick={e => { e.stopPropagation(); openOrder(order); }}
                          style={{ padding: '6px 14px', backgroundColor: '#FFD700', border: 'none',
                            borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#1A1A1A', whiteSpace: 'nowrap' }}>
                          {t('orders.change')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>{t('orders.noOrders')}</div>
          )}
        </div>
      )}

      {showClearConfirm && (
        <Confirm
          message={t('orders.clearOrdersConfirm')}
          onConfirm={async () => {
            setShowClearConfirm(false);
            try {
              await api.delete('/orders/all');
              queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
              toast.success(t('orders.clearOrders'));
            } catch {
              toast.error(t('common.error'));
            }
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {/* Order detail modal */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 500,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 520, backgroundColor: '#FFFFFF', borderRadius: 16,
              border: '1px solid #E5E7EB', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 20px 14px', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0,
              backgroundColor: '#FFFFFF', zIndex: 1 }}>
              <div>
                <h3 style={{ color: '#1A1A1A', margin: 0, fontSize: 17, fontWeight: 700 }}>
                  {t('orders.orderDetail')}
                </h3>
                <p style={{ color: '#6B7280', fontSize: 13, margin: '3px 0 0', fontFamily: 'monospace' }}>
                  #{selected.orderNumber}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Contact block */}
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                  {t('orders.contactInfo')}
                </div>
                <div style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 600 }}>
                  {selected.contactName || `${selected.user?.firstName || ''} ${selected.user?.lastName || ''}`.trim() || '—'}
                </div>
                {selected.contactPhone && (
                  <a href={`tel:${selected.contactPhone}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16A34A', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                    <Phone size={14} />{selected.contactPhone}
                  </a>
                )}
                {selected.deliveryType === 'delivery' && selected.deliveryAddress && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: '#2563EB', fontSize: 13 }}>
                    <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{selected.deliveryAddress}</span>
                  </div>
                )}
              </div>

              {/* Delivery + Payment badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  backgroundColor: selected.deliveryType === 'delivery' ? '#DBEAFE' : '#DCFCE7',
                  color: selected.deliveryType === 'delivery' ? '#1E40AF' : '#15803D' }}>
                  {selected.deliveryType === 'delivery' ? <Truck size={13} /> : <Package size={13} />}
                  {selected.deliveryType === 'delivery' ? t('orders.deliveryType') : t('orders.pickupType')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  backgroundColor: selected.paymentMethod === 'online' ? '#DBEAFE' : '#DCFCE7',
                  color: selected.paymentMethod === 'online' ? '#1E40AF' : '#15803D' }}>
                  {selected.paymentMethod === 'online' ? <CreditCard size={13} /> : <Banknote size={13} />}
                  {selected.paymentMethod === 'online' ? t('orders.online') : t('orders.cash')}
                </span>
                {selected.paymentMethod === 'online' && (
                  selected.paymentConfirmed ? (
                    <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      backgroundColor: '#DCFCE7', color: '#15803D', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} />{t('orders.paymentConfirmed')}
                    </span>
                  ) : (
                    <button onClick={() => confirmPayment.mutate(selected._id)}
                      style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        backgroundColor: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      {t('orders.confirmPayment')}
                    </button>
                  )
                )}
              </div>

              {/* Items */}
              {selected.items?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>
                    {t('orders.items')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selected.items.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                        backgroundColor: '#F9FAFB', borderRadius: 8, padding: '8px 10px' }}>
                        {item.image && (
                          <img src={item.image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isKy ? (item.name_ky || item.name_ru) : (item.name_ru || '—')}
                          </div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                            {sizeLabelBoth(item.size)}{item.color ? ` · ${item.color}` : ''} · {item.qty} {t('common.pcs')}
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', flexShrink: 0 }}>
                          {fmt(item.price * item.qty)} {t('common.som')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.bonusUsed > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
                      <Star size={13} color="#FFD700" fill="#FFD700" /> {t('orders.bonusUsed')}
                    </span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>-{fmt(selected.bonusUsed)} {t('common.som')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#16A34A', fontWeight: 600 }}>{t('orders.total')}</span>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#16A34A' }}>{fmt(selected.total)} {t('common.som')}</span>
                </div>
              </div>

              {/* Note */}
              {selected.note && (
                <div style={{ backgroundColor: '#FEF9C3', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400E',
                  display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <MessageSquare size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{selected.note}</span>
                </div>
              )}

              {/* Status change */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 14 }}>
                {selected.status === 'cancelled' ? (
                  <div style={{ backgroundColor: '#FEF2F2', borderRadius: 10, padding: '12px 14px',
                    color: '#DC2626', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                    {t('orders.statuses.cancelled')}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10 }}>
                      {t('orders.changeStatus')}
                    </div>
                    <select value={newStatus} onChange={e => setStatus(e.target.value)} style={{ ...inp, marginBottom: 10 }}>
                      {STATUS_KEYS.map(k => (
                        <option key={k} value={k}>{t(`orders.statuses.${k}`)}</option>
                      ))}
                    </select>
                    {newStatus === 'cancelled' && (
                      <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                        placeholder={t('orders.cancelReason')} style={inp} />
                    )}
                    <input value={comment} onChange={e => setComment(e.target.value)}
                      placeholder={t('orders.comment')} style={{ ...inp, marginBottom: 16 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setSelected(null)}
                        style={{ flex: 1, padding: 12, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
                          borderRadius: 10, color: '#1A1A1A', cursor: 'pointer', fontWeight: 500 }}>
                        {t('orders.cancel')}
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: selected._id, status: newStatus, comment, cancelReason })}
                        disabled={updateStatus.isPending}
                        style={{ flex: 1, padding: 12, backgroundColor: '#16A34A', border: 'none',
                          borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#fff',
                          opacity: updateStatus.isPending ? 0.7 : 1 }}>
                        {updateStatus.isPending ? t('orders.saving') : t('orders.save')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
