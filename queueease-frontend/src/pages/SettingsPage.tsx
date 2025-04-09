import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, TextField, Button, Card, CardContent,
  Divider, InputAdornment, Avatar, CircularProgress, Snackbar, Alert, IconButton
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
import { useAuth } from 'context/AuthContext';
import { API } from 'services/api';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<{company: boolean, password: boolean}>({company: false, password: false});
  const [alert, setAlert] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Company data state
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: null as File | null,
    logoPreview: '',
    logoBase64: '',
    latitude: '',
    longitude: ''
  });
  
  // Credentials for password change
  const [credentials, setCredentials] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Fetch company data when component mounts
    if (user) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      setLoading(prev => ({...prev, company: true}));
      
      // Check if user exists and has an id
      if (!user?.id) {
        showAlert('User information is missing', 'error');
        return;
      }
      
      const data = await API.admin.getCompanyInfo(user.id);
      console.log("Fetched company data:", data);
      
      setCompanyData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        logo: null,
        logoPreview: data.logo_base64 || '',
        logoBase64: '',
        latitude: data.latitude?.toString() || '',
        longitude: data.longitude?.toString() || ''
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
      showAlert(error instanceof Error ? error.message : 'Error fetching company information', 'error');
    } finally {
      setLoading(prev => ({...prev, company: false}));
    }
  };

  const handleCredentialsChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [field]: e.target.value });
  };
  
  const handleCompanyDataChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyData({ ...companyData, [field]: e.target.value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setCompanyData({
          ...companyData,
          logo: null,
          logoPreview: base64String,
          logoBase64: base64String
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = async () => {
    try {
      setLoading(prev => ({...prev, company: true}));
      
      // Check if user exists and has an id
      if (!user?.id) {
        showAlert('User information is missing', 'error');
        return;
      }
      
      // Create a FormData object to handle the file upload
      const formData = new FormData();
      formData.append('name', companyData.name);
      formData.append('email', companyData.email);
      formData.append('phone', companyData.phone);
      formData.append('address', companyData.address);
      formData.append('latitude', companyData.latitude);
      formData.append('longitude', companyData.longitude);
      formData.append('user_id', user.id.toString());
      
      // If user has base64 logo include it
      if (companyData.logoBase64) {
        formData.append('logoBase64', companyData.logoBase64);
      }
      
      const responseData = await API.admin.updateCompanyInfo(formData);
      console.log("Save response:", responseData);
      
      // Update the local state with the returned data to confirm changes
      if (responseData.data) {
        setCompanyData(prev => ({
          ...prev,
          name: responseData.data.name || prev.name,
          email: responseData.data.email || prev.email,
          phone: responseData.data.phone || prev.phone,
          address: responseData.data.address || prev.address,
          latitude: responseData.data.latitude?.toString() || prev.latitude,
          longitude: responseData.data.longitude?.toString() || prev.longitude,
          logoPreview: responseData.data.logo_base64 || prev.logoPreview
        }));
      }
      
      // Refresh data completely
      await fetchCompanyData();
      showAlert('Company information updated successfully', 'success');
    } catch (error) {
      console.error('Error saving company information:', error);
      showAlert(error instanceof Error ? error.message : 'Failed to update company information', 'error');
    } finally {
      setLoading(prev => ({...prev, company: false}));
    }
  };
  
  const handleSaveSecurity = async () => {
    // Validate passwords
    if (credentials.newPassword !== credentials.confirmPassword) {
      showAlert('New passwords do not match', 'error');
      return;
    }
    
    if (!credentials.currentPassword || !credentials.newPassword) {
      showAlert('All password fields are required', 'error');
      return;
    }
    
    try {
      setLoading(prev => ({...prev, password: true}));
      
      await API.admin.changePassword({
        user_id: user?.id,
        current_password: credentials.currentPassword,
        new_password: credentials.newPassword
      });
      
      // Clear password fields
      setCredentials({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      showAlert('Password updated successfully', 'success');
    } catch (error) {
      console.error('Error updating password:', error);
      showAlert(error instanceof Error ? error.message : 'Failed to update password', 'error');
    } finally {
      setLoading(prev => ({...prev, password: false}));
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({
      open: true,
      message,
      severity
    });
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({...prev, open: false}));
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Settings
      </Typography>

      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>

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
                src={companyData.logoPreview}
                alt={companyData.name}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mb: 2,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              >
                {!companyData.logoPreview && companyData.name.charAt(0)}
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
                <input type="file" hidden onChange={handleLogoChange} accept="image/*" />
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

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Latitude"
                    value={companyData.latitude}
                    onChange={handleCompanyDataChange('latitude')}
                    fullWidth
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
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Longitude"
                    value={companyData.longitude}
                    onChange={handleCompanyDataChange('longitude')}
                    fullWidth
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
              startIcon={loading.company ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveCompany}
              disabled={loading.company}
              sx={{ 
                borderRadius: 2, 
                bgcolor: '#6f42c1', 
                px: 4,
                '&:hover': { 
                  bgcolor: '#8551d9' 
                }
              }}
            >
              {loading.company ? 'Saving...' : 'Save Changes'}
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
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  variant="contained" 
                  startIcon={loading.password ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveSecurity}
                  disabled={loading.password}
                  sx={{ 
                    borderRadius: 2, 
                    bgcolor: '#6f42c1', 
                    px: 4,
                    '&:hover': { 
                      bgcolor: '#8551d9' 
                    }
                  }}
                >
                  {loading.password ? 'Updating...' : 'Update Password'}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                Account Security
              </Typography>
              
              <Box sx={{ mt: 2, bgcolor: 'background.paper', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" paragraph>
                  Your account security is important to us. Make sure to:
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Use a strong, unique password
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Change your password regularly
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Keep your contact information up to date
                </Typography>
                
                <Typography variant="body2">
                  • Never share your account credentials with others
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;