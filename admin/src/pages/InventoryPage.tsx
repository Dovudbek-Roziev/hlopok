import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Search, X, Plus, Minus, Check } from 'lucide-react';
import api from '../api/client';
import { toast } from '../components/Toast';
import { PRESET_COLORS, colorName } from '../utils/colors';
import { sizeLabelBoth, sizeLabel } from '../utils/sizeLabel';

const SIZES = ['1 мес','3 мес','6 мес','9 мес','12 мес','18 мес','24 мес','3 года','4 года','5 лет','6 лет','7 лет'];

type Variant = { size: string; color: string; stock: number };

const buildVariants = (existing: Variant[], colors: string[]): Variant[] => {
  if (colors.length === 0) {
    return SIZES.map(size => ({
      size, color: '',
      stock: existing.find(v => v.size === size && v.color === '')?.stock ?? 0,
    }));
  }
  const rows: Variant[] = [];
  SIZES.forEach(size => colors.forEach(color => {
    rows.push({ size, color, stock: existing.find(v => v.size === size && v.color === color)?.stock ?? 0 });
  }));
  return rows;
};

const InventoryPage = () => {
  const { t, i18n } = useTranslation();
  const isKy = i18n.language === 'ky';
  const [search, setSearch]     = useState('');
  const [editing, setEditing]   = useState<any>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [colors, setColors]     = useState<string[]>([]);
  const [price, setPrice]       = useState<string>('');
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/products?limit=500&isActive=all').then(r => r.data.products),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, variants, price }: any) => api.put(`/products/${id}/stock`, { variants, price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setEditing(null);
      toast.success(t('inventory.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setPrice(p.price ? String(p.price) : '');
    const existing: Variant[] = p.variants?.length > 0 ? p.variants : [];
    const existingColors = [...new Set(existing.map((v: Variant) => v.color))].filter(Boolean) as string[];
    setColors(existingColors);
    setVariants(buildVariants(existing, existingColors));
  };

  const changeStock = (size: string, color: string, delta: number) => {
    setVariants(prev => prev.map(v =>
      v.size === size && v.color === color
        ? { ...v, stock: Math.max(0, v.stock + delta) }
        : v
    ));
  };

  const setStock = (size: string, color: string, val: string) => {
    const stock = val === '' ? 0 : Math.max(0, Number(val));
    setVariants(prev => prev.map(v => (v.size === size && v.color === color) ? { ...v, stock } : v));
  };

  const addColor = (hex: string) => {
    if (colors.includes(hex)) return;
    const next = [...colors, hex];
    setColors(next);
    setVariants(buildVariants(variants, next));
  };
  const removeColor = (c: string) => {
    const next = colors.filter(x => x !== c);
    setColors(next);
    setVariants(buildVariants(variants, next));
  };

  const totalStock = (p: any) => (p.variants || []).reduce((a: number, v: any) => a + (v.stock || 0), 0);
  const editTotal  = variants.reduce((a, v) => a + (v.stock || 0), 0);

  const filtered = (products || []).filter((p: any) => {
    const q = search.toLowerCase();
    return p.name_ru.toLowerCase().includes(q) || (p.name_ky || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div>
        <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('inventory.title')}</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: '2px 0 0' }}>{filtered.length} {t('inventory.products')}</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('inventory.search')}
          style={{ width: '100%', padding: '11px 14px 11px 40px', backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, color: '#1A1A1A', boxSizing: 'border-box' }} />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
              {[t('inventory.product'), t('inventory.category'), t('inventory.price'), t('inventory.totalStock'), t('inventory.status'), ''].map((h, i) => (
                <th key={i} style={{ padding: '11px 16px', textAlign: 'left', color: '#9CA3AF', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => {
              const stock = totalStock(p);
              const low   = stock > 0 && stock < 5;
              return (
                <tr key={p._id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
                        : <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                      }
                      <span style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 500 }}>{isKy ? (p.name_ky || p.name_ru) : p.name_ru}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 13 }}>{isKy ? (p.category?.name_ky || p.category?.name_ru || '—') : (p.category?.name_ru || '—')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: p.price > 0 ? '#16A34A' : '#9CA3AF', fontWeight: 700, fontSize: 14 }}>
                      {p.price > 0 ? `${p.price.toLocaleString()} ${t('common.som')}` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {low && <AlertTriangle size={14} color="#D97706" />}
                      <span style={{ color: stock === 0 ? '#DC2626' : low ? '#D97706' : '#1A1A1A', fontWeight: 700, fontSize: 15 }}>{stock}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      backgroundColor: stock === 0 ? '#FEE2E2' : low ? '#FEF9C3' : '#DCFCE7',
                      color: stock === 0 ? '#DC2626' : low ? '#92400E' : '#15803D' }}>
                      {stock === 0 ? t('inventory.outOfStock') : low ? t('inventory.low') : t('inventory.inStock')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => openEdit(p)} style={{
                      padding: '7px 16px', backgroundColor: '#FFD700', border: 'none',
                      borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#1A1A1A',
                    }}>
                      {t('inventory.edit')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>{t('inventory.noProducts')}</div>
        )}
      </div>

      {/* Modal */}
      {editing && (
        <div onClick={() => setEditing(null)} style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 500,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto',
        }}>
          <div onClick={e => e.stopPropagation()} className="modal-in" style={{
            width: '100%', maxWidth: 680, maxHeight: '90vh',
            backgroundColor: '#FFFFFF', borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.14)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>

            {/* Modal header */}
            <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              {editing.images?.[0]
                ? <img src={editing.images[0]} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
                : <div style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#1A1A1A', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isKy ? (editing.name_ky || editing.name_ru) : editing.name_ru}
                </div>
                <div style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
                  {isKy ? editing.name_ru : editing.name_ky}
                </div>
              </div>
              <button onClick={() => setEditing(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={18} color="#1A1A1A" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }} className="hide-scroll">

              {/* Price */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
                  {t('inventory.price')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="number" min={0} value={price} placeholder="0"
                    onChange={e => setPrice(e.target.value)}
                    style={{ padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 16, fontWeight: 700, color: '#1A1A1A', width: 160, backgroundColor: '#F9FAFB', boxSizing: 'border-box' }} />
                  <span style={{ color: '#6B7280', fontSize: 14 }}>{t('common.som')}</span>
                </div>
              </div>

              {/* Colors */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 10 }}>
                  {t('products.form.colors')}
                </label>

                {colors.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {colors.map(c => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 6px', backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 20 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>{colorName(c, isKy ? 'ky' : 'ru')}</span>
                        <button type="button" onClick={() => removeColor(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0 0 0 2px', fontSize: 16, lineHeight: 1, display: 'flex' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: 10, border: '1.5px solid #E5E7EB' }}>
                  {PRESET_COLORS.map(({ hex }) => {
                    const selected = colors.includes(hex);
                    const light = ['#FFFFFF','#F5F5F5','#FFD700','#F8BBD9','#D7CCC8','#B2DFDB'].includes(hex);
                    return (
                      <button key={hex} type="button" title={colorName(hex, 'ru')}
                        onClick={() => selected ? removeColor(hex) : addColor(hex)}
                        style={{ position: 'relative', width: 32, height: 32, borderRadius: 16, backgroundColor: hex, cursor: 'pointer', border: selected ? '3px solid #1A1A1A' : '1.5px solid rgba(0,0,0,0.12)', transition: 'transform 0.1s', flexShrink: 0 }}>
                        {selected && (
                          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={12} color={light ? '#1A1A1A' : '#fff'} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sizes & Stock */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>{t('inventory.sizesStock')}</label>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>
                    {t('inventory.totalStock')}: <strong style={{ color: editTotal > 0 ? '#16A34A' : '#DC2626' }}>{editTotal}</strong>
                  </span>
                </div>

                {colors.length === 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {variants.map(v => (
                      <div key={v.size} style={{ backgroundColor: '#F9FAFB', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1.5px solid #E5E7EB' }}>
                        <div style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: '0.2px' }}>{sizeLabelBoth(v.size)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <button type="button" onClick={() => changeStock(v.size, '', -1)} style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus size={12} />
                          </button>
                          <input type="number" min={0} value={v.stock === 0 ? '' : v.stock} placeholder="0"
                            onChange={e => setStock(v.size, '', e.target.value)}
                            style={{ width: 40, textAlign: 'center', border: '1.5px solid #E5E7EB', borderRadius: 7, padding: '5px 2px', fontSize: 14, fontWeight: 700, color: '#1A1A1A', backgroundColor: '#fff' }} />
                          <button type="button" onClick={() => changeStock(v.size, '', 1)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', backgroundColor: '#FFD700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: 12, border: '1.5px solid #E5E7EB' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB' }}>
                          <th style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap' }}>
                            {t('products.form.size')}
                          </th>
                          {colors.map(c => (
                            <th key={c} style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c, border: '1.5px solid rgba(0,0,0,0.12)' }} />
                                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{colorName(c, isKy ? 'ky' : 'ru')}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SIZES.map((size, si) => (
                          <tr key={size} style={{ borderBottom: si < SIZES.length - 1 ? '1px solid #F3F4F6' : 'none', backgroundColor: si % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                            <td style={{ padding: '10px 14px', fontSize: 12, color: '#1A1A1A', fontWeight: 600, whiteSpace: 'nowrap' }}>{sizeLabelBoth(size)}</td>
                            {colors.map(color => {
                              const v = variants.find(x => x.size === size && x.color === color);
                              return (
                                <td key={color} style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <button type="button" onClick={() => changeStock(size, color, -1)}
                                      style={{ width: 26, height: 26, borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Minus size={10} />
                                    </button>
                                    <input type="number" min={0} value={!v?.stock ? '' : v.stock} placeholder="0"
                                      onChange={e => setStock(size, color, e.target.value)}
                                      style={{ width: 48, textAlign: 'center', border: '1.5px solid #E5E7EB', borderRadius: 7, padding: '5px 2px', fontSize: 13, fontWeight: 700, color: '#1A1A1A', backgroundColor: '#fff' }} />
                                    <button type="button" onClick={() => changeStock(size, color, 1)}
                                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', backgroundColor: '#FFD700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Plus size={10} />
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={() => setEditing(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, color: '#1A1A1A', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                {t('inventory.cancel')}
              </button>
              <button
                onClick={() => updateMutation.mutate({ id: editing._id, variants, price: Number(price) || 0 })}
                disabled={updateMutation.isPending}
                style={{ flex: 2, padding: '12px', backgroundColor: '#16A34A', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', color: '#fff', fontSize: 14, opacity: updateMutation.isPending ? 0.7 : 1 }}>
                {updateMutation.isPending ? t('inventory.saving') : t('inventory.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
