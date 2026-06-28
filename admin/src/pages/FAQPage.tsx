import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, X, ChevronUp, ChevronDown, Info, HelpCircle } from 'lucide-react';
import api from '../api/client';
import { toast } from '../components/Toast';
import { Confirm } from '../components/Confirm';

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', backgroundColor: '#F8F8F8',
  border: '1.5px solid #E5E5E5', borderRadius: 8, color: '#1A1A1A',
  fontSize: 14, boxSizing: 'border-box',
};
const ta: React.CSSProperties = { ...inp, height: 80, resize: 'vertical' as const };
const lbl: React.CSSProperties = { color: '#1A1A1A', fontSize: 13, fontWeight: 600, marginBottom: 5, display: 'block' };

const FAQForm = ({ faq, onClose, onSaved }: any) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    q_ru: faq?.q_ru || '',
    a_ru: faq?.a_ru || '',
    q_ky: faq?.q_ky || '',
    a_ky: faq?.a_ky || '',
    order: faq?.order ?? 0,
    isActive: faq?.isActive !== false,
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.q_ru.trim() || !form.a_ru.trim() || !form.q_ky.trim() || !form.a_ky.trim()) {
      toast.error(t('faq.allRequired'));
      return;
    }
    setLoading(true);
    try {
      if (faq) await api.put(`/faqs/${faq._id}`, form);
      else      await api.post('/faqs', form);
      onSaved();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 500,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} className="modal-in"
        style={{ width: '100%', maxWidth: 560, backgroundColor: '#fff', borderRadius: 16, padding: 28,
          border: '1px solid #E5E5E5', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ color: '#1A1A1A', margin: 0, fontWeight: 700, fontSize: 17 }}>
            {faq ? t('faq.editTitle') : t('faq.addTitle')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9E9E', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* RU */}
          <div style={{ backgroundColor: '#F8F8F8', borderRadius: 10, padding: 14, border: '1px solid #E5E5E5' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9E9E9E', marginBottom: 10, letterSpacing: 1 }}>{t('common.langRu').toUpperCase()}</div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>{t('faq.questionRu')}</label>
              <input style={inp} value={form.q_ru} onChange={set('q_ru')} />
            </div>
            <div>
              <label style={lbl}>{t('faq.answerRu')}</label>
              <textarea style={ta} value={form.a_ru} onChange={set('a_ru')} />
            </div>
          </div>

          {/* KY */}
          <div style={{ backgroundColor: '#F8F8F8', borderRadius: 10, padding: 14, border: '1px solid #E5E5E5' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9E9E9E', marginBottom: 10, letterSpacing: 1 }}>{t('common.langKy').toUpperCase()}</div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>{t('faq.questionKy')}</label>
              <input style={inp} value={form.q_ky} onChange={set('q_ky')} />
            </div>
            <div>
              <label style={lbl}>{t('faq.answerKy')}</label>
              <textarea style={ta} value={form.a_ky} onChange={set('a_ky')} />
            </div>
          </div>

          {/* Order + Active */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>{t('faq.order')}</label>
              <input type="number" style={inp} value={form.order}
                onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1A1A1A', cursor: 'pointer', fontSize: 14, marginTop: 18 }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              {t('faq.active')}
            </label>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 8, borderTop: '1px solid #F0F0F0' }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: 12, backgroundColor: '#F8F8F8', border: '1px solid #E5E5E5',
                borderRadius: 10, color: '#1A1A1A', cursor: 'pointer', fontWeight: 500 }}>
              {t('common.no')}
            </button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, padding: 12, backgroundColor: '#FFD700', border: 'none',
                borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: '#111827', opacity: loading ? 0.7 : 1 }}>
              {loading ? t('faq.saving') : t('faq.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQPage = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: () => api.get('/faqs/admin').then(r => r.data.faqs),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/faqs/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-faqs'] }); toast.success(t('faq.deleted')); },
    onError: () => toast.error(t('common.error')),
  });

  const moveOrder = async (faq: any, dir: -1 | 1) => {
    try {
      await api.put(`/faqs/${faq._id}`, { ...faq, order: faq.order + dir });
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
    } catch { toast.error(t('common.error')); }
  };

  const onSaved = () => {
    setShowForm(false); setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
    toast.success(t('faq.saved'));
  };

  const faqs = data || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, margin: 0 }}>{t('faq.title')}</h1>
          <p style={{ color: '#9E9E9E', fontSize: 13, margin: '2px 0 0' }}>{faqs.length} {t('faq.count')}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            backgroundColor: '#111827', border: 'none', borderRadius: 10, color: '#FFD700',
            cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          <Plus size={16} /> {t('faq.add')}
        </button>
      </div>

      {/* Hint */}
      <div style={{ backgroundColor: '#FFF9E6', border: '1px solid #FFD700', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#7A6000', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Info size={14} /> {t('faq.hint')}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E' }}>...</div>
      ) : faqs.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E5E5' }}>
          <HelpCircle size={32} color="#9E9E9E" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 15, fontWeight: 500 }}>{t('faq.noFaqs')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq: any, idx: number) => (
            <div key={faq._id}
              style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E5E5',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                {/* Order controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button onClick={() => moveOrder(faq, -1)} disabled={idx === 0}
                    style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer',
                      color: idx === 0 ? '#D0D0D0' : '#9E9E9E', padding: 2, display: 'flex' }}>
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moveOrder(faq, 1)} disabled={idx === faqs.length - 1}
                    style={{ background: 'none', border: 'none', cursor: idx === faqs.length - 1 ? 'default' : 'pointer',
                      color: idx === faqs.length - 1 ? '#D0D0D0' : '#9E9E9E', padding: 2, display: 'flex' }}>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Number */}
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#F5F5F5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#9E9E9E', flexShrink: 0 }}>
                  {idx + 1}
                </div>

                {/* Content — clickable to expand */}
                <div style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                  onClick={() => setExpandedId(expandedId === faq._id ? null : faq._id)}>
                  <div style={{ fontWeight: 600, color: '#1A1A1A', fontSize: 14,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {faq.q_ru}
                  </div>
                  <div style={{ fontSize: 12, color: '#9E9E9E', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {faq.q_ky}
                  </div>
                </div>

                {/* Status badge */}
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0,
                  backgroundColor: faq.isActive ? '#E8F5E9' : '#F5F5F5',
                  color: faq.isActive ? '#2D8653' : '#9E9E9E' }}>
                  {faq.isActive ? t('faq.active') : t('faq.inactive')}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { setEditing(faq); setShowForm(true); }}
                    style={{ padding: '7px 10px', backgroundColor: '#FFF9E6', border: '1px solid #FFD700',
                      borderRadius: 8, cursor: 'pointer', color: '#1A1A1A', display: 'flex', alignItems: 'center' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setConfirmId(faq._id)}
                    style={{ padding: '7px 10px', backgroundColor: '#FFF0F0', border: '1px solid #FFCDD2',
                      borderRadius: 8, cursor: 'pointer', color: '#E53935', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === faq._id && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F0F0F0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9E9E9E', marginBottom: 6, letterSpacing: 1 }}>RU</div>
                      <div style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 600, marginBottom: 4 }}>{faq.q_ru}</div>
                      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{faq.a_ru}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, letterSpacing: 1 }}>KY</div>
                      <div style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 600, marginBottom: 4 }}>{faq.q_ky}</div>
                      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{faq.a_ky}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && <FAQForm faq={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={onSaved} />}

      {confirmId && (
        <Confirm
          onConfirm={() => { deleteMutation.mutate(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
};

export default FAQPage;
