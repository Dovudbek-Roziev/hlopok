import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, X, Search, Package } from 'lucide-react';
import api from '../api/client';
import { toast } from '../components/Toast';
import { Confirm } from '../components/Confirm';

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', backgroundColor: '#F8F8F8', border: '1.5px solid #E5E5E5', borderRadius: 8, color: '#1A1A1A', fontSize: 14, boxSizing: 'border-box' };
const lbl: React.CSSProperties = { color: '#1A1A1A', fontSize: 13, fontWeight: 600, marginBottom: 5, display: 'block' };

const CatForm = ({ cat, onClose, onSaved }: any) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name_ru:  cat?.name_ru  || '',
    name_ky:  cat?.name_ky  || '',
    icon:     cat?.icon     || '',
    isActive: cat?.isActive !== false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name_ru.trim() || !form.name_ky.trim()) {
      toast.error(t('categories.nameRequired'));
      return;
    }
    setLoading(true);
    try {
      if (cat) await api.put(`/categories/${cat._id}`, form);
      else     await api.post('/categories', form);
      onSaved();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 500,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} className="modal-in"
        style={{ width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 16, padding: 28,
          border: '1px solid #E5E5E5', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ color: '#1A1A1A', margin: 0, fontWeight: 700, fontSize: 17 }}>
            {cat ? t('categories.editTitle') : t('categories.addTitle')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9E9E', padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>{t('categories.nameRu')}</label>
            <input style={inp} value={form.name_ru} placeholder={t('categories.exampleRu')}
              onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>{t('categories.nameKy')}</label>
            <input style={inp} value={form.name_ky} placeholder={t('categories.exampleKy')}
              onChange={e => setForm(f => ({ ...f, name_ky: e.target.value }))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1A1A1A', cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            {t('categories.active')}
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 8, borderTop: '1px solid #F0F0F0' }}>
            <button onClick={onClose} style={{ flex: 1, padding: 12, backgroundColor: '#F8F8F8', border: '1px solid #E5E5E5', borderRadius: 10, color: '#1A1A1A', cursor: 'pointer', fontWeight: 500 }}>
              {t('categories.cancel')}
            </button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, padding: 12, backgroundColor: '#FFD700', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#111827', opacity: loading ? 0.7 : 1 }}>
              {loading ? t('categories.saving') : t('categories.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoriesPage = () => {
  const { t, i18n } = useTranslation();
  const isKy = i18n.language === 'ky';
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories/all').then(r => r.data.categories),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success(t('categories.deleted')); },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('common.error')),
  });

  const onSaved = () => {
    setShowForm(false); setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    toast.success(t('categories.saved'));
  };

  const filtered = (data || []).filter((c: any) => {
    const matchSearch = !search ||
      c.name_ru?.toLowerCase().includes(search.toLowerCase()) ||
      c.name_ky?.toLowerCase().includes(search.toLowerCase());
    const matchActive = activeFilter === 'all' || (activeFilter === 'active' ? c.isActive : !c.isActive);
    return matchSearch && matchActive;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('categories.title')}</h1>
          <p style={{ color: '#9E9E9E', fontSize: 13, margin: '2px 0 0' }}>{filtered.length} {t('categories.count')}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', backgroundColor: '#FFD700',
            border: 'none', borderRadius: 10, color: '#111827', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          <Plus size={16} /> {t('categories.add')}
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} color="#9E9E9E" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('categories.search')}
            style={{ width: '100%', padding: '11px 14px 11px 40px', backgroundColor: '#fff', border: '1.5px solid #E5E5E5',
              borderRadius: 10, color: '#1A1A1A', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              style={{ padding: '8px 14px', borderRadius: 20, border: '1.5px solid #E5E5E5', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                backgroundColor: activeFilter === f ? '#1A1A1A' : '#fff',
                color: activeFilter === f ? '#fff' : '#1A1A1A' }}>
              {t(`categories.filter_${f}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E', fontSize: 14 }}>{t('common.loading')}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
        {filtered.map((c: any) => (
          <div key={c._id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E5E5E5',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              {c.image ? (
                <img src={c.image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#F8F8F8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {c.icon ? <span style={{ fontSize: 22 }}>{c.icon}</span> : <Package size={22} color="#9E9E9E" />}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isKy ? (c.name_ky || c.name_ru) : c.name_ru}
                </div>
                <div style={{ color: '#9E9E9E', fontSize: 12, marginTop: 2 }}>
                  {isKy ? c.name_ru : c.name_ky}
                </div>
                <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  backgroundColor: c.isActive ? '#E8F5E9' : '#F5F5F5',
                  color: c.isActive ? '#2D8653' : '#9E9E9E' }}>
                  {c.isActive ? t('categories.active') : t('categories.inactive')}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
              <button onClick={() => { setEditing(c); setShowForm(true); }}
                style={{ padding: '7px 9px', backgroundColor: '#FFF9E6', border: '1px solid #FFD700', borderRadius: 8, cursor: 'pointer', color: '#1A1A1A' }}>
                <Edit2 size={14} />
              </button>
              <button onClick={() => setConfirmId(c._id)}
                style={{ padding: '7px 9px', backgroundColor: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 8, cursor: 'pointer', color: '#E53935' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E5E5' }}>
          <Package size={32} color="#9E9E9E" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 15, fontWeight: 500 }}>{t('categories.noCategories')}</div>
        </div>
      )}

      {showForm && <CatForm cat={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={onSaved} />}

      {confirmId && (
        <Confirm
          onConfirm={() => { deleteMutation.mutate(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
