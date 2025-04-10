import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { 
  Box, Container, Typography, IconButton, Paper, Alert,
  Backdrop, CircularProgress, Fade, useTheme, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { API } from "../services/api";

const QRScanner: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cameraStarted, setCameraStarted] = useState<boolean>(false);
  const [permissionAsked, setPermissionAsked] = useState<boolean>(false);
  const [permissionDialog, setPermissionDialog] = useState<boolean>(true); // Start with dialog open
  const [iOSPermissionRetry, setIOSPermissionRetry] = useState<boolean>(false); // iOS specific retry state
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isTransitioning = useRef(false);
  const theme = useTheme();
  const navigate = useNavigate();

  // Detect device types and modes
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;
  const isiOSPWA = isIOS && isPWA;

  useEffect(() => {
    // Log environment info for debugging
    console.log("Environment info:", { isIOS, isSafari, isPWA, isiOSPWA });
  }, [isIOS, isSafari, isPWA, isiOSPWA]);

  // Function to validate QR code
  const validateQRCode = (decodedText: string) => {
    console.log("QR Code scanned:", decodedText);
    setError(null);
    
    // First try to validate using direct service API - modern QR format 
    if (decodedText.startsWith('QE-')) {
      try {
        API.queues.validateQR(decodedText)
          .then(result => {
            if (result && result.queue_id) {
              navigate(`/success/${result.queue_id}`);
            } else {
              setError("Invalid QR code");
            }
          })
          .catch(err => {
            console.error("Error validating QR:", err);
            setError("Error validating QR code");
          });
        return;
      } catch (err) {
        console.error("Error processing QR validation:", err);
      }
    }
    
    // Legacy pattern matching as fallback
    const match = decodedText.match(/Queue ID:\s*(\d+)/);
    if (!match) {
      console.error("Invalid QR code format");
      setError("Invalid QR code format");
      return;
    }
    const queueId = match[1];
    navigate(`/success/${queueId}`);
  };

  // Special iOS camera constraints based on mode
  const getiOSCameraConstraints = () => {
    if (isIOS) {
      if (isPWA) {
        // Simplify constraints for PWA mode
        return {
          audio: false,
          video: {
            facingMode: "environment",
            width: { ideal: 720 },
            height: { ideal: 720 }
          }
        };
      }
      // Browser mode constraints
      return {
        audio: false,
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
    } else {
      return {
        audio: false,
        video: { facingMode: "environment" }
      };
    }
  };

  // Request camera permission with iOS-specific handling
  const requestCameraPermission = async () => {
    setPermissionAsked(true);
    setPermissionDialog(false);
    setLoading(true);
    
    try {
      console.log("Requesting camera permission explicitly...");
      
      // Use optimized constraints
      const constraints = getiOSCameraConstraints();
      console.log("Using camera constraints:", constraints);
      
      // Request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (isIOS) {
        console.log("iOS device detected, keeping stream active briefly");
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Stop tracks after permission granted
      stream.getTracks().forEach(track => track.stop());
      
      console.log("Camera permission granted, initializing scanner");
      
      // Special handling for iOS Safari vs PWA
      if (isIOS) {
        if (isPWA) {
          // For iOS PWA a longer delay and different initialization
          setTimeout(() => {
            initializeScanner();
          }, 800);
        } else if (isSafari) {
          // For iOS Safari browser
          setTimeout(() => {
            initializeScanner();
          }, 500);
        } else {
          // Other iOS browsers
          initializeScanner();
        }
      } else {
        // Non-iOS devices
        initializeScanner();
      }
    } catch (permissionErr) {
      console.error("Permission error:", permissionErr);
      
      if (isIOS && !iOSPermissionRetry) {
        // iOS-specific retry
        setIOSPermissionRetry(true);
        setError("Camera access issue. Please try again and allow camera access when prompted.");
        setLoading(false);
      } else {
        setError("Camera access was denied. Please check your browser settings and ensure camera permissions are enabled.");
        setLoading(false);
      }
    }
  };

  // Initialize scanner with platform-specific optimizations
  const initializeScanner = async () => {
    if (isTransitioning.current) {
      console.warn("Scanner is already transitioning.");
      return;
    }
    
    const scannerId = "qr-code-scanner";
    isTransitioning.current = true;
    setLoading(true);
    
    try {
      // Create scanner instance if it doesn't exist
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }
      
      // Camera configurations based on platform
      let cameraConfig;
      
      if (isIOS) {
        // For iOS, always use facingMode with specific settings
        cameraConfig = { 
          facingMode: "environment"
        };
        console.log("Using environment facing mode for iOS");
      } else {
        try {
          // Get available cameras for non-iOS devices
          console.log("Getting available cameras...");
          const devices = await Html5Qrcode.getCameras();
          
          if (devices.length === 0) {
            throw new Error("No cameras found on your device.");
          }
          
          console.log(`Found ${devices.length} cameras:`, devices.map(d => d.label));
          
          // Try to find back camera by label
          const backCamera = devices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('environment')
          );
          const preferredDevice = backCamera || devices[0];
          console.log("Using camera:", preferredDevice.label);
          cameraConfig = { deviceId: preferredDevice.id };
        } catch (cameraErr) {
          console.warn("Camera enumeration failed, using facingMode instead:", cameraErr);
          cameraConfig = { facingMode: "environment" };
        }
      }
      
      // Scanner configuration with platform-specific settings
      const scannerConfig = {
        fps: isiOSPWA ? 1 : (isIOS ? 2 : 10), // Extremely low fps on iOS PWA
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: isIOS,
        rememberLastUsedCamera: !isIOS,
        showTorchButtonIfSupported: false,
        formatsToSupport: undefined,
      };
      
      console.log("Starting scanner with config:", { 
        isIOS, 
        isSafari,
        isPWA,
        scannerConfig,
        cameraConfig
      });
      
      // Start scanner with specified config
      await scannerRef.current.start(
        cameraConfig,
        scannerConfig,
        validateQRCode,
        (scanError) => console.warn("Scanning error:", scanError)
      );
      
      // Apply video element styling with proper delay
      setTimeout(() => {
        try {
          const videoElement = document.querySelector(`#${scannerId} video`) as HTMLVideoElement;
          if (videoElement) {
            // Style optimizations based on platform
            if (isIOS) {
              // iOS-specific video styling
              Object.assign(videoElement.style, {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "12px",
                transform: isiOSPWA ? "none" : "scaleX(-1)", // Only flip in browser mode
                maxWidth: "100vw",
                maxHeight: "calc(100vh - 250px)"
              });
              
              // Critical video attributes for iOS
              videoElement.setAttribute("playsinline", "true");
              videoElement.setAttribute("autoplay", "true");
              videoElement.setAttribute("muted", "true");
              
              // Force play for iOS PWA
              if (isiOSPWA) {
                videoElement.play().catch(e => console.warn("Could not autoplay video:", e));
              }
            } else {
              // Standard styling for other devices
              Object.assign(videoElement.style, {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "12px"
              });
            }
            console.log("Video element styled successfully");
          } else {
            console.warn("Video element not found for styling");
            // Additional attempt to find video elements
            const allVideos = document.querySelectorAll('video');
            console.log(`Found ${allVideos.length} videos on page`);
            if (allVideos.length > 0) {
              allVideos.forEach(video => {
                Object.assign(video.style, {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "12px"
                });
                video.setAttribute("playsinline", "true");
                video.setAttribute("autoplay", "true");
                video.setAttribute("muted", "true");
              });
            }
          }
        } catch (styleErr) {
          console.warn("Could not style video element:", styleErr);
        }
      }, isiOSPWA ? 1500 : (isIOS ? 1000 : 500)); // Longer delay for iOS PWA
      
      setCameraStarted(true);
    } catch (err) {
      console.error("Error initializing scanner:", err);
      
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError("Camera access was denied. Please allow camera access in your device settings.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found on this device.");
        } else if (err.name === 'NotReadableError') {
          setError("The camera is in use by another application. Please close other apps using the camera.");
        } else if (err.name === 'OverconstrainedError') {
          setError("Camera constraints are not supported on this device. Please try again with a different device.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to access camera");
      }
      
      // iOS-specific error handling
      if (isIOS) {
        if (isPWA) {
          setError("Camera access is limited in Home Screen mode. Please check your camera permissions in iOS settings.");
        } else {
          setError("Camera access failed on your iOS device. Try refreshing the page.");
        }
      }
    } finally {
      isTransitioning.current = false;
      setLoading(false);
    }
  };

  // Cleanup function for scanner
  const cleanupScanner = () => {
    console.log("Cleaning up scanner");
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
    } else if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        console.log("Scanner cleared successfully.");
      } catch (err: unknown) {
        console.warn("Failed to clear scanner:", err);
      } finally {
        scannerRef.current = null;
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanupScanner;
  }, []);

  const handleBackClick = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current
        .stop()
        .then(() => navigate("/usermainpage"))
        .catch((err) => {
          console.warn("Error stopping scanner before navigation:", err);
          navigate("/usermainpage");
        });
    } else {
      navigate("/usermainpage");
    }
  };

  // Reload page function
  const handleReloadPage = () => {
    window.location.reload();
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
        
        {/* Permission dialog */}
        <Dialog
          open={permissionDialog}
          onClose={() => {
            setPermissionDialog(false);
            handleBackClick();
          }}
        >
          <DialogTitle>Camera Permission Required</DialogTitle>
          <DialogContent>
            <DialogContentText>
              QueueEase needs to access your camera to scan QR codes. 
              This allows you to quickly check in at services.
              {isIOS && (
                <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                  On iOS devices, you'll need to allow camera access when prompted by your browser.
                </Box>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setPermissionDialog(false);
                handleBackClick();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={requestCameraPermission} 
              variant="contained" 
              color="primary"
              autoFocus
            >
              Allow Camera Access
            </Button>
          </DialogActions>
        </Dialog>
        
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
          
          {!permissionAsked ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <QrCodeScannerIcon 
                sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} 
              />
              <Typography variant="body1" gutterBottom>
                Waiting for camera permission...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please allow camera access when prompted
              </Typography>
            </Box>
          ) : (
            <Box
              id="qr-code-scanner"
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative'
              }}
            />
          )}
          
          {cameraStarted && (
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
          )}
          
          <Fade in={cameraStarted && !loading && !error}>
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
        
        {/* Retry buttons if camera fails */}
        {error && !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => {
                setError(null);
                requestCameraPermission();
              }}
              startIcon={<QrCodeScannerIcon />}
              sx={{ borderRadius: 2 }}
            >
              Try Again
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleReloadPage}
              sx={{ borderRadius: 2 }}
            >
              Reload Page
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default QRScanner;