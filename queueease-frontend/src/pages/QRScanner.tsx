import React, { useEffect, useState } from "react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import styles from "../styles/QRScanner.styles";

const QRScanner: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrCodeScanner = new Html5Qrcode("qr-code-scanner");
    setHtml5QrCode(qrCodeScanner);

    const initializeScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);

        if (devices && devices.length > 0) {
          const preferredDevice =
            devices.find((d) => d.label.toLowerCase().includes("back")) ||
            devices[0];
          startScanner(preferredDevice.id, qrCodeScanner);
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
      stopScanner(qrCodeScanner);
    };
  }, []);

  const startScanner = (deviceId: string, qrScanner: Html5Qrcode) => {
    if (isScanning) {
      console.warn("Scanner is already running.");
      return;
    }

    setIsScanning(true);

    qrScanner
      .start(
        { deviceId },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log("QR Code scanned:", decodedText);
          alert(`Scanned QR Code: ${decodedText}`);
          stopScanner(qrScanner);
        },
        (error) => {
          console.warn("Scanning error:", error);
        }
      )
      .catch((err) => {
        setError("Failed to start scanner.");
        console.error("Scanner error:", err);
      });
  };

  const stopScanner = (qrScanner: Html5Qrcode | null) => {
    if (!qrScanner || !isScanning) {
      console.warn("Scanner is not running.");
      return;
    }

    qrScanner
      .stop()
      .then(() => {
        console.log("Scanner stopped successfully.");
        setIsScanning(false);
      })
      .catch((err) => {
        console.error("Failed to stop scanner:", err);
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
