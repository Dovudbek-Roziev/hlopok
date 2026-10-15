import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { toast } from '../components/Toast';

export default function ReviewsPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['review-moderation', status, page], queryFn: () => api.get('/admin/reviews', { params: { status, page } }).then(r => r.data) });
  const moderate = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => api.put(`/admin/reviews/${id}`, { approved }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review-moderation'] }),
    onError: () => toast.error(t('common.error')),
  });
  const buttons = (id: string) => <span style={{ display: 'flex', gap: 12 }}>
    <button disabled={moderate.isPending} onClick={() => moderate.mutate({ id, approved: true })}>{t('moderation.approve')}</button>
    <button disabled={moderate.isPending} onClick={() => moderate.mutate({ id, approved: false })}>{t('moderation.hide')}</button>
  </span>;
  return <section style={{ padding: 24, maxWidth: 1000 }}>
    <h1>{t('moderation.title')}</h1>
    <select aria-label={t('moderation.title')} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
      <option value="pending">{t('moderation.pending')}</option><option value="approved">{t('moderation.approved')}</option>
    </select>
    {query.isLoading && <p>{t('common.loading')}</p>}
    {query.isError && <button onClick={() => query.refetch()}>{t('common.error')}</button>}
    {query.data?.reviews.map((review: any) => <article key={review._id} style={{ padding: 16, marginTop: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 12 }}>
      <strong>{review.product?.[i18n.language === 'ky' ? 'name_ky' : 'name_ru']}</strong>
      <p>{review.user?.firstName} {review.user?.lastName} · {review.rating}/5</p><p>{review.comment}</p>{buttons(review._id)}
    </article>)}
    <p>{page} / {query.data?.pagination.pages || 1}</p>
    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
    <button disabled={page >= (query.data?.pagination.pages || 1)} onClick={() => setPage(p => p + 1)}>→</button>
    <h2>{t('moderation.reports')}</h2>
    {query.data?.reports.map((report: any) => <article key={report._id} style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
      <p>{report.review?.comment}</p><p>{report.reason}</p>{report.review && buttons(report.review._id)}
    </article>)}
  </section>;
}
