import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import styles from "../styles/QRScanner.styles";

const QRScanner: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isTransitioning = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const scannerId = "qr-code-scanner";

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerId);
    }

    const initializeScanner = async () => {
      if (isTransitioning.current) {
        console.warn("Scanner is already transitioning.");
        return;
      }
      isTransitioning.current = true;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices.length > 0) {
          const backCamera = devices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('environment')
          );
          const preferredDevice = backCamera || devices[0];
          console.log("Using camera:", preferredDevice.label);

          await scannerRef.current?.start(
            { deviceId: preferredDevice.id },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              console.log("QR Code scanned:", decodedText);
              setError(null);
              const queryParams = new URLSearchParams({ queueInfo: decodedText }).toString();
              navigate(`/success?${queryParams}`);
            },
            (scanError) => console.warn("Scanning error:", scanError)
          );

          const videoElement = document.querySelector(`#${scannerId} video`) as HTMLVideoElement;
          if (videoElement) {
            Object.assign(videoElement.style, {
              width: "100%",
              height: "100%",
              objectFit: "cover",
            });
          }
        } else {
          setError("No cameras found on this device.");
        }
      } catch (err) {
        console.error("Error initializing scanner:", err);
        setError("Error accessing camera. Please check permissions.");
      } finally {
        isTransitioning.current = false;
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            console.log("Scanner stopped successfully.");
            try {
              scannerRef.current?.clear();
              console.log("Scanner cleared successfully.");
            } catch (err: unknown) {
              console.warn("Failed to clear scanner:", err);
            }
          })
          .catch((err: unknown) => console.warn("Failed to stop scanner:", err))
          .finally(() => {
            scannerRef.current = null;
          });
      } else {
        try {
          scannerRef.current?.clear();
          console.log("Scanner cleared successfully.");
        } catch (err: unknown) {
          console.warn("Failed to clear scanner:", err);
        } finally {
          scannerRef.current = null;
        }
      }
    };
  }, [navigate]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleBackClick = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current
        .stop()
        .then(() => navigate("/main"))
        .catch((err) => console.warn("Error stopping scanner before navigation:", err));
    } else {
      navigate("/main");
    }
  };

  return (
    <div style={styles.container as React.CSSProperties}>
      <button
        style={{
          ...styles.backButton,
          ...(isHovered ? styles.backButtonHover : {}),
        } as React.CSSProperties}
        onClick={handleBackClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        &lt;
      </button>
      {error && <p style={styles.error as React.CSSProperties}>{error}</p>}
      <div id="qr-code-scanner" style={styles.scannerContainer as React.CSSProperties}></div>
    </div>
  );
};

export default QRScanner;
