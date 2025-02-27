import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  FormHelperText
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import TimerIcon from '@mui/icons-material/Timer';
import MessageIcon from '@mui/icons-material/Message';
import SaveIcon from '@mui/icons-material/Save';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const NotificationsPage: React.FC = () => {
  const [frequency, setFrequency] = useState<number>(5);
  const [messageTemplate, setMessageTemplate] = useState<string>('');
  const [enabled, setEnabled] = useState<boolean>(true);
  const [notificationType, setNotificationType] = useState<string>('sms');

  // Optionally, fetch current settings from your backend on mount:
  useEffect(() => {
    // fetch('/api/notification-settings')...
    // For demo, we'll use default values.
    setFrequency(5);
    setMessageTemplate("Your order is in queue. Position: {queue_position}, remaining time: {remaining_time} minutes.");
    setEnabled(true);
  }, []);

  const handleSave = () => {
    // Save the settings via your backend API
    console.log({ frequency, messageTemplate, enabled, notificationType });
    // Example:
    // fetch('/api/notification-settings', { method: 'POST', body: JSON.stringify({frequency, messageTemplate, enabled}), headers: { 'Content-Type': 'application/json' } })
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Notifications
      </Typography>

      {/* Top Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Notifications Stats Card */}
        <Grid item xs={12} md={4}>
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
        <Grid item xs={12} md={4}>
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

        {/* Message Type Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #198754 0%, #28a745 100%)',
            color: '#fff',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
                  <MessageIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                  {notificationType}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Notification Type
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
              Notification Configuration
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
                    Enable Notifications
                  </Typography>
                }
                sx={{ mb: 3 }}
              />
              
              <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                <InputLabel id="notification-type-label">Notification Type</InputLabel>
                <Select
                  labelId="notification-type-label"
                  id="notification-type"
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  label="Notification Type"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="sms">SMS</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="push">Push Notification</MenuItem>
                </Select>
                <FormHelperText>Select how customers will receive notifications</FormHelperText>
              </FormControl>
              
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
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{ 
                borderRadius: 2, 
                bgcolor: '#6f42c1', 
                px: 4,
                '&:hover': { 
                  bgcolor: '#8551d9' 
                }
              }}
            >
              Save Settings
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationsPage;