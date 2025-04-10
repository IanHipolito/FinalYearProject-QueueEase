import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, TextField, Button, Card, CardContent, Switch,
  FormControlLabel, Divider, Chip, CircularProgress, Alert, Snackbar
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TimerIcon from '@mui/icons-material/Timer';
import SaveIcon from '@mui/icons-material/Save';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import { useAuthGuard } from '../hooks/useAuthGuard';

const NotificationsPage: React.FC = () => {
  const { authenticated, loading: authLoading } = useAuthGuard({});
  
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
    if (!authenticated || !currentService?.id) return;
    
    setLoading(true);
    try {
      const data = await API.admin.getNotificationSettings(currentService.id);
      
      // Update state with fetched settings
      setFrequency(data.frequency_minutes || 5);
      setMessageTemplate(data.template_message || '');
      setEnabled(data.enabled === undefined ? true : data.enabled);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setAlert({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to load notification settings',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [currentService?.id, authenticated]);

  // Load notification settings on component mount
  useEffect(() => {
    if (!authenticated) return;
    loadSettings();
  }, [loadSettings, authenticated]);

  // Placeholder variables for message template
  const sampleVariables = [
    { name: '{{customer_name}}', description: 'Customer\'s name' },
    { name: '{{queue_position}}', description: 'Current position in queue' },
    { name: '{{expected_wait}}', description: 'Expected wait time' },
    { name: '{{service_name}}', description: 'Name of the service' }
  ];

  // Handle frequency change
  const handleFrequencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (value > 0) {
      setFrequency(value);
    }
  };

  // Toggle enabled state
  const handleToggleEnabled = () => {
    setEnabled(!enabled);
  };

  // Handle template message change
  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageTemplate(event.target.value);
  };

  // Insert variable into message template
  const insertVariable = (variable: string) => {
    setMessageTemplate(prev => {
      // Get cursor position or end of message
      const cursorPosition = document.activeElement === document.getElementById('message-template')
        ? (document.activeElement as HTMLInputElement).selectionStart || prev.length
        : prev.length;
      
      // Insert variable at cursor position
      return prev.substring(0, cursorPosition) + variable + prev.substring(cursorPosition);
    });
  };

  // Handle save notification settings
  const handleSaveSettings = async () => {
    if (!authenticated || !currentService?.id) {
      setAlert({
        open: true,
        message: 'Authentication required to save settings',
        severity: 'error'
      });
      return;
    }
    
    setSaveLoading(true);
    try {
      await API.admin.updateNotificationSettings({
        service_id: currentService.id,
        frequency_minutes: frequency,
        template_message: messageTemplate,
        enabled: enabled
      });
      
      setAlert({
        open: true,
        message: 'Notification settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setAlert({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save notification settings',
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle close alert
  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  // Show loading state during auth check
  if (authLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Loading notification settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Notification Settings
      </Typography>
      
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <NotificationsIcon sx={{ mr: 1, color: '#6f42c1' }} />
            <Typography variant="h6" fontWeight="500">
              Queue Notifications
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={enabled} 
                      onChange={handleToggleEnabled} 
                      color="primary"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#6f42c1',
                          '&:hover': {
                            backgroundColor: 'rgba(111, 66, 193, 0.08)',
                          },
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#6f42c1',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography fontWeight="500">
                      {enabled ? 'Notifications Enabled' : 'Notifications Disabled'}
                    </Typography>
                  }
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body1" fontWeight="500" gutterBottom>
                    Notification Frequency
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    How often to send position updates to waiting customers
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                  <TimerIcon sx={{ color: 'text.secondary', mr: 1, my: 0.5 }} />
                  <TextField
                    id="frequency-input"
                    label="Minutes between notifications"
                    type="number"
                    variant="outlined"
                    value={frequency}
                    onChange={handleFrequencyChange}
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'rgba(111, 66, 193, 0.08)', borderRadius: 2, height: '100%', display: 'flex', alignItems: 'center' }}>
                  <InfoOutlinedIcon sx={{ mr: 2, color: '#6f42c1' }} />
                  <Typography variant="body2">
                    Shorter intervals will keep customers better informed but may increase server load and notification fatigue.
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body1" fontWeight="500" gutterBottom>
                  Message Template
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Customize the notification message sent to customers
                </Typography>
                
                <TextField
                  id="message-template"
                  multiline
                  rows={4}
                  value={messageTemplate}
                  onChange={handleMessageChange}
                  fullWidth
                  variant="outlined"
                  placeholder="Hello {{customer_name}}, your current position is {{queue_position}}. Estimated waiting time: {{expected_wait}} minutes."
                  sx={{ 
                    mt: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Available variables:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {sampleVariables.map((variable) => (
                      <Chip
                        key={variable.name}
                        label={variable.name}
                        onClick={() => insertVariable(variable.name)}
                        title={variable.description}
                        sx={{
                          backgroundColor: 'rgba(111, 66, 193, 0.1)',
                          color: '#6f42c1',
                          '&:hover': {
                            backgroundColor: 'rgba(111, 66, 193, 0.2)',
                          },
                          fontFamily: 'monospace'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(25, 118, 210, 0.08)', 
                  borderRadius: 2, 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'flex-start' 
                }}>
                  <InfoOutlinedIcon sx={{ mr: 2, mt: 0.5, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="body2">
                      <strong>Preview:</strong> Here's how your message will look with sample data:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 1, 
                        p: 1.5, 
                        bgcolor: 'white', 
                        borderRadius: 1,
                        border: '1px dashed rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {messageTemplate
                        .replace('{{customer_name}}', 'John Doe')
                        .replace('{{queue_position}}', '3')
                        .replace('{{expected_wait}}', '12')
                        .replace('{{service_name}}', currentService?.name || 'Our Service')
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSaveSettings}
                    disabled={saveLoading}
                    sx={{ 
                      borderRadius: 2, 
                      bgcolor: '#6f42c1',
                      '&:hover': {
                        bgcolor: '#8551d9',
                      },
                      px: 3
                    }}
                  >
                    {saveLoading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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