import React, { useState } from 'react';
import {
  Box, Grid, Typography, TextField, Button, Card, CardContent,
  Divider, IconButton, InputAdornment, Switch, FormControlLabel, Avatar
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const SettingsPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Example company data
  const [companyData, setCompanyData] = useState({
    name: 'QueueEase Inc.',
    email: 'contact@queueease.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business St, Tech City, CA 94043',
    logo: '/path/to/logo.png'
  });
  
  // Example user credentials
  const [credentials, setCredentials] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleCredentialsChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [field]: e.target.value });
  };
  
  const handleCompanyDataChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyData({ ...companyData, [field]: e.target.value });
  };

  const handleSaveCompany = () => {
    console.log('Saving company information:', companyData);
    //call API to save the company data
  };
  
  const handleSaveSecurity = () => {
    console.log('Saving security settings:', { credentials, twoFactorEnabled, emailNotifications });
    // call API to update security settings
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Settings
      </Typography>

      {/* Company Information Section */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <BusinessIcon sx={{ mr: 1, color: '#6f42c1' }} />
            <Typography variant="h6" fontWeight="500">
              Company Information
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 4 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                src={companyData.logo}
                alt={companyData.name}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mb: 2,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              >
                {!companyData.logo && companyData.name.charAt(0)}
              </Avatar>
              
              <Button 
                variant="outlined" 
                component="label" 
                startIcon={<CloudUploadIcon />}
                sx={{ 
                  borderRadius: 2,
                  borderColor: '#6f42c1',
                  color: '#6f42c1',
                  '&:hover': {
                    borderColor: '#8551d9',
                  }
                }}
              >
                Upload Logo
                <input type="file" hidden />
              </Button>
            </Grid>
            
            <Grid item xs={12} md={9}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Company Name"
                    value={companyData.name}
                    onChange={handleCompanyDataChange('name')}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircleIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email Address"
                    value={companyData.email}
                    onChange={handleCompanyDataChange('email')}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone Number"
                    value={companyData.phone}
                    onChange={handleCompanyDataChange('phone')}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Business Address"
                    value={companyData.address}
                    onChange={handleCompanyDataChange('address')}
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleSaveCompany}
              sx={{ 
                borderRadius: 2, 
                bgcolor: '#6f42c1', 
                px: 4,
                '&:hover': { 
                  bgcolor: '#8551d9' 
                }
              }}
            >
              Save Changes
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Login & Security Section */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SecurityIcon sx={{ mr: 1, color: '#6f42c1' }} />
            <Typography variant="h6" fontWeight="500">
              Login & Security
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 4 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                Change Password
              </Typography>
              
              <TextField
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.currentPassword}
                onChange={handleCredentialsChange('currentPassword')}
                fullWidth
                variant="outlined"
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              
              <TextField
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.newPassword}
                onChange={handleCredentialsChange('newPassword')}
                fullWidth
                variant="outlined"
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              
              <TextField
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.confirmPassword}
                onChange={handleCredentialsChange('confirmPassword')}
                fullWidth
                variant="outlined"
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                Security Settings
              </Typography>
              
              <Box sx={{ mt: 2, bgcolor: 'background.paper', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={twoFactorEnabled} 
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
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
                    <Box>
                      <Typography variant="subtitle2" fontWeight="500">
                        Two-Factor Authentication
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Enhance your account security with 2FA
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}
                />
                
                <Divider sx={{ my: 2 }} />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={emailNotifications} 
                      onChange={(e) => setEmailNotifications(e.target.checked)}
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
                    <Box>
                      <Typography variant="subtitle2" fontWeight="500">
                        Security Notifications
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Receive email alerts for suspicious activity
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', alignItems: 'flex-start' }}
                />
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleSaveSecurity}
              sx={{ 
                borderRadius: 2, 
                bgcolor: '#6f42c1', 
                px: 4,
                '&:hover': { 
                  bgcolor: '#8551d9' 
                }
              }}
            >
              Update Security Settings
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;