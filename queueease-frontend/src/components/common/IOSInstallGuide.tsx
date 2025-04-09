import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HomeIcon from '@mui/icons-material/Home';

const IOSInstallGuide: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    // Check if this is iOS
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    
    // Only show for iOS users who haven't installed yet and haven't dismissed
    if (iOS && !standalone) {
      const hasShownGuide = localStorage.getItem('iosInstallGuideShown');
      if (!hasShownGuide) {
        // Wait a bit before showing
        const timer = setTimeout(() => setOpen(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);
  
  const handleClose = () => {
    setOpen(false);
    // Remember that we've shown this
    localStorage.setItem('iosInstallGuideShown', 'true');
  };
  
  // Don't render anything if not iOS or already installed
  if (!isIOS || isStandalone) return null;
  
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="ios-install-guide"
    >
      <Paper sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 400 },
        p: 3,
        borderRadius: 2
      }}>
        <IconButton
          sx={{ position: 'absolute', right: 8, top: 8 }}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Enable Notifications
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          To receive notifications, install QueueEase to your home screen:
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Step 1:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ShareIcon sx={{ mr: 1 }} />
            <Typography>Tap the Share icon in Safari</Typography>
          </Box>
          
          <Typography variant="subtitle1" fontWeight="bold">
            Step 2:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AddCircleOutlineIcon sx={{ mr: 1 }} />
            <Typography>Tap "Add to Home Screen"</Typography>
          </Box>
          
          <Typography variant="subtitle1" fontWeight="bold">
            Step 3:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ mr: 1 }} />
            <Typography>Open QueueEase from your home screen</Typography>
          </Box>
        </Box>
        
        <Button 
          variant="contained" 
          fullWidth 
          color="primary"
          onClick={handleClose}
          sx={{ mt: 2 }}
        >
          I'll do this later
        </Button>
      </Paper>
    </Modal>
  );
};

export default IOSInstallGuide;