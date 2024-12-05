import React, { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import styles from "../styles/QRScanner.styles";

const QRScanner: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (!html5QrCode) {
      const qrCodeScanner = new Html5Qrcode("qr-code-scanner");
      setHtml5QrCode(qrCodeScanner);
    }

    const initializeScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);

        if (devices && devices.length > 0) {
          const preferredDevice =
            devices.find((d) => d.label.toLowerCase().includes("back")) ||
            devices[0];
          startScanner(preferredDevice.id);
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
      if (html5QrCode) {
        html5QrCode
          .stop()
          .then(() => console.log("Scanner stopped successfully."))
          .catch((err) => console.error("Failed to stop scanner:", err));
      }
    };
  }, [html5QrCode]);

  const startScanner = (deviceId: string) => {
    if (!html5QrCode || isScanning) {
      return;
    }

    setIsScanning(true);

    html5QrCode
      .start(
        { deviceId },
        {
          fps: 30,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log("QR Code scanned:", decodedText);
          setShowOverlay(true);
          setTimeout(() => setShowOverlay(false), 500);
          // alert(`Scanned QR Code: ${decodedText}`);
          const queryParams = new URLSearchParams({ queueInfo: decodedText }).toString();
          window.location.href = `/success?${queryParams}`;
          stopScanner();
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

  const stopScanner = () => {
    if (!html5QrCode || !isScanning) {
      return;
    }

    html5QrCode
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
      {showOverlay && <div style={styles.overlay as React.CSSProperties} />}
    </div>
  );
};

export default QRScanner;
