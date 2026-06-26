import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function getPublicTechPassUrl(serial: string) {
  if (typeof window === 'undefined') return '/techpass/' + serial;
  return window.location.origin + '/techpass/' + serial;
}

export async function createQrDataUrl(serial: string) {
  return QRCode.toDataURL(getPublicTechPassUrl(serial), {
    width: 320,
    margin: 2,
    color: {
      dark: '#050505',
      light: '#ffffff',
    },
  });
}

export function QrCode({ serial, size = 112 }: { serial: string; size?: number }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;
    createQrDataUrl(serial).then((value) => {
      if (active) setSrc(value);
    });
    return () => {
      active = false;
    };
  }, [serial]);

  return (
    <div className="qr-pixelated grid place-items-center rounded-md border border-white/10 bg-white p-2" style={{ width: size, height: size }}>
      {src ? <img src={src} alt={'QR Code ' + serial} className="h-full w-full" /> : <span className="text-xs text-black">QR</span>}
    </div>
  );
}
