import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, X, Search, Package } from 'lucide-react';
import api from '../api/client';
import { toast } from '../components/Toast';
import { Confirm } from '../components/Confirm';

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', backgroundColor: '#F8F8F8',
  border: '1.5px solid #E5E5E5', borderRadius: 8, color: '#1A1A1A',
  fontSize: 14, boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  color: '#1A1A1A', fontSize: 13, fontWeight: 600, marginBottom: 5, display: 'block',
};

// ── Product picker modal ─────────────────────────────────────────────────────
const ProductPicker = ({ onClose, onAdd, alreadySelected }: {
  onClose: () => void;
  onAdd: (product: any) => void;
  alreadySelected: Set<string>;
}) => {
  const { t, i18n } = useTranslation();
  const isKy = i18n.language === 'ky';
  const [search, setSearch] = useState('');

  const { data: products } = useQuery({
    queryKey: ['promo-products-picker'],
    queryFn: () => api.get('/products?limit=500&isActive=all').then(r => r.data.products),
  });

  const filtered = (products || []).filter((p: any) =>
    p.name_ru.toLowerCase().includes(search.toLowerCase()) ||
    (p.name_ky || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.12)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 600,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 16px', overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} className="modal-in" style={{
        width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 16,
        border: '1px solid #E5E5E5', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 80px)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1A' }}>{t('promotions.form.pickerTitle')}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9E9E', padding: 4 }}><X size={20} /></button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0F0', position: 'relative' }}>
          <Search size={15} color="#9E9E9E" style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)' }} />
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('promotions.form.pickerSearch')}
            style={{ ...inp, paddingLeft: 36, fontSize: 13 }} />
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: '#9E9E9E', fontSize: 13 }}>{t('promotions.form.pickerEmpty')}</div>
          )}
          {filtered.map((p: any) => {
            const selected   = alreadySelected.has(p._id);
            const stockTotal = (p.variants || []).reduce((a: number, v: any) => a + (v.stock || 0), 0);
            return (
              <div key={p._id}
                onClick={() => { if (!selected) { onAdd(p); onClose(); } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                  borderBottom: '1px solid #F8F8F8', cursor: selected ? 'default' : 'pointer',
                  backgroundColor: selected ? '#F8FFF8' : '#fff',
                  opacity: selected ? 0.65 : 1,
                  transition: 'background 0.1s',
                }}
              >
                {p.images?.[0]
                  ? <img src={p.images[0]} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#F0F0F0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={18} color="#9E9E9E" /></div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isKy ? (p.name_ky || p.name_ru) : p.name_ru}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    {p.price > 0 && (
                      <span style={{ color: '#9E9E9E', fontSize: 12 }}>{p.price.toLocaleString()} {t('common.som')}</span>
                    )}
                    <span style={{
                      fontSize: 11, padding: '1px 7px', borderRadius: 10, fontWeight: 600,
                      backgroundColor: stockTotal === 0 ? '#FFF0F0' : '#E8F5E9',
                      color: stockTotal === 0 ? '#E53935' : '#2D8653',
                    }}>
                      {t('promotions.form.pickerStock')}: {stockTotal}
                    </span>
                    {!p.isActive && (
                      <span style={{ fontSize: 11, color: '#E53935' }}>• {t('promotions.form.pickerInactive')}</span>
                    )}
                  </div>
                </div>
                {selected
                  ? <span style={{ fontSize: 12, color: '#2D8653', fontWeight: 600, flexShrink: 0 }}>✓ {t('promotions.form.pickerAdded')}</span>
                  : stockTotal === 0
                    ? <span style={{ fontSize: 11, color: '#E53935', flexShrink: 0 }}>{t('promotions.form.pickerOutOfStock')}</span>
                    : null
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Aksiya formasi ──────────────────────────────────────────────────────────
const PromoForm = ({ promo, onClose, onSaved }: any) => {
  const { t, i18n } = useTranslation();
  const isKy = i18n.language === 'ky';

  const [form, setForm] = useState({
    title_ru:       promo?.title_ru       || '',
    title_ky:       promo?.title_ky       || '',
    description_ru: promo?.description_ru || '',
    description_ky: promo?.description_ky || '',
    discountPercent: promo?.discountPercent || '',
    startDate: promo?.startDate ? promo.startDate.slice(0, 10) : '',
    endDate:   promo?.endDate   ? promo.endDate.slice(0, 10)   : '',
    isActive:  promo?.isActive !== false,
  });

  const [file, setFile]           = useState<File | null>(null);
  const [loading, setLoading]     = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>(
    Object.fromEntries(
      (promo?.products || [])
        .map((p: any) => {
          const id = typeof p.product === 'string' ? p.product : p.product?._id;
          return [id, p.limit != null ? String(p.limit) : ''];
        })
        .filter(([id]: any) => id)
    )
  );
  const [productDetails, setProductDetails] = useState<Record<string, any>>(
    Object.fromEntries(
      (promo?.products || [])
        .map((p: any) => {
          const id    = typeof p.product === 'string' ? p.product : p.product?._id;
          const prod  = typeof p.product === 'object' ? p.product : null;
          return [id, prod];
        })
        .filter(([id, prod]: any) => id && prod)
    )
  );

  const selectedIds = Object.keys(selectedProducts);

  const addProduct = (p: any) => {
    setSelectedProducts(prev => ({ ...prev, [p._id]: '' })); // limit yo'q — null
    setProductDetails(prev => ({ ...prev, [p._id]: p }));
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(prev => { const n = { ...prev }; delete n[id]; return n; });
    setProductDetails(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleSubmit = async () => {
    if (!form.title_ru.trim() || !form.title_ky.trim()) {
      toast.error(`${t('promotions.form.titleRu')} / ${t('promotions.form.titleKy')} — ${t('common.required')}`);
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error(`${t('promotions.form.startDate')} / ${t('promotions.form.endDate')} — ${t('common.required')}`);
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error(t('promotions.form.dateError'));
      return;
    }
    if (!promo && !file) {
      toast.error(t('promotions.form.imageRequired'));
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      const productsPayload = Object.entries(selectedProducts).map(([product, limit]) => ({
        product, limit: limit === '' ? null : Number(limit),
      }));
      fd.append('products', JSON.stringify(productsPayload));
      if (file) fd.append('image', file);
      if (promo) await api.put(`/promotions/${promo._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else       await api.post('/promotions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 500,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', overflowY: 'auto',
      }}>
        <div onClick={e => e.stopPropagation()} className="modal-in" style={{
          width: '100%', maxWidth: 640, backgroundColor: '#fff', borderRadius: 16, padding: '24px 28px',
          border: '1px solid #E5E5E5', boxShadow: '0 12px 40px rgba(0,0,0,0.14)', marginTop: 16, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <h3 style={{ color: '#1A1A1A', margin: 0, fontWeight: 700, fontSize: 18 }}>
              {promo ? t('promotions.form.edit') : t('promotions.form.new')}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9E9E' }}><X size={20} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Nom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>{t('promotions.form.titleRu')}</label>
                <input style={inp} value={form.title_ru} onChange={e => setForm(f => ({ ...f, title_ru: e.target.value }))} placeholder="Название акции..." />
              </div>
              <div>
                <label style={lbl}>{t('promotions.form.titleKy')}</label>
                <input style={inp} value={form.title_ky} onChange={e => setForm(f => ({ ...f, title_ky: e.target.value }))} placeholder="Акциянын аталышы..." />
              </div>
            </div>

            {/* Sanalar va chegirma */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>{t('promotions.form.startDate')}</label>
                <input type="date" style={inp} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>{t('promotions.form.endDate')}</label>
                <input type="date" style={inp} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={lbl}>{t('promotions.form.discount')} %</label>
                <input type="number" style={inp} value={form.discountPercent}
                  onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))} placeholder="20" min={0} max={100} />
              </div>
              {/* Banner rasm */}
              <div>
                <label style={lbl}>{t('promotions.form.image')} <span style={{ color: '#9E9E9E', fontWeight: 400 }}>800×400</span></label>
                <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} style={{ color: '#1A1A1A', fontSize: 13, width: '100%' }} />
              </div>
            </div>
            {(promo?.image && !file) && (
              <img src={promo.image} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E5E5' }} />
            )}

            {/* Tovarlar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ ...lbl, margin: 0 }}>
                  {t('promotions.form.products')} ({selectedIds.length})
                </label>
                <button onClick={() => setShowPicker(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  backgroundColor: '#FFD700', border: 'none', borderRadius: 8,
                  color: '#111827', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>
                  <Plus size={14} /> {t('promotions.form.addExistingProduct')}
                </button>
              </div>

              {selectedIds.length === 0 ? (
                <div style={{
                  padding: '18px 16px', textAlign: 'center', backgroundColor: '#F8F8F8',
                  borderRadius: 10, border: '1.5px dashed #E0E0E0', color: '#BDBDBD', fontSize: 13,
                }}>
                  {t('promotions.form.noProductsHint')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedIds.map(id => {
                    const p = productDetails[id];
                    const warehouseStock = p ? (p.variants || []).reduce((a: number, v: any) => a + (v.stock || 0), 0) : 0;

                    // Rang bo'yicha guruhlash
                    const byColor: Record<string, { size: string; stock: number }[]> = {};
                    (p?.variants || []).forEach((v: any) => {
                      const c = v.color || '—';
                      if (!byColor[c]) byColor[c] = [];
                      byColor[c].push({ size: v.size, stock: v.stock || 0 });
                    });

                    return (
                      <div key={id} style={{
                        padding: '10px 12px', backgroundColor: '#FAFAFA',
                        borderRadius: 10, border: '1px solid #EEEEEE',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p?.images?.[0]
                            ? <img src={p.images[0]} alt="" style={{ width: 38, height: 38, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 38, height: 38, borderRadius: 7, backgroundColor: '#E8E8E8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={15} color="#BDBDBD" /></div>
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isKy ? (p?.name_ky || p?.name_ru || id) : (p?.name_ru || id)}
                            </div>
                            <div style={{ fontSize: 11, color: '#9E9E9E', marginTop: 1 }}>
                              {p?.price > 0 && `${p.price.toLocaleString()} ${t('common.som')} · `}
                              <span style={{ color: warehouseStock === 0 ? '#E53935' : '#2D8653', fontWeight: 600 }}>
                                Жами: {warehouseStock} та
                              </span>
                            </div>
                          </div>
                          <button onClick={() => removeProduct(id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BDBDBD', padding: 4, lineHeight: 1, flexShrink: 0 }}>
                            <X size={15} />
                          </button>
                        </div>

                        {/* Rang + razmer breakdown */}
                        {Object.keys(byColor).length > 0 && (
                          <div style={{ marginTop: 8, paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {Object.entries(byColor).map(([color, sizes]) => (
                              <div key={color} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {color !== '—' && (
                                  <span style={{
                                    display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                                    backgroundColor: color, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0,
                                  }} />
                                )}
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {(sizes as { size: string; stock: number }[]).map(s => (
                                    <span key={s.size} style={{
                                      fontSize: 10, padding: '2px 7px', borderRadius: 6, fontWeight: 600,
                                      backgroundColor: s.stock === 0 ? '#FFF0F0' : '#E8F5E9',
                                      color: s.stock === 0 ? '#E53935' : '#2D8653',
                                    }}>
                                      {s.size}: {s.stock}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
            </div>

            {/* Aktiv + tugmalar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 14, borderTop: '1px solid #F0F0F0', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1A1A1A', cursor: 'pointer', fontSize: 14, userSelect: 'none' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                {t('promotions.form.active')}
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{
                  padding: '10px 22px', backgroundColor: '#F5F5F5',
                  border: '1px solid #E5E5E5', borderRadius: 10, color: '#1A1A1A', cursor: 'pointer',
                  fontWeight: 500, fontSize: 14,
                }}>
                  {t('promotions.form.cancel')}
                </button>
                <button onClick={handleSubmit} disabled={loading} style={{
                  padding: '10px 28px', backgroundColor: '#FFD700', border: 'none',
                  borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#111827',
                  opacity: loading ? 0.7 : 1, fontSize: 14,
                }}>
                  {loading ? t('promotions.form.saving') : t('promotions.form.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <ProductPicker
          onClose={() => setShowPicker(false)}
          onAdd={addProduct}
          alreadySelected={new Set(selectedIds)}
        />
      )}
    </>
  );
};

// ── Main page ───────────────────────────────────────────────────────────────
const PromotionsPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ky' ? 'ky-KG' : 'ru-RU';
  const isKy = i18n.language === 'ky';
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<any>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: () => api.get('/promotions/all').then(r => r.data.promotions),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      toast.success(t('promotions.deleted'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const onSaved = () => {
    setShowForm(false); setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
    queryClient.invalidateQueries({ queryKey: ['promo-products-picker'] });
    toast.success(t('promotions.saved'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('promotions.title')}</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
          backgroundColor: '#FFD700', border: 'none', borderRadius: 10,
          color: '#111827', cursor: 'pointer', fontWeight: 700, fontSize: 14,
        }}>
          <Plus size={16} /> {t('promotions.add')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {(data || []).map((p: any) => {
          const expired = p.endDate && new Date(p.endDate) < new Date();
          const active  = p.isActive && !expired;
          return (
            <div key={p._id} style={{
              backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E5E5',
              overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              {p.image && (
                <img src={p.image} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ color: '#1A1A1A', fontWeight: 600, fontSize: 14, flex: 1, lineHeight: 1.3 }}>{isKy ? (p.title_ky || p.title_ru) : p.title_ru}</div>
                  {p.discountPercent > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: 8, backgroundColor: '#FFF0F0', color: '#E53935', fontSize: 12, fontWeight: 700, marginLeft: 8, flexShrink: 0 }}>
                      -{p.discountPercent}%
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    backgroundColor: active ? '#E8F5E9' : '#F5F5F5',
                    color: active ? '#2D8653' : '#9E9E9E',
                  }}>
                    {expired ? t('promotions.expired') : active ? t('promotions.active') : t('promotions.inactive')}
                  </span>
                  {p.endDate && (
                    <span style={{ color: '#9E9E9E', fontSize: 11, lineHeight: '1.8' }}>
                      {t('promotions.until')} {new Date(p.endDate).toLocaleDateString(locale)}
                    </span>
                  )}
                  <span style={{ color: '#9E9E9E', fontSize: 11, lineHeight: '1.8' }}>
                    · {(p.products || []).length} {t('promotions.productsCount')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setEditing(p); setShowForm(true); }} style={{
                    flex: 1, padding: '7px 0', backgroundColor: '#FFF9E6',
                    border: '1px solid #FFD700', borderRadius: 8, cursor: 'pointer',
                    color: '#1A1A1A', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 5, fontSize: 13, fontWeight: 500,
                  }}>
                    <Edit2 size={13} /> {t('promotions.form.edit')}
                  </button>
                  <button onClick={() => setConfirmId(p._id)} style={{
                    padding: '7px 12px', backgroundColor: '#FFF0F0',
                    border: '1px solid #FFCDD2', borderRadius: 8, cursor: 'pointer', color: '#E53935',
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {(!data || data.length === 0) && (
          <div style={{
            padding: 48, textAlign: 'center', color: '#9E9E9E',
            backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E5E5', gridColumn: '1/-1',
          }}>
            {t('promotions.noPromos')}
          </div>
        )}
      </div>

      {showForm && (
        <PromoForm
          promo={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}

      {confirmId && (
        <Confirm
          onConfirm={() => { deleteMutation.mutate(confirmId!); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
};

export default PromotionsPage;
