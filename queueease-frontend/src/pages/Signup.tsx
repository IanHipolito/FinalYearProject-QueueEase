import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Container, Paper, TextField,
  Typography, ThemeProvider, createTheme, CssBaseline,
  useMediaQuery, FormControl, Select, MenuItem, InputAdornment,
  Snackbar, Alert
} from "@mui/material";
import { API } from '../services/api';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

// Get all countries and their codes
const allCountries = getCountries().map(country => ({
  code: `+${getCountryCallingCode(country)}`,
  country: new Intl.DisplayNames(['en'], { type: 'region' }).of(country) || country,
  iso: country
})).sort((a, b) => a.country.localeCompare(b.country));

const theme = createTheme({
  palette: {
    primary: {
      main: '#6f42c1',
      light: '#8551d9',
      dark: '#5e35b1'
    },
    secondary: {
      main: '#4caf50',
    },
    background: {
      default: '#f5f5f5'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 8
  }
});

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const irelandCode = allCountries.find(c => c.iso === 'IE')?.code || "+353";
  
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    countryCode: irelandCode,
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors = {
      email: "",
      name: "",
      phoneNumber: "",
      password: "",
      confirmPassword: ""
    };
    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email) && formData.email) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (formData.name && formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
      valid = false;
    }

    const phoneRegex = /^[0-9]{7,12}$/;
    if (!phoneRegex.test(formData.phoneNumber) && formData.phoneNumber) {
      newErrors.phoneNumber = "Please enter a valid phone number (7-12 digits)";
      valid = false;
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
      valid = false;
    }

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid && 
      formData.email !== "" && 
      formData.name !== "" && 
      formData.phoneNumber !== "" && 
      formData.password !== "" &&
      formData.confirmPassword !== ""
    );
  }, [formData]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    validateForm();
    
    if (!isFormValid) {
      return;
    }

    setLoading(true);
    const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;

    const { confirmPassword, countryCode, phoneNumber, ...otherData } = formData;
    const dataToSend = {
      ...otherData,
      phoneNumber: fullPhoneNumber
    };

    try {
      await API.auth.signup(dataToSend);
      
      setSnackbar({
        open: true,
        message: 'Signup successful!',
        severity: 'success'
      });
      
      // Navigate after a short delay to allow the user to see the success message
      setTimeout(() => {
        navigate("/usermainpage");
      }, 1000);
    } catch (error) {
      console.error("Error during signup:", error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "An unknown error occurred during signup.",
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e: any) => {
    setFormData({ ...formData, countryCode: e.target.value });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(111,66,193,0.1) 0%, rgba(133,81,217,0.05) 100%)',
          padding: isMobile ? 2 : 0,
          overflowY: 'auto'
        }}
      >
        <Container maxWidth="xs" disableGutters={isMobile}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: isMobile ? 2 : 4,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(111,66,193,0.15)',
              overflow: 'hidden',
              my: 2
            }}
          >
            <Box sx={{ textAlign: 'center', mb: isMobile ? 2 : 3 }}>
              <Typography 
                variant={isMobile ? "h4" : "h3"} 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  background: 'linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                QueueEase
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ mt: 0.5, color: 'text.secondary' }}>
                Create an account
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="dense"
                required
                fullWidth
                id="name"
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: errors.name ? 0 : 1 }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                error={!!errors.email}
                helperText={errors.email}
                sx={{ mb: errors.email ? 0 : 1 }}
              />
              
              {/* Phone number with dynamic country code selector */}
              <TextField
                margin="dense"
                required
                fullWidth
                id="phoneNumber"
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                autoComplete="tel-national"
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FormControl variant="outlined" size="small">
                        <Select
                          value={formData.countryCode}
                          onChange={handleSelectChange}
                          sx={{ minWidth: 80 }}
                        >
                          {allCountries.map((country) => (
                            <MenuItem key={country.iso} value={country.code}>
                              {country.code}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="dense"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mb: errors.password ? 0 : 1 }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{ mb: errors.confirmPassword ? 0 : 2 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={!isFormValid || loading}
                sx={{ 
                  mt: 1, 
                  py: isMobile ? 0.8 : 1.2, 
                  borderRadius: 2,
                  background: isFormValid ? 'linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)' : 'linear-gradient(135deg, #9e9e9e, #bdbdbd)',
                  boxShadow: '0 4px 14px rgba(111,66,193,0.25)',
                  '&:hover': {
                    background: isFormValid ? 'linear-gradient(135deg, #5e35b1 0%, #7b46d3 100%)' : 'linear-gradient(135deg, #9e9e9e, #bdbdbd)',
                    boxShadow: '0 6px 18px rgba(111,66,193,0.3)',
                  }
                }}
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </Button>

              <Box sx={{ mt: 2 }}>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                    Already have an account?{" "}
                    <Typography
                      component="span"
                      variant={isMobile ? "caption" : "body2"}
                      color="primary"
                      sx={{ 
                        cursor: 'pointer', 
                        fontWeight: 'medium',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => navigate('/login')}
                    >
                      Login
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Add Snackbar component */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default Signup;