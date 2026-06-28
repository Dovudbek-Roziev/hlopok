import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  onScan: (text: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: Props) => {
  const { t } = useTranslation();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const id = 'qr-reader';

  useEffect(() => {
    let scanner: Html5Qrcode;
    let active = true;

    try {
      scanner = new Html5Qrcode(id);
      scannerRef.current = scanner;
    } catch {
      setError(t('bonus.cameraError'));
      return;
    }

    const stop = () => {
      if (scanner.isRunning) scanner.stop().catch(() => {});
    };

    const onSuccess = (text: string) => {
      stop();
      if (active) onScan(text);
    };

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onSuccess,
      () => {}
    )
      .then(() => { if (active) setStarted(true); })
      .catch(() => {
        scanner.start(
          { facingMode: 'user' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onSuccess,
          () => {}
        )
          .then(() => { if (active) setStarted(true); })
          .catch(() => { if (active) setError(t('bonus.cameraError')); });
      });

    return () => {
      active = false;
      stop();
    };
  }, []);

  const handleClose = () => {
    if (scannerRef.current?.isRunning) {
      scannerRef.current.stop().catch(() => {});
    }
    onClose();
  };

  return (
    <div onClick={handleClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 340,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1A' }}>{t('bonus.scanQR')}</span>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9E9E' }}>
            <X size={20} />
          </button>
        </div>

        <div id={id} style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />

        {error && (
          <div style={{ marginTop: 12, padding: '10px 12px', backgroundColor: '#FFF0F0',
            border: '1px solid #FFCDD2', borderRadius: 8, color: '#E53935', fontSize: 13 }}>
            {error}
          </div>
        )}

        {!error && !started && (
          <p style={{ textAlign: 'center', color: '#9E9E9E', fontSize: 13, marginTop: 12 }}>
            {t('bonus.cameraStarting')}
          </p>
        )}

        {started && !error && (
          <p style={{ textAlign: 'center', color: '#9E9E9E', fontSize: 13, marginTop: 12 }}>
            {t('bonus.cameraReady')}
          </p>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
