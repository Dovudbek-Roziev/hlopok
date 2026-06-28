import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

interface ConfirmProps {
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const Confirm = ({ message, onConfirm, onCancel }: ConfirmProps) => {
  const { t } = useTranslation();
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.10)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, width: 320,
          border: '1px solid #E5E5E5', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', textAlign: 'center' }}>
        <AlertTriangle size={32} color="#FF9800" style={{ marginBottom: 12 }} />
        <p style={{ color: '#1A1A1A', fontSize: 15, margin: '0 0 20px', lineHeight: 1.5 }}>
          {message || t('common.confirmDelete')}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: 11, backgroundColor: '#F8F8F8', border: '1px solid #E5E5E5',
              borderRadius: 10, color: '#1A1A1A', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
            {t('common.no')}
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: 11, backgroundColor: '#E53935', border: 'none',
              borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            {t('common.yes')}
          </button>
        </div>
      </div>
    </div>
  );
};
