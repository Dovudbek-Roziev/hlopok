import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, X, QrCode, Smartphone, Gift, TrendingUp, Wallet, Users, Settings, Save } from 'lucide-react';
import api from '../api/client';
import { toast } from '../components/Toast';
import QRScanner from '../components/QRScanner';
import { useIsMobile } from '../hooks/useIsMobile';

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: '#F9FAFB',
  border: '1.5px solid #E5E7EB', borderRadius: 10, color: '#1A1A1A',
  fontSize: 14, boxSizing: 'border-box', outline: 'none',
};
const lbl: React.CSSProperties = { color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' };

const TX_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  earned:    { bg: '#DCFCE7', color: '#16A34A', label: '' },
  used:      { bg: '#FEE2E2', color: '#DC2626', label: '' },
  refund:    { bg: '#DBEAFE', color: '#2563EB', label: '' },
  admin_add: { bg: '#FEF9C3', color: '#CA8A04', label: '' },
  expired:   { bg: '#F3F4F6', color: '#6B7280', label: '' },
};

const BonusPage = () => {
  const { t, i18n } = useTranslation();
  const locale   = i18n.language === 'ky' ? 'ky-KG' : 'ru-RU';
  const isMobile = useIsMobile();
  const [showAdd, setShowAdd]         = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [userId, setUserId]           = useState('');
  const [scannedName, setScannedName] = useState('');
  const [amount, setAmount]           = useState('');
  const [reason, setReason]           = useState('');
  const [userSearch, setUserSearch]   = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['bonus-settings'],
    queryFn: () => api.get('/bonus/settings').then(r => r.data.settings),
  });

  const { data: txData } = useQuery({
    queryKey: ['bonus-transactions'],
    queryFn: () => api.get('/bonus/transactions?limit=100').then(r => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-short'],
    queryFn: () => api.get('/admin/users?limit=500').then(r => r.data.users),
  });

  const [bonusForm, setBonusForm] = useState({
    bonusPercent: settings?.bonusPercent ?? 5,
    expiryDays:   settings?.expiryDays   ?? 90,
    warningDays:  settings?.warningDays  ?? 7,
  });

  React.useEffect(() => {
    if (settings) setBonusForm({
      bonusPercent: settings.bonusPercent,
      expiryDays:   settings.expiryDays,
      warningDays:  settings.warningDays,
    });
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: (data: any) => api.put('/bonus/settings', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bonus-settings'] }); toast.success(t('bonus.settingsSaved')); },
    onError: () => toast.error(t('common.error')),
  });

  const addBonus = useMutation({
    mutationFn: () => api.post('/bonus/add', { userId, amount: Number(amount), note: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-transactions'] });
      setShowAdd(false); setUserId(''); setAmount(''); setReason('');
      setScannedName(''); setSelectedUser(null); setUserSearch(''); setShowUserList(false);
      toast.success(t('bonus.addSuccess'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const handleQRScan = async (qrText: string) => {
    setShowScanner(false);
    if (!qrText.startsWith('hlopok:bonus:')) { toast.error(t('bonus.invalidQR')); return; }
    try {
      const res = await api.post('/bonus/find-by-qr', { qrData: qrText });
      const u = res.data.user;
      setUserId(u._id);
      setScannedName(`${u.firstName} ${u.lastName} (${u.email})`);
      setShowAdd(true);
      toast.success(t('bonus.qrFound', { name: `${u.firstName} ${u.lastName}` }));
    } catch { toast.error(t('bonus.qrNotFound')); }
  };

  const transactions  = txData?.transactions || [];
  const users         = usersData || [];

  const totalGiven = transactions.filter((tx: any) => tx.type === 'earned' || tx.type === 'admin_add').reduce((s: number, tx: any) => s + tx.amount, 0);
  const totalRefunded = transactions.filter((tx: any) => tx.type === 'refund').reduce((s: number, tx: any) => s + tx.amount, 0);
  const totalUsed  = Math.max(0, transactions.filter((tx: any) => tx.type === 'used').reduce((s: number, tx: any) => s + tx.amount, 0) - totalRefunded);
  const usersWithBonus = new Set(transactions.map((tx: any) => tx.user?._id)).size;

  const filteredUsers = users.filter((u: any) => {
    const q = userSearch.toLowerCase();
    return (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) ||
      (u.phone || '').includes(q) || (u.email || '').toLowerCase().includes(q);
  }).slice(0, 20);

  const selectUser = (u: any) => { setUserId(u._id); setSelectedUser(u); setUserSearch(''); setShowUserList(false); };
  const clearUser  = ()       => { setUserId(''); setSelectedUser(null); setUserSearch(''); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('bonus.title')}</h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '3px 0 0' }}>{t('bonus.cashback')} {bonusForm.bonusPercent}% · {t('bonus.expiryDays')} {bonusForm.expiryDays}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowScanner(true)}
            title={t('bonus.scanQR')}
            style={{ display: 'flex', alignItems: 'center', gap: 7,
              padding: isMobile ? '10px 12px' : '10px 18px',
              backgroundColor: '#1A1A1A', border: 'none', borderRadius: 10,
              color: '#FFD700', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            <QrCode size={16} /> {!isMobile && t('bonus.scanQR')}
          </button>
          <button onClick={() => { setUserId(''); setScannedName(''); setSelectedUser(null); setUserSearch(''); setShowUserList(false); setShowAdd(true); }}
            title={t('bonus.add')}
            style={{ display: 'flex', alignItems: 'center', gap: 7,
              padding: isMobile ? '10px 12px' : '10px 18px',
              backgroundColor: '#FFD700', border: 'none', borderRadius: 10,
              color: '#1A1A1A', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            <Plus size={16} /> {!isMobile && t('bonus.add')}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { icon: Gift,      color: '#16A34A', bg: '#DCFCE7', label: t('bonus.totalGiven'), value: `${totalGiven.toLocaleString()} ${t('common.som')}` },
          { icon: Wallet,    color: '#DC2626', bg: '#FEE2E2', label: t('bonus.totalUsed'),  value: `${totalUsed.toLocaleString()} ${t('common.som')}` },
          { icon: Users,     color: '#2563EB', bg: '#DBEAFE', label: t('bonus.activeUsers'),value: `${usersWithBonus}` },
        ].map(({ icon: Icon, color, bg, label, value }) => (
          <div key={label} className="card-hover stat-card" style={{ backgroundColor: '#fff', borderRadius: 14, padding: '18px 20px',
            border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 3 }}>{label}</div>
              <div style={{ color: '#1A1A1A', fontSize: 20, fontWeight: 700 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Settings ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={16} color="#6B7280" />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A' }}>{t('bonus.settings')}</span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, maxWidth: isMobile ? '100%' : 520 }}>
            {[
              { label: t('bonus.cashbackPercent'), key: 'bonusPercent', suffix: '%' },
              { label: t('bonus.expiryDays'),      key: 'expiryDays',   suffix: t('bonus.days') },
              { label: t('bonus.warningDays'),      key: 'warningDays',  suffix: t('bonus.days') },
            ].map(({ label, key, suffix }) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" value={(bonusForm as any)[key]} style={{ ...inp, paddingRight: 36 }}
                    onChange={e => setBonusForm(f => ({ ...f, [key]: Number(e.target.value) }))} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: '#9CA3AF', fontSize: 13, fontWeight: 600 }}>{suffix}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => updateSettings.mutate(bonusForm)} disabled={updateSettings.isPending}
            style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
              backgroundColor: '#1A1A1A', border: 'none', borderRadius: 10,
              color: '#FFD700', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <Save size={15} />
            {updateSettings.isPending ? t('bonus.saving') : t('bonus.save')}
          </button>
        </div>
      </div>

      {/* ── Transactions ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="#6B7280" />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A' }}>{t('bonus.transactions')}</span>
          </div>
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>{transactions.length} {t('common.pcs')}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                {[t('bonus.user'), t('bonus.type'), t('bonus.amount'), t('bonus.reason'), t('bonus.date')].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', color: '#9CA3AF', fontSize: 11, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => {
                const style = TX_COLOR[tx.type] || TX_COLOR.earned;
                const isNeg = tx.type === 'used' || tx.type === 'expired';
                return (
                  <tr key={tx._id} className="tr-hover" style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEF9C3',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: '#92400E', fontSize: 13, flexShrink: 0 }}>
                          {tx.user?.firstName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 500 }}>{tx.user?.firstName} {tx.user?.lastName}</div>
                          <div style={{ color: '#9CA3AF', fontSize: 12 }}>{tx.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        backgroundColor: style.bg, color: style.color }}>
                        {i18n.exists(`bonus.types.${tx.type}`) ? t(`bonus.types.${tx.type}`) : tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: isNeg ? '#DC2626' : '#16A34A' }}>
                        {isNeg ? '−' : '+'}{(tx.amount || 0).toLocaleString()} {t('common.som')}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', color: '#6B7280', fontSize: 13 }}>
                      {tx.order?.orderNumber ? `#${tx.order.orderNumber}` : tx.description_ru || '—'}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#9CA3AF', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(tx.createdAt).toLocaleDateString(locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
            <Gift size={32} color="#E5E7EB" style={{ marginBottom: 8 }} />
            <div>{t('bonus.noTransactions')}</div>
          </div>
        )}
      </div>

      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}

      {/* ── Add bonus modal ── */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.12)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
          <div onClick={e => e.stopPropagation()} className="modal-in"
            style={{ width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 20,
              border: '1px solid #E5E7EB', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>

            {/* Modal header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#1A1A1A' }}>{t('bonus.addTitle')}</div>
                {selectedUser && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{selectedUser.firstName} {selectedUser.lastName}</div>}
              </div>
              <button onClick={() => setShowAdd(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* User selector */}
              <div>
                <label style={lbl}>{t('bonus.userId')}</label>
                {scannedName ? (
                  <div style={{ padding: '10px 14px', backgroundColor: '#DCFCE7', border: '1.5px solid #86EFAC',
                    borderRadius: 10, color: '#16A34A', fontSize: 14, fontWeight: 500,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Smartphone size={15} /> {scannedName}</span>
                    <button onClick={() => { setScannedName(''); setUserId(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : selectedUser ? (
                  <div style={{ padding: '10px 14px', backgroundColor: '#DCFCE7', border: '1.5px solid #86EFAC',
                    borderRadius: 10, color: '#16A34A', fontSize: 14, fontWeight: 500,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{selectedUser.firstName} {selectedUser.lastName} · {selectedUser.phone || selectedUser.email}</span>
                    <button onClick={clearUser} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input style={inp} placeholder={t('users.search')} value={userSearch}
                      onChange={e => { setUserSearch(e.target.value); setShowUserList(true); }}
                      onFocus={() => setShowUserList(true)} />
                    {showUserList && filteredUsers.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4,
                        border: '1.5px solid #E5E7EB', borderRadius: 10, backgroundColor: '#fff',
                        maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
                        {filteredUsers.map((u: any) => (
                          <div key={u._id} onClick={() => selectUser(u)}
                            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F9FAFB', fontSize: 14 }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                            <div style={{ fontWeight: 500, color: '#1A1A1A' }}>{u.firstName} {u.lastName}</div>
                            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{u.phone || u.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label style={lbl}>{t('bonus.amountLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" style={{ ...inp, paddingRight: 50 }} value={amount}
                    onChange={e => setAmount(e.target.value)} placeholder="0" />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#9CA3AF', fontSize: 13, fontWeight: 600 }}>{t('common.som')}</span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={lbl}>{t('bonus.reasonLabel')}</label>
                <input style={inp} value={reason} onChange={e => setReason(e.target.value)}
                  placeholder={t('bonus.reasonPlaceholder')} />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowAdd(false)}
                  style={{ flex: 1, padding: 12, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
                    borderRadius: 10, color: '#1A1A1A', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  {t('bonus.cancel')}
                </button>
                <button onClick={() => addBonus.mutate()} disabled={!userId || Number(amount) <= 0 || addBonus.isPending}
                  style={{ flex: 1, padding: 12, backgroundColor: '#FFD700', border: 'none', borderRadius: 10,
                    fontWeight: 700, cursor: 'pointer', color: '#1A1A1A', fontSize: 14,
                    opacity: !userId || Number(amount) <= 0 ? 0.5 : 1 }}>
                  {addBonus.isPending ? t('bonus.saving') : t('bonus.add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusPage;
