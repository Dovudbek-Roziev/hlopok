import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, X, Search, Tag } from 'lucide-react';
import api from '../api/client';
import { toast } from '../components/Toast';
import { Confirm } from '../components/Confirm';

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', backgroundColor: '#F8F8F8', border: '1.5px solid #E5E5E5', borderRadius: 8, color: '#1A1A1A', fontSize: 14, boxSizing: 'border-box' };
const lbl: React.CSSProperties = { color: '#1A1A1A', fontSize: 13, fontWeight: 600, marginBottom: 5, display: 'block' };

const BrandForm = ({ brand, onClose, onSaved }: any) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: brand?.name || '', description: brand?.description || '', isActive: brand?.isActive !== false });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error(t('brands.nameRequired')); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (file) fd.append('logo', file);
      if (brand) await api.put(`/brands/${brand._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else       await api.post('/brands', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
            {brand ? t('brands.editTitle') : t('brands.addTitle')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9E9E', padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>{t('brands.name')}</label><input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={lbl}>{t('brands.description')}</label><textarea style={{ ...inp, height: 72 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div>
            <label style={lbl}>{t('brands.logo')}</label>
            <input type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0] || null)} style={{ color: '#9E9E9E', fontSize: 13 }} />
            {(preview || brand?.logo) && !file && (
              <img src={preview || brand.logo} alt="" style={{ width: 80, height: 80, objectFit: 'contain', marginTop: 10, borderRadius: 10, border: '1px solid #E5E5E5', padding: 4 }} />
            )}
            {preview && (
              <img src={preview} alt="" style={{ width: 80, height: 80, objectFit: 'contain', marginTop: 10, borderRadius: 10, border: '1px solid #E5E5E5', padding: 4 }} />
            )}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1A1A1A', cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            {t('brands.active')}
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 8, borderTop: '1px solid #F0F0F0' }}>
            <button onClick={onClose} style={{ flex: 1, padding: 12, backgroundColor: '#F8F8F8', border: '1px solid #E5E5E5', borderRadius: 10, color: '#1A1A1A', cursor: 'pointer', fontWeight: 500 }}>
              {t('brands.cancel')}
            </button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, padding: 12, backgroundColor: '#FFD700', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#111827', opacity: loading ? 0.7 : 1 }}>
              {loading ? t('brands.saving') : t('brands.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BrandsPage = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get('/brands').then(r => r.data.brands),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/brands/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-brands'] }); toast.success(t('brands.deleted')); },
    onError: () => toast.error(t('common.error')),
  });

  const onSaved = () => {
    setShowForm(false); setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    toast.success(t('brands.saved'));
  };

  const filtered = (data || []).filter((b: any) =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('brands.title')}</h1>
          <p style={{ color: '#9E9E9E', fontSize: 13, margin: '2px 0 0' }}>{filtered.length} {t('brands.count')}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', backgroundColor: '#111827',
            border: 'none', borderRadius: 10, color: '#FFD700', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          <Plus size={16} /> {t('brands.add')}
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="#9E9E9E" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('brands.search')}
          style={{ width: '100%', padding: '11px 14px 11px 40px', backgroundColor: '#fff', border: '1.5px solid #E5E5E5',
            borderRadius: 10, color: '#1A1A1A', fontSize: 14, boxSizing: 'border-box' }} />
      </div>

      {isLoading && (
        <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E', fontSize: 14 }}>{t('common.loading')}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {filtered.map((b: any) => (
          <div key={b._id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E5E5E5',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 70,
              backgroundColor: '#F8F8F8', borderRadius: 8, padding: 8 }}>
              {b.logo
                ? <img src={b.logo} alt={b.name} style={{ maxWidth: '100%', maxHeight: 60, objectFit: 'contain' }} />
                : <div style={{ color: '#9E9E9E', fontSize: 13 }}>{t('brands.noLogo')}</div>
              }
            </div>
            <div>
              <div style={{ color: '#1A1A1A', fontWeight: 600, fontSize: 14, textAlign: 'center', marginBottom: 6 }}>{b.name}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  backgroundColor: b.isActive ? '#E8F5E9' : '#F5F5F5', color: b.isActive ? '#2D8653' : '#9E9E9E' }}>
                  {b.isActive ? t('brands.active') : t('brands.inactive')}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { setEditing(b); setShowForm(true); }}
                style={{ flex: 1, padding: '8px 0', backgroundColor: '#FFF9E6', border: '1px solid #FFD700', borderRadius: 8, cursor: 'pointer', color: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit2 size={14} />
              </button>
              <button onClick={() => setConfirmId(b._id)}
                style={{ flex: 1, padding: '8px 0', backgroundColor: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 8, cursor: 'pointer', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E5E5' }}>
          <Tag size={32} color="#9E9E9E" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 15, fontWeight: 500 }}>{t('brands.noBrands')}</div>
        </div>
      )}

      {showForm && <BrandForm brand={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={onSaved} />}

      {confirmId && (
        <Confirm
          onConfirm={() => { deleteMutation.mutate(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
};

export default BrandsPage;
