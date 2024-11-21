import React, { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import styles from "../styles/QRScanner.styles";

const QRScanner: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-code-scanner");

    const initializeScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);

        if (devices && devices.length > 0) {
          const preferredDevice =
            devices.find((d) => d.label.toLowerCase().includes("back")) ||
            devices[0];
          startScanner(preferredDevice.id, html5QrCode);
        } else {
          setError("No cameras found on this device.");
        }
      } catch (err) {
        if ((err as Error).message?.includes("Permission denied")) {
          setError("Camera permission was denied. Please allow camera access.");
        } else {
          setError("Error accessing camera. Please try again.");
        }
        console.error("Camera error:", err);
      }
    };

    initializeScanner();

    return () => {
      if (isScanning) {
        html5QrCode
          .stop()
          .catch((err: unknown) => console.error("Failed to stop scanner:", err));
      }
    };
  }, [isScanning]);

  const startScanner = (deviceId: string, html5QrCode: Html5Qrcode) => {
    setIsScanning(true);

    html5QrCode
      .start(
        { deviceId },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log("QR Code scanned:", decodedText);
          alert(`Scanned QR Code: ${decodedText}`);
          html5QrCode
            .stop()
            .catch((err: unknown) => console.error("Failed to stop scanner:", err));
          setIsScanning(false);
        },
        (error) => {
          console.error("Scanning error:", error);
        }
      )
      .catch((err) => {
        setError("Failed to start scanner.");
        console.error("Scanner error:", err);
      });
  };

  return (
    <div style={styles.container as React.CSSProperties}>
      <h1>QR Scanner</h1>
      {error && <p style={styles.error}>{error}</p>}
      <div id="qr-code-scanner" style={styles.scanner} />
    </div>
  );
};

export default QRScanner;
