import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, X, Image } from 'lucide-react';
import api from '../api/client';
import { toast } from '../components/Toast';
import { Confirm } from '../components/Confirm';

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', backgroundColor: '#F8F8F8', border: '1.5px solid #E5E5E5', borderRadius: 8, color: '#1A1A1A', fontSize: 14, boxSizing: 'border-box' };
const lbl: React.CSSProperties = { color: '#1A1A1A', fontSize: 13, fontWeight: 600, marginBottom: 5, display: 'block' };

const BannerForm = ({ banner, onClose, onSaved }: any) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title_ru: banner?.title_ru || '',
    title_ky: banner?.title_ky || '',
    linkUrl: banner?.linkUrl || '',
    type: 'slider',
    order: banner?.order !== undefined ? String(banner.order) : '',
    isActive: banner?.isActive !== false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const handleSubmit = async () => {
    if (!form.title_ru.trim()) { toast.error(t('banners.form.titleRu') + ' — ' + t('common.required')); return; }
    if (!banner && !file) { toast.error(t('banners.form.image') + ' — ' + t('common.required')); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (file) fd.append('image', file);
      if (banner) await api.put(`/banners/${banner._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else        await api.post('/banners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const imgSrc = preview || (banner?.image && !file ? banner.image : null);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 500,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} className="modal-in"
        style={{ width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 16, padding: 28,
          border: '1px solid #E5E5E5', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ color: '#1A1A1A', margin: 0, fontWeight: 700, fontSize: 17 }}>
            {banner ? t('banners.form.edit') : t('banners.form.new')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9E9E', padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>{t('banners.form.titleRu')}</label><input style={inp} value={form.title_ru} onChange={e => setForm(f => ({ ...f, title_ru: e.target.value }))} /></div>
            <div><label style={lbl}>{t('banners.form.titleKy')}</label><input style={inp} value={form.title_ky} onChange={e => setForm(f => ({ ...f, title_ky: e.target.value }))} /></div>
          </div>
          <div><label style={lbl}>{t('banners.form.link')}</label><input style={inp} value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." /></div>
          <div>
            <label style={lbl}>{t('banners.form.order')}</label>
            <input type="number" style={inp} value={form.order} placeholder="0" onChange={e => setForm(f => ({ ...f, order: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>{t('banners.form.image')}</label>
            <input type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0] || null)} style={{ color: '#9E9E9E', fontSize: 13 }} />
            {imgSrc && (
              <img src={imgSrc} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginTop: 10, border: '1px solid #E5E5E5' }} />
            )}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1A1A1A', cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            {t('banners.form.active')}
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 8, borderTop: '1px solid #F0F0F0' }}>
            <button onClick={onClose} style={{ flex: 1, padding: 12, backgroundColor: '#F8F8F8', border: '1px solid #E5E5E5', borderRadius: 10, color: '#1A1A1A', cursor: 'pointer', fontWeight: 500 }}>
              {t('banners.form.cancel')}
            </button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, padding: 12, backgroundColor: '#FFD700', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#111827', opacity: loading ? 0.7 : 1 }}>
              {loading ? t('banners.form.saving') : t('banners.form.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BannersPage = () => {
  const { t, i18n } = useTranslation();
  const isKy = i18n.language === 'ky';
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api.get('/banners/all').then(r => r.data.banners),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success(t('banners.deleted')); },
    onError: () => toast.error(t('common.error')),
  });

  const toggleActive = useMutation({
    mutationFn: (b: any) => {
      const fd = new FormData();
      fd.append('isActive', String(!b.isActive));
      fd.append('title_ru', b.title_ru || '');
      fd.append('title_ky', b.title_ky || '');
      fd.append('linkUrl', b.linkUrl || '');
      fd.append('type', b.type);
      fd.append('order', String(b.order));
      return api.put(`/banners/${b._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success(t('banners.saved')); },
    onError: () => toast.error(t('common.error')),
  });

  const onSaved = () => {
    setShowForm(false); setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    toast.success(t('banners.saved'));
  };

  const filtered = data || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('banners.title')}</h1>
          <p style={{ color: '#9E9E9E', fontSize: 13, margin: '2px 0 0' }}>{filtered.length} {t('banners.count')}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', backgroundColor: '#111827',
            border: 'none', borderRadius: 10, color: '#FFD700', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          <Plus size={16} /> {t('banners.add')}
        </button>
      </div>

      {isLoading && (
        <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E', fontSize: 14 }}>{t('common.loading')}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((b: any) => (
          <div key={b._id} style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E5E5', overflow: 'hidden',
            display: 'flex', alignItems: 'stretch', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {b.image
              ? <img src={b.image} alt="" style={{ width: 160, height: 90, objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 160, height: 90, backgroundColor: '#F8F8F8', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Image size={28} color="#E5E5E5" />
                </div>
            }
            <div style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#1A1A1A', fontWeight: 600, fontSize: 15, marginBottom: 6,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isKy ? (b.title_ky || b.title_ru || '—') : (b.title_ru || '—')}
                </div>
                <div style={{ color: '#9E9E9E', fontSize: 12, marginBottom: 6 }}>{isKy ? b.title_ru : b.title_ky}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#9E9E9E', fontSize: 11 }}>#{b.order}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {/* Active toggle */}
                <button onClick={() => toggleActive.mutate(b)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${b.isActive ? '#2D8653' : '#E5E5E5'}`,
                    backgroundColor: b.isActive ? '#E8F5E9' : '#F5F5F5',
                    color: b.isActive ? '#2D8653' : '#9E9E9E',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {b.isActive ? t('banners.active') : t('banners.inactive')}
                </button>
                <button onClick={() => { setEditing(b); setShowForm(true); }}
                  style={{ padding: '7px 10px', backgroundColor: '#FFF9E6', border: '1px solid #FFD700', borderRadius: 8, cursor: 'pointer', color: '#1A1A1A' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setConfirmId(b._id)}
                  style={{ padding: '7px 10px', backgroundColor: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 8, cursor: 'pointer', color: '#E53935' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E5E5' }}>
            <Image size={32} color="#9E9E9E" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 15, fontWeight: 500 }}>{t('banners.noBanners')}</div>
          </div>
        )}
      </div>

      {showForm && <BannerForm banner={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={onSaved} />}

      {confirmId && (
        <Confirm
          onConfirm={() => { deleteMutation.mutate(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
};

export default BannersPage;
