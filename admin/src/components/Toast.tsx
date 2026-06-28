import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';
interface ToastItem { id: number; type: ToastType; message: string; }

let _show: ((msg: string, type: ToastType) => void) | null = null;

export const toast = {
  success: (msg: string) => _show?.(msg, 'success'),
  error:   (msg: string) => _show?.(msg, 'error'),
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => { _show = show; return () => { _show = null; }; }, [show]);

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'all',
            padding: '12px 14px 12px 16px', borderRadius: 12, minWidth: 260, maxWidth: 380,
            backgroundColor: '#fff',
            borderLeft: `4px solid ${t.type === 'success' ? '#2D8653' : '#E53935'}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            animation: 'toast-in 0.3s ease',
          }}>
            {t.type === 'success'
              ? <CheckCircle size={18} color="#2D8653" style={{ flexShrink: 0 }} />
              : <XCircle    size={18} color="#E53935" style={{ flexShrink: 0 }} />
            }
            <span style={{ flex: 1, color: '#1A1A1A', fontSize: 14, lineHeight: 1.4 }}>{t.message}</span>
            <button onClick={() => remove(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9E9E', padding: 2, flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }`}</style>
    </>
  );
};
