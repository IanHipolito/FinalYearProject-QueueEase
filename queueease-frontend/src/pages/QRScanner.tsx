import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Container, 
  Typography, 
  IconButton,
  Paper,
  Alert,
  Backdrop,
  CircularProgress,
  Fade,
  useTheme
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

const QRScanner: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isTransitioning = useRef(false);
  const theme = useTheme();
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
      setLoading(true);

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
              const match = decodedText.match(/Queue ID:\s*(\d+)/);
              if (!match) {
                console.error("Invalid QR code format");
                setError("Invalid QR code format");
                return;
              }
              const queueId = match[1];
              navigate(`/success/${queueId}`);
            },
            (scanError) => console.warn("Scanning error:", scanError)
          );

          const videoElement = document.querySelector(`#${scannerId} video`) as HTMLVideoElement;
          if (videoElement) {
            Object.assign(videoElement.style, {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "12px"
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
        setLoading(false);
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

  const handleBackClick = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current
        .stop()
        .then(() => navigate("/usermainpage"))
        .catch((err) => console.warn("Error stopping scanner before navigation:", err));
    } else {
      navigate("/usermainpage");
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fb',
        display: 'flex',
        flexDirection: 'column',
        pt: 2,
        px: 2,
        pb: 4
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={handleBackClick} 
            sx={{ 
              mr: 2,
              color: theme.palette.primary.main,
              '&:hover': { 
                bgcolor: 'rgba(111, 66, 193, 0.08)' 
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={600} color="textPrimary">
            Scan QR Code
          </Typography>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            height: 'calc(100vh - 180px)',
            maxHeight: '600px',
            mb: 2,
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {loading && (
            <Backdrop
              open={loading}
              sx={{ 
                position: 'absolute', 
                zIndex: (theme) => theme.zIndex.drawer + 1,
                color: theme.palette.primary.main,
                backgroundColor: 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <CircularProgress color="inherit" />
            </Backdrop>
          )}
          
          <Box
            id="qr-code-scanner"
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
          />
          
          <Box
            sx={{
              position: 'absolute',
              width: '260px',
              height: '260px',
              border: '2px solid #ffffff',
              borderRadius: '12px',
              boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.3)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
          
          <Fade in={!loading && !error}>
            <Box
              sx={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '30px',
                px: 3,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                zIndex: 3,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}
            >
              <QrCodeScannerIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.secondary">
                Position the QR code in the frame
              </Typography>
            </Box>
          </Fade>
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Make sure the QR code is well lit and clearly visible
        </Typography>
      </Container>
    </Box>
  );
};

export default QRScanner;