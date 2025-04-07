import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, TextField, Button, Card, CardContent, Switch,
  FormControlLabel, Divider, IconButton, Chip, CircularProgress, Alert, Snackbar
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import TimerIcon from '@mui/icons-material/Timer';
import SaveIcon from '@mui/icons-material/Save';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';

const NotificationsPage: React.FC = () => {
  const { currentService } = useAuth();
  const [frequency, setFrequency] = useState<number>(5);
  const [messageTemplate, setMessageTemplate] = useState<string>('');
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Wrap loadSettings with useCallback to memoize it
  const loadSettings = useCallback(async () => {
    if (!currentService?.id) return;
    
    setLoading(true);
    try {
      const response = await API.admin.getNotificationSettings(currentService.id);
      if (response.ok) {
        const data = await response.json();
        setFrequency(data.frequency_minutes);
        setMessageTemplate(data.message_template);
        setEnabled(data.is_enabled);
      } else {
        // If settings don't exist yet, we'll use defaults
        setFrequency(5);
        setMessageTemplate("Your order is in queue. Position: {queue_position}, remaining time: {remaining_time} minutes.");
        setEnabled(true);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentService?.id]);

  // Add loadSettings to the useEffect dependencies
  useEffect(() => {
    if (currentService) {
      loadSettings();
    }
  }, [currentService, loadSettings]);

  const handleSave = async () => {
    if (!currentService?.id) return;
    
    setSaveLoading(true);
    try {
      const response = await API.admin.updateNotificationSettings({
        service_id: currentService.id,
        is_enabled: enabled,
        frequency_minutes: frequency,
        message_template: messageTemplate
      });
      
      if (response.ok) {
        setAlert({
          open: true,
          message: 'Notification settings saved successfully',
          severity: 'success'
        });
      } else {
        setAlert({
          open: true,
          message: 'Failed to save notification settings',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setAlert({
        open: true,
        message: 'An error occurred while saving settings',
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({...alert, open: false});
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Push Notifications
      </Typography>

      {/* Top Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Notifications Stats Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)',
            color: '#fff',
            overflow: 'visible',
            position: 'relative',
            height: '100%'
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
                  <NotificationsIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  {enabled ? 'Active' : 'Inactive'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Notification Status
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Frequency Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)',
            color: '#fff',
            height: '100%',
            position: 'relative',
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
                  <TimerIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  {frequency} min
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Notification Frequency
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Settings Card */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SettingsIcon sx={{ mr: 1, color: '#6f42c1' }} />
            <Typography variant="h6" fontWeight="500">
              Push Notification Configuration
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={enabled} 
                    onChange={(e) => setEnabled(e.target.checked)}
                    color="primary"
                    sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#6f42c1',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#8551d9',
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="subtitle1" fontWeight="500">
                    Enable Push Notifications
                  </Typography>
                }
                sx={{ mb: 3 }}
              />
              
              <TextField
                label="Notification Frequency (minutes)"
                type="number"
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value) || 0)}
                fullWidth
                variant="outlined"
                InputProps={{
                  endAdornment: <Box component="span" sx={{ color: 'text.secondary' }}>minutes</Box>,
                }}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              
              <Box sx={{ 
                bgcolor: '#e3f2fd', 
                p: 2, 
                borderRadius: 2, 
                display: 'flex',
                alignItems: 'flex-start',
                mb: 3
              }}>
                <InfoOutlinedIcon sx={{ color: '#2196f3', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Setting the frequency too low may lead to customers receiving too many notifications. 
                  We recommend a minimum of 5 minutes between notifications.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                Message Template
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Customize the notification message sent to customers. You can use the following variables:
              </Typography>
              
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label="{queue_position}" color="primary" size="small" />
                <Chip label="{remaining_time}" color="primary" size="small" />
                <Chip label="{queue_name}" color="primary" size="small" />
                <Chip label="{customer_name}" color="primary" size="small" />
              </Box>
              
              <TextField
                multiline
                rows={6}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="Enter your notification message template here..."
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Preview:
                </Typography>
                <Typography variant="body2">
                  {messageTemplate
                    .replace('{queue_position}', '3')
                    .replace('{remaining_time}', '12')
                    .replace('{queue_name}', 'General Service')
                    .replace('{customer_name}', 'John Doe')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saveLoading}
              sx={{ 
                borderRadius: 2, 
                bgcolor: '#6f42c1', 
                px: 4,
                '&:hover': { 
                  bgcolor: '#8551d9' 
                }
              }}
            >
              {saveLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationsPage;