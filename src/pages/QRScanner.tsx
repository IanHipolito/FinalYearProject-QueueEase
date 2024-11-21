import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner: React.FC = () => {
  const qrCodeScannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrCodeScannerRef.current) {
      const html5QrCodeScanner = new Html5QrcodeScanner(
        qrCodeScannerRef.current.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false
      );

      html5QrCodeScanner.render(
        (decodedText) => {
          console.log('Scanned QR Code:', decodedText);
          alert(`Scanned QR Code: ${decodedText}`);
        },
        (errorMessage) => {
          console.error('QR Scanner Error:', errorMessage);
        }
      );

      return () => {
        html5QrCodeScanner.clear().catch((err) => {
          console.error('Failed to clear QR scanner:', err);
        });
      };
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>QR Scanner</h1>
      <div
        id="qr-code-scanner"
        ref={qrCodeScannerRef}
        style={{
          width: '300px',
          margin: 'auto',
        }}
      />
    </div>
  );
};

export default QRScanner;
