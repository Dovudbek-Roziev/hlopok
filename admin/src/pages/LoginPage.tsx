import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import { useAdminStore } from '../store/adminStore';
import logo from '../assets/logo.jpg';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setAuth } = useAdminStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.user.role !== 'admin') { setError(t('login.noAccess')); return; }
      setAuth(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => {
    const next = i18n.language === 'ru' ? 'ky' : 'ru';
    i18n.changeLanguage(next);
    localStorage.setItem('admin_lang', next);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 900,
        backgroundColor: '#fff',
        borderRadius: 24,
        boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
        overflow: 'hidden',
        display: 'flex',
      }} className="login-card">

        {/* Chap — sariq brend paneli / Left — yellow brand panel */}
        <div className="login-brand" style={{
          flex: 1,
          overflow: 'hidden',
          minHeight: 520,
        }}>
          <img src={logo} alt="Хлопок" style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }} />
        </div>

        {/* O'ng — forma / Right — form */}
        <div style={{ flex: 1, padding: '48px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="login-form-side">

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', letterSpacing: -0.5 }}>
              {t('login.subtitle')}
            </div>
            <div style={{ fontSize: 14, color: '#9E9E9E', marginTop: 4 }}>
              Hlopok Admin Panel
            </div>
          </div>

          {/* Til tugmasi / Language toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button onClick={toggleLang} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20,
              border: '1px solid #E5E5E5',
              backgroundColor: '#F8F8F8',
              color: '#555', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
            }}>
              <Globe size={13} />
              {i18n.language === 'ru' ? t('common.langKy') : t('common.langRu')}
            </button>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: 6 }}>
                {t('login.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="example@mail.com"
                style={{
                  width: '100%', padding: '12px 14px',
                  backgroundColor: '#F8F8F8',
                  border: '1.5px solid #E5E5E5',
                  borderRadius: 12, color: '#1A1A1A',
                  fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
                className="l-input"
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: 6 }}>
                {t('login.password')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '12px 44px 12px 14px',
                    backgroundColor: '#F8F8F8',
                    border: '1.5px solid #E5E5E5',
                    borderRadius: 12, color: '#1A1A1A',
                    fontSize: 14, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  className="l-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#9E9E9E', padding: 4,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#FFF0F0',
                border: '1px solid #FFCDD2',
                borderRadius: 10, color: '#E53935', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px',
                backgroundColor: loading ? '#B0B0B0' : '#1A1A1A',
                border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#FFD700',
                marginTop: 4,
                transition: 'background-color 0.2s',
                letterSpacing: 0.2,
              }}
            >
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .l-input:focus { border-color: #FFD700 !important; box-shadow: 0 0 0 3px rgba(255,215,0,0.2) !important; }
        @media (max-width: 640px) {
          .login-card { flex-direction: column !important; max-width: 420px !important; }
          .login-brand { min-height: auto !important; padding: 32px 24px !important; }
.login-form-side { padding: 32px 28px !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
