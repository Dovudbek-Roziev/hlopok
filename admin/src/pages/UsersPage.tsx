import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, UserX, UserCheck, X, Phone, Gift } from 'lucide-react';
import api from '../api/client';
import { toast } from '../components/Toast';
import { Confirm } from '../components/Confirm';

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 8, color: '#1A1A1A', fontSize: 13, boxSizing: 'border-box' };

const UsersPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ky' ? 'ky-KG' : 'ru-RU';
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState<any>(null);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [bonusLoading, setBonusLoading] = useState(false);
  const queryClient = useQueryClient();

  const PER_PAGE = 50;

  const { data: resp } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(PER_PAGE), page: String(page) });
      if (search.trim()) params.set('search', search.trim());
      return api.get(`/admin/users?${params}`).then(r => r.data);
    },
    placeholderData: keepPreviousData,
  });

  const data = resp?.users;
  const totalPages = resp?.pagination ? Math.ceil(resp.pagination.total / PER_PAGE) : 1;

  const blockMutation = useMutation({
    mutationFn: (u: any) => api.put(`/admin/users/${u._id}/block`),
    onSuccess: (_, u) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'], exact: false });
      toast.success(u.isActive ? t('users.blocked_ok') : t('users.unblocked_ok'));
    },
    onError: () => toast.error(t('common.error')),
  });


  const addBonus = async () => {
    if (!bonusAmount || Number(bonusAmount) <= 0) { toast.error(t('bonus.amountRequired')); return; }
    setBonusLoading(true);
    try {
      await api.post('/bonus/add', { userId: selected._id, amount: Number(bonusAmount), note: bonusReason || undefined });
      queryClient.invalidateQueries({ queryKey: ['admin-users'], exact: false });
      toast.success(t('bonus.addSuccess'));
      setBonusAmount(''); setBonusReason(''); setSelected(null);
    } catch { toast.error(t('common.error')); }
    finally { setBonusLoading(false); }
  };

  const filtered = data || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('users.title')}</h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '2px 0 0' }}>{resp?.pagination?.total ?? filtered.length} {t('users.count')}</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={t('users.search')}
          style={{ width: '100%', padding: '11px 14px 11px 40px', backgroundColor: '#FFFFFF', border: '1.5px solid #E5E7EB',
            borderRadius: 10, color: '#1A1A1A', fontSize: 14, boxSizing: 'border-box' }} />
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                {[t('users.name'), t('users.bonus'), t('users.status'), ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', color: '#9CA3AF', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => (
                <tr key={u._id} className="tr-hover" style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt="" style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF9C3',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: '#92400E', fontSize: 14, flexShrink: 0 }}>
                          {u.firstName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <div style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                        <div style={{ color: '#6B7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} />
                          {u.phone ? u.phone.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4') : '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#16A34A', fontSize: 14, fontWeight: 700 }}>{(u.bonusBalance || 0).toLocaleString()}</div>
                    {u.totalSaved > 0 && <div style={{ color: '#6B7280', fontSize: 11 }}>{t('users.saved')}: {u.totalSaved?.toLocaleString()}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      backgroundColor: u.isActive ? '#DCFCE7' : '#FEE2E2',
                      color: u.isActive ? '#15803D' : '#991B1B' }}>
                      {u.isActive ? t('users.active') : t('users.blocked')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setSelected(u); setBonusAmount(''); setBonusReason(''); }}
                        title={t('bonus.addTitle')}
                        style={{ padding: '6px 10px', backgroundColor: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 8, cursor: 'pointer', color: '#92400E' }}>
                        <Gift size={15} />
                      </button>
                      <button onClick={() => blockMutation.mutate(u)}
                        disabled={blockMutation.isPending}
                        title={u.isActive ? t('users.block') : t('users.unblock')}
                        style={{ padding: '6px 10px', border: 'none', borderRadius: 8, cursor: 'pointer',
                          backgroundColor: u.isActive ? '#FEE2E2' : '#DCFCE7',
                          color: u.isActive ? '#DC2626' : '#16A34A' }}>
                        {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>{t('users.noUsers')}</div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF',
              color: page === 1 ? '#D1D5DB' : '#1A1A1A', cursor: page === 1 ? 'default' : 'pointer', fontWeight: 600, fontSize: 16 }}>
            ‹
          </button>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF',
              color: page === totalPages ? '#D1D5DB' : '#1A1A1A', cursor: page === totalPages ? 'default' : 'pointer', fontWeight: 600, fontSize: 16 }}>
            ›
          </button>
        </div>
      )}


      {/* Add bonus modal */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 500,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} className="modal-in"
            style={{ width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 28,
              border: '1px solid #E5E7EB', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ color: '#1A1A1A', margin: 0, fontSize: 17, fontWeight: 700 }}>{t('bonus.addTitle')}</h3>
                <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>{selected.firstName} {selected.lastName}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}><X size={20} /></button>
            </div>

            <div style={{ backgroundColor: '#FEF9C3', borderRadius: 10, padding: '10px 14px', marginBottom: 16,
              display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#92400E' }}>{t('users.bonusBalance')}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#16A34A' }}>{(selected.bonusBalance || 0).toLocaleString()} {t('common.som')}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 600, marginBottom: 5, display: 'block' }}>{t('bonus.amountLabel')}</label>
                <input type="number" min={1} value={bonusAmount} onChange={e => setBonusAmount(e.target.value)}
                  placeholder="0" style={inp} />
              </div>
              <div>
                <label style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 600, marginBottom: 5, display: 'block' }}>{t('bonus.reasonLabel')}</label>
                <input value={bonusReason} onChange={e => setBonusReason(e.target.value)}
                  placeholder={t('bonus.reasonPlaceholder')} style={inp} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => setSelected(null)}
                  style={{ flex: 1, padding: 12, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, color: '#1A1A1A', cursor: 'pointer', fontWeight: 500 }}>
                  {t('bonus.cancel')}
                </button>
                <button onClick={addBonus} disabled={bonusLoading}
                  style={{ flex: 1, padding: 12, backgroundColor: '#16A34A', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#fff', opacity: bonusLoading ? 0.7 : 1 }}>
                  {bonusLoading ? t('bonus.saving') : t('bonus.add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
