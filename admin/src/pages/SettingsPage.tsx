import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Save, Send, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Confirm } from '../components/Confirm';
import api from '../api/client';
import { useAdminStore } from '../store/adminStore';
import { toast } from '../components/Toast';

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', backgroundColor: '#F8F8F8', border: '1.5px solid #E5E5E5', borderRadius: 8, color: '#1A1A1A', fontSize: 14, boxSizing: 'border-box' };
const lbl: React.CSSProperties = { color: '#1A1A1A', fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' };
const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E5E5E5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' };
const sectionTitle: React.CSSProperties = { color: '#1A1A1A', fontSize: 16, fontWeight: 700, margin: '0 0 18px' };

const Msg = ({ msg, ok }: { msg: string; ok: boolean }) => {
  if (!msg) return null;
  return (
    <div style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8,
      backgroundColor: ok ? '#E8F5E9' : '#FFF0F0',
      color: ok ? '#2D8653' : '#E53935',
      border: `1px solid ${ok ? '#C8E6C9' : '#FFCDD2'}` }}>
      {msg}
    </div>
  );
};

const SettingsPage = () => {
  const { t } = useTranslation();
  const { admin, updateAdmin } = useAdminStore();
  const queryClient = useQueryClient();

  const [pwd, setPwd]         = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdMsg, setPwdMsg]   = useState({ text: '', ok: false });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [emailMsg, setEmailMsg]   = useState({ text: '', ok: false });
  const [broadcast, setBroadcast] = useState({
    title_ru: '', title_ky: '', body_ru: '', body_ky: '', target: 'all',
  });
  const [broadcastConfirm, setBroadcastConfirm] = useState(false);
  const [clearConfirm, setClearConfirm]         = useState(false);
  const clearMut = useMutation({
    mutationFn: () => api.delete('/admin/clear-all-data'),
    onSuccess: () => { queryClient.clear(); toast.success(t('settings.clearSuccess')); },
    onError:   () => toast.error(t('common.error')),
  });
  const broadcastMut = useMutation({
    mutationFn: () => api.post('/admin/push-broadcast', broadcast),
    onSuccess: (res: any) => toast.success(t('broadcast.success', { count: res.data.sent })),
    onError:   () => toast.error(t('broadcast.error')),
  });

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-s'],
    queryFn: () => api.get('/store-settings').then(r => r.data.settings),
  });
  const [storeForm, setStoreForm] = useState({
    phone: '', whatsapp: '', instagram: '', telegram: '',
    address_ru: '', address_ky: '', hours_ru: '', hours_ky: '',
    paymentCard: '', paymentName: '', paymentQR: '',
    paymentName2: '', paymentCard2: '', paymentQR2: '',
    paymentLink: '', paymentLink2: '',
  });
  React.useEffect(() => {
    if (storeSettings) setStoreForm({
      phone: storeSettings.phone || '', whatsapp: storeSettings.whatsapp || '',
      instagram: storeSettings.instagram || '', telegram: storeSettings.telegram || '',
      address_ru: storeSettings.address_ru || '', address_ky: storeSettings.address_ky || '',
      hours_ru: storeSettings.hours_ru || '', hours_ky: storeSettings.hours_ky || '',
      paymentCard: storeSettings.paymentCard || '', paymentName: storeSettings.paymentName || '',
      paymentQR: storeSettings.paymentQR || '',
      paymentName2: storeSettings.paymentName2 || '', paymentCard2: storeSettings.paymentCard2 || '',
      paymentQR2: storeSettings.paymentQR2 || '',
      paymentLink: storeSettings.paymentLink || '', paymentLink2: storeSettings.paymentLink2 || '',
    });
  }, [storeSettings]);

  const [qrUploading, setQrUploading]   = useState(false);
  const [qrUploading2, setQrUploading2] = useState(false);

  const handleQRUpload = async (file: File) => {
    setQrUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/store-settings/upload-qr', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStoreForm(f => ({ ...f, paymentQR: res.data.url }));
      queryClient.invalidateQueries({ queryKey: ['store-settings-s'] });
      toast.success(t('settings.storeSaved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setQrUploading(false);
    }
  };

  const handleQRUpload2 = async (file: File) => {
    setQrUploading2(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/store-settings/upload-qr2', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStoreForm(f => ({ ...f, paymentQR2: res.data.url }));
      queryClient.invalidateQueries({ queryKey: ['store-settings-s'] });
      toast.success(t('settings.storeSaved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setQrUploading2(false);
    }
  };

  const updateStore = useMutation({
    mutationFn: (data: any) => api.put('/store-settings', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['store-settings-s'] }); toast.success(t('settings.storeSaved')); },
    onError: () => toast.error(t('common.error')),
  });

  // Email change
  const changeEmail = async () => {
    setEmailMsg({ text: '', ok: false });
    if (!emailForm.newEmail || !emailForm.currentPassword) { setEmailMsg({ text: t('settings.fillAllFields'), ok: false }); return; }
    if (!/^\S+@\S+\.\S+$/.test(emailForm.newEmail)) { setEmailMsg({ text: t('settings.invalidEmail'), ok: false }); return; }
    if (emailForm.newEmail === admin?.email) { setEmailMsg({ text: t('settings.emailSame'), ok: false }); return; }
    try {
      await api.put('/auth/change-email', { newEmail: emailForm.newEmail, currentPassword: emailForm.currentPassword });
      updateAdmin({ email: emailForm.newEmail });
      setEmailMsg({ text: t('settings.emailUpdated'), ok: true });
      setEmailForm({ newEmail: '', currentPassword: '' });
      toast.success(t('settings.emailUpdated'));
    } catch (e: any) {
      setEmailMsg({ text: e.response?.data?.message || t('common.error'), ok: false });
    }
  };

  // Password change
  const changePassword = async () => {
    setPwdMsg({ text: '', ok: false });
    if (!pwd.current || !pwd.newPwd || !pwd.confirm) { setPwdMsg({ text: t('settings.fillAllFields'), ok: false }); return; }
    if (pwd.newPwd !== pwd.confirm) { setPwdMsg({ text: t('settings.passwordMismatch'), ok: false }); return; }
    if (pwd.newPwd.length < 8) { setPwdMsg({ text: t('settings.passwordTooShort'), ok: false }); return; }
    try {
      await api.put('/auth/change-password', { currentPassword: pwd.current, newPassword: pwd.newPwd });
      setPwdMsg({ text: t('settings.passwordChanged'), ok: true });
      setPwd({ current: '', newPwd: '', confirm: '' });
      toast.success(t('settings.passwordChanged'));
    } catch (e: any) {
      setPwdMsg({ text: e.response?.data?.message || t('common.error'), ok: false });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ color: '#1A1A1A', fontSize: 24, fontWeight: 700, margin: 0 }}>{t('settings.title')}</h1>

      {/* Account */}
      <div style={card}>
        <h2 style={sectionTitle}>{t('settings.account')}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, flexShrink: 0,
            backgroundColor: '#FFD70030', border: '2px solid #FFD700',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 24, color: '#1A1A1A' }}>
              {admin?.firstName?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <div style={{ color: '#1A1A1A', fontSize: 17, fontWeight: 600 }}>{admin?.firstName} {admin?.lastName}</div>
            <div style={{ color: '#9E9E9E', fontSize: 13, marginTop: 2 }}>{admin?.email}</div>
            <div style={{ backgroundColor: '#FFD700', color: '#1A1A1A', fontSize: 12, fontWeight: 700, marginTop: 6,
              padding: '2px 10px', borderRadius: 20, display: 'inline-block' }}>{t('settings.adminRole')}</div>
          </div>
        </div>
      </div>

      {/* Change email */}
      <div style={card}>
        <h2 style={sectionTitle}>{t('settings.newEmail')}</h2>
        <div style={{ color: '#9E9E9E', fontSize: 13, marginBottom: 14 }}>
          {t('settings.account')}: <strong style={{ color: '#1A1A1A' }}>{admin?.email || '—'}</strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380 }}>
          <div>
            <label style={lbl}>{t('settings.newEmail')}</label>
            <input type="email" value={emailForm.newEmail} style={inp}
              onChange={e => { setEmailForm(f => ({ ...f, newEmail: e.target.value })); setEmailMsg({ text: '', ok: false }); }}
              placeholder="admin@example.com" />
          </div>
          <div>
            <label style={lbl}>{t('settings.currentPassword')}</label>
            <input type="password" value={emailForm.currentPassword} style={inp}
              onChange={e => { setEmailForm(f => ({ ...f, currentPassword: e.target.value })); setEmailMsg({ text: '', ok: false }); }} />
          </div>
          <Msg msg={emailMsg.text} ok={emailMsg.ok} />
          <button onClick={changeEmail}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', backgroundColor: '#FFD700',
              border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13, color: '#111827', width: 'fit-content' }}>
            <Save size={15} /> {t('settings.save')}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div style={card}>
        <h2 style={sectionTitle}>{t('settings.changePassword')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380 }}>
          {[
            { label: t('settings.currentPassword'), key: 'current' },
            { label: t('settings.newPassword'),     key: 'newPwd' },
            { label: t('settings.confirmPassword'), key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={(showPwd as any)[key] ? 'text' : 'password'}
                  value={(pwd as any)[key]} style={{ ...inp, paddingRight: 40 }}
                  onChange={e => { setPwd(p => ({ ...p, [key]: e.target.value })); setPwdMsg({ text: '', ok: false }); }} />
                <button type="button"
                  onClick={() => setShowPwd(s => ({ ...s, [key]: !(s as any)[key] }))}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9E9E9E', padding: 0, display: 'flex' }}>
                  {(showPwd as any)[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          <Msg msg={pwdMsg.text} ok={pwdMsg.ok} />
          <button onClick={changePassword}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', backgroundColor: '#2D8653',
              border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13, color: '#fff', width: 'fit-content' }}>
            <Save size={15} /> {t('settings.pwdSave')}
          </button>
        </div>
      </div>

      {/* Store info */}
      <div style={card}>
        <h2 style={sectionTitle}>{t('settings.storeInfo')}</h2>
        <p style={{ color: '#9E9E9E', fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>{t('settings.storeInfoDesc')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 560 }}>
          <div>
            <label style={lbl}>{t('settings.phone')}</label>
            <input style={inp} value={storeForm.phone} onChange={e => setStoreForm(f => ({ ...f, phone: e.target.value }))} placeholder="+996222098531" />
          </div>
          <div>
            <label style={lbl}>WhatsApp</label>
            <input style={inp} value={storeForm.whatsapp} onChange={e => setStoreForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="https://wa.me/996222098531" />
          </div>
          <div>
            <label style={lbl}>Instagram</label>
            <input style={inp} value={storeForm.instagram} onChange={e => setStoreForm(f => ({ ...f, instagram: e.target.value }))} placeholder="https://www.instagram.com/..." />
          </div>
          <div>
            <label style={lbl}>Telegram</label>
            <input style={inp} value={storeForm.telegram} onChange={e => setStoreForm(f => ({ ...f, telegram: e.target.value }))} placeholder="https://t.me/..." />
          </div>
          <div>
            <label style={lbl}>{t('settings.addressRu')}</label>
            <input style={inp} value={storeForm.address_ru} onChange={e => setStoreForm(f => ({ ...f, address_ru: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>{t('settings.addressKy')}</label>
            <input style={inp} value={storeForm.address_ky} onChange={e => setStoreForm(f => ({ ...f, address_ky: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>{t('settings.hoursRu')}</label>
            <input style={inp} value={storeForm.hours_ru} onChange={e => setStoreForm(f => ({ ...f, hours_ru: e.target.value }))} placeholder="9:00 - 21:00" />
          </div>
          <div>
            <label style={lbl}>{t('settings.hoursKy')}</label>
            <input style={inp} value={storeForm.hours_ky} onChange={e => setStoreForm(f => ({ ...f, hours_ky: e.target.value }))} placeholder="9:00 - 21:00" />
          </div>
        </div>

        {/* Payment banks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 560, marginTop: 8 }}>

          {/* Mbank */}
          <div style={{ border: '2px solid #007A3D', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#007A3D', padding: '10px 14px' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Mbank</span>
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={lbl}>{t('settings.paymentName')}</label>
                <input style={inp} value={storeForm.paymentName}
                  onChange={e => setStoreForm(f => ({ ...f, paymentName: e.target.value }))}
                  placeholder="ЖУМАГУЛ С." />
              </div>
              <div>
                <label style={lbl}>{t('settings.paymentCard')}</label>
                <input style={inp} value={storeForm.paymentCard}
                  onChange={e => setStoreForm(f => ({ ...f, paymentCard: e.target.value }))}
                  placeholder="+996 222 098 531" />
              </div>
              <div>
                <label style={lbl}>{t('settings.paymentQR')}</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {storeForm.paymentQR && (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={storeForm.paymentQR} alt="QR" style={{ width: 90, height: 90, borderRadius: 8, border: '1.5px solid #E5E5E5', objectFit: 'contain', backgroundColor: '#fff' }} />
                      <button onClick={() => setStoreForm(f => { const next = { ...f, paymentQR: '' }; updateStore.mutate(next); return next; })}
                        style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#E53935', border: 'none', color: '#fff', fontSize: 12, lineHeight: '20px', textAlign: 'center', cursor: 'pointer', fontWeight: 700 }}>×</button>
                    </div>
                  )}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                    backgroundColor: qrUploading ? '#F0F0F0' : '#F0FAF4', border: '1.5px dashed #007A3D',
                    borderRadius: 8, cursor: qrUploading ? 'default' : 'pointer', fontSize: 12, color: '#007A3D', fontWeight: 600 }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={qrUploading}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleQRUpload(f); e.target.value = ''; }} />
                    {qrUploading ? '...' : (storeForm.paymentQR ? t('settings.changeQR') : t('settings.uploadQR'))}
                  </label>
                </div>
              </div>
              <div>
                <label style={lbl}>{t('settings.paymentLink')}</label>
                <input style={inp} value={storeForm.paymentLink}
                  onChange={e => setStoreForm(f => ({ ...f, paymentLink: e.target.value }))}
                  placeholder="https://link.mbank.kg/..." />
                <p style={{ color: '#9E9E9E', fontSize: 12, margin: '4px 0 0' }}>{t('settings.paymentLinkHint')}</p>
              </div>
            </div>
          </div>

          {/* O! Business */}
          <div style={{ border: '2px solid #E91E8C', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#111', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#E91E8C', fontWeight: 900, fontSize: 15 }}>O!</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Business</span>
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={lbl}>{t('settings.paymentName2')}</label>
                <input style={inp} value={storeForm.paymentName2}
                  onChange={e => setStoreForm(f => ({ ...f, paymentName2: e.target.value }))}
                  placeholder="ИП Сабирова Ж." />
              </div>
              <div>
                <label style={lbl}>{t('settings.paymentCard2')}</label>
                <input style={inp} value={storeForm.paymentCard2}
                  onChange={e => setStoreForm(f => ({ ...f, paymentCard2: e.target.value }))}
                  placeholder="1250 8000 0097 7704" />
              </div>
              <div>
                <label style={lbl}>{t('settings.paymentQR2')}</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {storeForm.paymentQR2 && (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={storeForm.paymentQR2} alt="QR2" style={{ width: 90, height: 90, borderRadius: 8, border: '1.5px solid #E5E5E5', objectFit: 'contain', backgroundColor: '#fff' }} />
                      <button onClick={() => setStoreForm(f => { const next = { ...f, paymentQR2: '' }; updateStore.mutate(next); return next; })}
                        style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#E53935', border: 'none', color: '#fff', fontSize: 12, lineHeight: '20px', textAlign: 'center', cursor: 'pointer', fontWeight: 700 }}>×</button>
                    </div>
                  )}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                    backgroundColor: qrUploading2 ? '#F0F0F0' : '#FDF0F7', border: '1.5px dashed #E91E8C',
                    borderRadius: 8, cursor: qrUploading2 ? 'default' : 'pointer', fontSize: 12, color: '#E91E8C', fontWeight: 600 }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={qrUploading2}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleQRUpload2(f); e.target.value = ''; }} />
                    {qrUploading2 ? '...' : (storeForm.paymentQR2 ? t('settings.changeQR2') : t('settings.uploadQR2'))}
                  </label>
                </div>
              </div>
              <div>
                <label style={lbl}>{t('settings.paymentLink2')}</label>
                <input style={inp} value={storeForm.paymentLink2}
                  onChange={e => setStoreForm(f => ({ ...f, paymentLink2: e.target.value }))}
                  placeholder="https://odengi.kg/pay/..." />
                <p style={{ color: '#9E9E9E', fontSize: 12, margin: '4px 0 0' }}>{t('settings.paymentLinkHint2')}</p>
              </div>
            </div>
          </div>

        </div>
        <button onClick={() => updateStore.mutate(storeForm)} disabled={updateStore.isPending}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '10px 18px',
            backgroundColor: '#FFD700', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13, color: '#111827' }}>
          <Save size={15} /> {updateStore.isPending ? t('settings.saving') : t('settings.save')}
        </button>
      </div>

      {/* Push broadcast */}
      <div style={card}>
        <h2 style={sectionTitle}>{t('broadcast.title')}</h2>
        <p style={{ color: '#9E9E9E', fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>{t('broadcast.desc')}</p>

        {/* Target selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>{t('broadcast.target')}</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['all', 'active', 'bonus'] as const).map(tgt => (
              <button key={tgt} onClick={() => setBroadcast(b => ({ ...b, target: tgt }))}
                style={{
                  padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: broadcast.target === tgt ? '2px solid #FFD700' : '1.5px solid #E5E5E5',
                  backgroundColor: broadcast.target === tgt ? '#FFF8D6' : '#F8F8F8',
                  color: '#1A1A1A',
                }}>
                {t(`broadcast.target_${tgt}`)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 600 }}>
          <div>
            <label style={lbl}>{t('broadcast.titleRu')}</label>
            <input style={inp} value={broadcast.title_ru} placeholder={t('broadcast.placeholderTitleRu')}
              onChange={e => setBroadcast(b => ({ ...b, title_ru: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>{t('broadcast.titleKy')}</label>
            <input style={inp} value={broadcast.title_ky} placeholder={t('broadcast.placeholderTitleKy')}
              onChange={e => setBroadcast(b => ({ ...b, title_ky: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>{t('broadcast.bodyRu')}</label>
            <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' } as React.CSSProperties}
              value={broadcast.body_ru} placeholder={t('broadcast.placeholderBodyRu')}
              onChange={e => setBroadcast(b => ({ ...b, body_ru: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>{t('broadcast.bodyKy')}</label>
            <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' } as React.CSSProperties}
              value={broadcast.body_ky} placeholder={t('broadcast.placeholderBodyKy')}
              onChange={e => setBroadcast(b => ({ ...b, body_ky: e.target.value }))} />
          </div>
        </div>

        <button
          onClick={() => {
            if (!broadcast.title_ru || !broadcast.title_ky || !broadcast.body_ru || !broadcast.body_ky) {
              toast.error(t('broadcast.fillAll')); return;
            }
            setBroadcastConfirm(true);
          }}
          disabled={broadcastMut.isPending}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '11px 22px',
            backgroundColor: '#1565C0', border: 'none', borderRadius: 10,
            fontWeight: 700, cursor: 'pointer', fontSize: 13, color: '#fff', opacity: broadcastMut.isPending ? 0.7 : 1 }}>
          <Send size={15} />
          {broadcastMut.isPending ? t('broadcast.sending') : t('broadcast.send')}
        </button>
      </div>

      {/* Danger zone */}
      <div style={{ ...card, border: '1.5px solid #FECACA' }}>
        <h2 style={{ ...sectionTitle, color: '#DC2626' }}>{t('settings.dangerZone')}</h2>
        <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>
          {t('settings.dangerDesc')}
        </p>
        <button
          onClick={() => setClearConfirm(true)}
          disabled={clearMut.isPending}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px',
            backgroundColor: '#DC2626', border: 'none', borderRadius: 10,
            fontWeight: 700, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
          <Trash2 size={15} />
          {clearMut.isPending ? t('settings.clearing') : t('settings.clearAll')}
        </button>
      </div>

      {broadcastConfirm && (
        <Confirm
          message={t('broadcast.confirm')}
          onConfirm={() => { setBroadcastConfirm(false); broadcastMut.mutate(); }}
          onCancel={() => setBroadcastConfirm(false)}
        />
      )}
      {clearConfirm && (
        <Confirm
          message={t('settings.clearConfirm')}
          onConfirm={() => { setClearConfirm(false); clearMut.mutate(); }}
          onCancel={() => setClearConfirm(false)}
        />
      )}
    </div>
  );
};

export default SettingsPage;
