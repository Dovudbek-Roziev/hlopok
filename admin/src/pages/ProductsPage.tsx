import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, X, Search, Package, Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import { fetchAllAdminProducts } from '../api/products';
import { toast } from '../components/Toast';
import { Confirm } from '../components/Confirm';

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', backgroundColor: '#F8F8F8',
  border: '1.5px solid #E5E5E5', borderRadius: 8, color: '#1A1A1A',
  fontSize: 14, boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  color: '#1A1A1A', fontSize: 13, fontWeight: 600, marginBottom: 5, display: 'block',
};

const ProductForm = ({ product, categories, brands, onClose, onSaved }: any) => {
  const { t, i18n } = useTranslation();
  const isKyF = i18n.language === 'ky';

  const [form, setForm] = useState({
    name_ru:        product?.name_ru        || '',
    name_ky:        product?.name_ky        || '',
    description_ru: product?.description_ru || '',
    description_ky: product?.description_ky || '',
    price:          product?.price          || '',
    category:       product?.category?._id  || '',
    brand:          product?.brand?._id     || '',
    isNew:          product?.isNew          || false,
    isBestseller:   product?.isBestseller   || false,
    isActive:       product?.isActive !== false,
  });
  const [files, setFiles]   = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name_ru.trim() || !form.name_ky.trim()) {
      toast.error(`${t('products.form.nameRu')} / ${t('products.form.nameKy')} — ${t('common.required')}`);
      return;
    }
    if (!form.category) {
      toast.error(`${t('products.form.category')} — ${t('common.required')}`);
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error(`${t('products.form.price')} — ${t('common.required')}`);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      files.forEach(f => fd.append('images', f));

      if (product) {
        await api.put(`/products/${product._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 500,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 16px', overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} className="modal-in" style={{
        width: '100%', maxWidth: 640, backgroundColor: '#fff', borderRadius: 16, padding: 28,
        border: '1px solid #E5E5E5', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        marginTop: 20, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ color: '#1A1A1A', margin: 0, fontSize: 18, fontWeight: 700 }}>
            {product ? t('products.form.edit') : t('products.form.new')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9E9E9E', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>{t('products.form.nameRu')}</label>
              <input style={inp} value={form.name_ru}
                onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>{t('products.form.nameKy')}</label>
              <input style={inp} value={form.name_ky}
                onChange={e => setForm(f => ({ ...f, name_ky: e.target.value }))} />
            </div>
          </div>

          {/* Kategoriya + Brend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>{t('products.form.category')}</label>
              <select style={inp} value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">{t('products.form.select')}</option>
                {(categories || []).map((c: any) => (
                  <option key={c._id} value={c._id}>{isKyF ? (c.name_ky || c.name_ru) : c.name_ru}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>{t('products.form.brand')}</label>
              <select style={inp} value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}>
                <option value="">{t('products.form.select')}</option>
                {(brands || []).map((b: any) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Narx */}
          <div>
            <label style={lbl}>{t('products.form.price')}</label>
            <input type="number" min={0} style={inp} value={form.price}
              placeholder="0"
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            {!form.price && (
              <div style={{ color: '#E53935', fontSize: 11, marginTop: 4 }}>
                ⚠ {t('products.form.priceWarning')}
              </div>
            )}
          </div>

          {/* Tavsif */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>{t('products.form.descRu')}</label>
              <textarea style={{ ...inp, height: 80 }} value={form.description_ru}
                onChange={e => setForm(f => ({ ...f, description_ru: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>{t('products.form.descKy')}</label>
              <textarea style={{ ...inp, height: 80 }} value={form.description_ky}
                onChange={e => setForm(f => ({ ...f, description_ky: e.target.value }))} />
            </div>
          </div>

          {/* Rasmlar */}
          <div>
            <label style={lbl}>{t('products.form.images')}</label>
            <input type="file" accept="image/*" multiple
              onChange={e => setFiles(Array.from(e.target.files || []))}
              style={{ color: '#9E9E9E', fontSize: 13 }} />
            {product?.images?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {product.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="" style={{
                    width: 60, height: 60, borderRadius: 8, objectFit: 'cover',
                    border: '1.5px solid #E5E5E5',
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Belgilar */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {([
              ['isNew',        t('products.form.isNew')],
              ['isBestseller', t('products.form.isBestseller')],
              ['isActive',     t('products.form.isActive')],
            ] as [string, string][]).map(([k, l]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1A1A1A', cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={(form as any)[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} />
                {l}
              </label>
            ))}
          </div>

          {/* Eslatma */}
          <div style={{
            backgroundColor: '#FFF9E6', border: '1px solid #FFD700', borderRadius: 10,
            padding: '10px 14px', fontSize: 13, color: '#7A6000',
          }}>
            {t('products.form.inventoryHint')}
          </div>

          {/* Tugmalar */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4, paddingTop: 8, borderTop: '1px solid #F0F0F0' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: 12, backgroundColor: '#F8F8F8',
              border: '1px solid #E5E5E5', borderRadius: 10, color: '#1A1A1A',
              cursor: 'pointer', fontWeight: 500,
            }}>
              {t('products.form.cancel')}
            </button>
            <button onClick={handleSubmit} disabled={loading} style={{
              flex: 2, padding: 12, backgroundColor: '#FFD700', border: 'none',
              borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#111827',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? t('products.form.saving') : t('products.form.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductsPage = () => {
  const { t, i18n } = useTranslation();
  const isKy = i18n.language === 'ky';
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'hidden' | 'all'>('active');
  const queryClient = useQueryClient();

  const { data: products, isLoading }   = useQuery({ queryKey: ['admin-products'], queryFn: fetchAllAdminProducts });
  const { data: categories } = useQuery({ queryKey: ['categories'],     queryFn: () => api.get('/categories').then(r => r.data.categories) });
  const { data: brands }     = useQuery({ queryKey: ['brands'],         queryFn: () => api.get('/brands').then(r => r.data.brands) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['admin-products'], (current: any[] | undefined) => current?.map(product => product._id === id ? { ...product, isActive: false } : product));
      setSelectedIds(ids => ids.filter(selectedId => selectedId !== id));
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(t('products.deleted'));
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t('common.error')),
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/products/${id}/visibility`, { isActive }),
    onSuccess: (response, variables) => {
      const updated = response.data.product;
      queryClient.setQueryData(['admin-products'], (current: any[] | undefined) => current?.map(product => product._id === variables.id ? updated : product));
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(t(variables.isActive ? 'products.restored' : 'products.deleted'));
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t('common.error')),
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async (ids: string[]) => (await api.post('/products/bulk-archive', { ids })).data,
    onSuccess: ({ archived }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedIds([]);
      setShowBulkConfirm(false);
      toast.success(t('products.bulkDeleted', { count: archived }));
    },
    onError: () => toast.error(t('common.error')),
  });

  const onSaved = () => {
    setShowForm(false); setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    toast.success(t('products.saved'));
  };

  const filtered = (products || []).filter((p: any) => {
    const matchSearch = !search ||
      (p.name_ru || '').toLowerCase().includes(search.toLowerCase()) ||
      p.name_ky?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category?._id === catFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.isActive : !p.isActive);
    return matchSearch && matchCat && matchStatus;
  });
  const selectable = filtered.filter((p: any) => p.isActive);
  const allVisibleSelected = selectable.length > 0 && selectable.every((p: any) => selectedIds.includes(p._id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('products.title')}</h1>
          <p style={{ color: '#9E9E9E', fontSize: 13, margin: '2px 0 0' }}>{filtered.length} {t('products.count')}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
          backgroundColor: '#FFD700', border: 'none', borderRadius: 10,
          color: '#111827', cursor: 'pointer', fontWeight: 700, fontSize: 14,
        }}>
          <Plus size={16} /> {t('products.add')}
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '10px 12px', backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8 }}>
          <span style={{ color: '#7C2D12', fontSize: 13, fontWeight: 600 }}>{t('products.selectedCount', { count: selectedIds.length })}</span>
          <button onClick={() => setShowBulkConfirm(true)} disabled={bulkArchiveMutation.isPending} title={t('products.bulkDelete')} aria-label={t('products.bulkDelete')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 7, color: '#B91C1C', cursor: 'pointer', fontWeight: 600, opacity: bulkArchiveMutation.isPending ? 0.6 : 1 }}>
            <Trash2 size={15} /> {bulkArchiveMutation.isPending ? t('products.bulkDeleting') : t('products.bulkDelete')}
          </button>
        </div>
      )}

      {/* Qidiruv + Filtr */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} color="#9E9E9E" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('products.search')}
            style={{
              width: '100%', padding: '11px 14px 11px 40px', backgroundColor: '#fff',
              border: '1.5px solid #E5E5E5', borderRadius: 10, color: '#1A1A1A',
              fontSize: 14, boxSizing: 'border-box',
            }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{
          padding: '11px 14px', backgroundColor: '#fff', border: '1.5px solid #E5E5E5',
          borderRadius: 10, color: catFilter ? '#1A1A1A' : '#9E9E9E', fontSize: 14, minWidth: 160,
        }}>
          <option value="">{t('products.allCategories')}</option>
          {(categories || []).map((c: any) => <option key={c._id} value={c._id}>{isKy ? (c.name_ky || c.name_ru) : c.name_ru}</option>)}
        </select>
        <select aria-label={t('products.filterStatus')} value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'active' | 'hidden' | 'all')} style={{
          padding: '11px 14px', backgroundColor: '#fff', border: '1.5px solid #E5E5E5',
          borderRadius: 10, color: '#1A1A1A', fontSize: 14, minWidth: 160,
        }}>
          <option value="active">{t('products.showActive')}</option>
          <option value="hidden">{t('products.showHidden')}</option>
          <option value="all">{t('products.showAll')}</option>
        </select>
      </div>

      {/* Jadval */}
      <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E5E5', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F0F0F0', backgroundColor: '#FAFAFA' }}>
                {['select', t('products.image'), t('products.name'), t('products.category'), t('products.status'), ''].map(h => (
                  <th key={h} style={{ padding: '11px 12px', textAlign: 'left', color: '#9E9E9E', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                    {h === 'select' ? <input type="checkbox" checked={allVisibleSelected} disabled={selectable.length === 0} aria-label={t('products.selectVisible')} title={t('products.selectVisible')}
                      onChange={e => setSelectedIds(current => e.target.checked ? [...new Set([...current, ...selectable.map((p: any) => p._id)])] : current.filter(id => !selectable.some((p: any) => p._id === id)))} /> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p._id} className="tr-hover" style={{ borderBottom: '1px solid #F5F5F5' }}>
                  <td style={{ padding: '10px 12px' }}><input type="checkbox" checked={selectedIds.includes(p._id)} disabled={!p.isActive} aria-label={t('products.selectProduct', { name: isKy ? (p.name_ky || p.name_ru) : p.name_ru })}
                    onChange={e => setSelectedIds(current => e.target.checked ? [...current, p._id] : current.filter(id => id !== p._id))} /></td>
                  <td style={{ padding: '10px 16px' }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                      : <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#F8F8F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color="#9E9E9E" /></div>
                    }
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 500 }}>
                      {isKy ? (p.name_ky || p.name_ru) : p.name_ru}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {p.isNew        && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }}>{t('products.form.isNew')}</span>}
                      {p.isBestseller && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: '#FFF3E0', color: '#E65100', fontWeight: 600 }}>{t('products.form.isBestseller')}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#9E9E9E', fontSize: 13 }}>
                    {isKy ? (p.category?.name_ky || p.category?.name_ru || '—') : (p.category?.name_ru || '—')}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      backgroundColor: p.isActive ? '#E8F5E9' : '#F5F5F5',
                      color: p.isActive ? '#2D8653' : '#9E9E9E',
                    }}>
                      {p.isActive ? t('products.active') : t('products.inactive')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditing(p); setShowForm(true); }}
                        style={{ padding: '6px 10px', backgroundColor: '#FFF9E6', border: '1px solid #FFD700', borderRadius: 8, cursor: 'pointer', color: '#1A1A1A' }}>
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => p.isActive
                          ? setConfirmId(p._id)
                          : visibilityMutation.mutate({ id: p._id, isActive: true })}
                        disabled={deleteMutation.isPending || visibilityMutation.isPending}
                        title={t(p.isActive ? 'products.hide' : 'products.restore')}
                        aria-label={t(p.isActive ? 'products.hide' : 'products.restore')}
                        style={{ padding: '6px 10px', backgroundColor: p.isActive ? '#FFF0F0' : '#ECFDF5', border: `1px solid ${p.isActive ? '#FFCDD2' : '#A7F3D0'}`, borderRadius: 8, cursor: 'pointer', color: p.isActive ? '#E53935' : '#047857' }}>
                        {p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && (
          <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E', fontSize: 14 }}>{t('common.loading')}</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9E9E9E' }}>{t('products.noProducts')}</div>
        )}
      </div>

      {showForm && (
        <ProductForm product={editing} categories={categories} brands={brands}
          onClose={() => { setShowForm(false); setEditing(null); }} onSaved={onSaved} />
      )}

      {confirmId && (
        <Confirm
          message={t('products.deleteConfirm')}
          onConfirm={() => { deleteMutation.mutate(confirmId!); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {showBulkConfirm && (
        <Confirm
          message={t('products.bulkDeleteConfirm', { count: selectedIds.length })}
          onConfirm={() => bulkArchiveMutation.mutate(selectedIds)}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}
    </div>
  );
};

export default ProductsPage;
