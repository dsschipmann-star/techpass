import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QrCanvasProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCanvas({ value, size = 180, className }: QrCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
  }, [value, size]);
  return <canvas ref={ref} className={className} />;
}

export async function qrToDataUrl(value: string, size = 512) {
  return QRCode.toDataURL(value, {
    width: size,
    margin: 1,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}