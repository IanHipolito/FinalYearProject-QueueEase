import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from './AuthContext';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
  Link,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
  IconButton,
  InputAdornment
} from "@mui/material";
import { API } from '../services/api';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    keepSignedIn: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await API.auth.login(formData.email, formData.password);

      if (response.ok) {
        const data = await response.json();
        await login(data.email, formData.password);
        alert("Login successful!");
        navigate("/usermainpage");
        console.log("User data:", data);
      } else {
        const errorData = await response.json();
        alert(`Login failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
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
          padding: isMobile ? 2 : 0
        }}
      >
        <Container maxWidth="xs" disableGutters={isMobile}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: isMobile ? 2 : 4,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(111,66,193,0.15)',
              overflow: 'hidden'
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
                Welcome Back
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
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
                autoFocus
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                sx={{ mb: 1 }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleShowPassword}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mt: 0.5, 
                mb: 1,
                flexDirection: isMobile ? 'column' : 'row',
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      name="keepSignedIn"
                      checked={formData.keepSignedIn}
                      onChange={handleChange}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label={<Typography variant={isMobile ? "caption" : "body2"}>Keep me signed in</Typography>}
                  sx={{ mr: 0 }}
                />
                <Link 
                  component="button"
                  variant={isMobile ? "caption" : "body2"}
                  onClick={() => navigate("/forgot-password")}
                  underline="hover"
                  sx={{ mt: isMobile ? 0 : 'auto', alignSelf: isMobile ? 'flex-start' : 'center' }}
                >
                  Forgot Password
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ 
                  mt: 1, 
                  py: isMobile ? 0.8 : 1.2, 
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)',
                  boxShadow: '0 4px 14px rgba(111,66,193,0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5e35b1 0%, #7b46d3 100%)',
                    boxShadow: '0 6px 18px rgba(111,66,193,0.3)',
                  }
                }}
              >
                Login
              </Button>
              
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ my: 1.5 }}>
                  <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                    or
                  </Typography>
                </Divider>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => navigate("/signup")}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      borderRadius: 2,
                      py: isMobile ? 0.6 : 0.8,
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor: 'rgba(111,66,193,0.04)',
                      }
                    }}
                  >
                    Create an account
                  </Button>
                  
                  <Button 
                    variant="text" 
                    color="secondary" 
                    onClick={() => navigate("/main")}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      borderRadius: 2,
                      py: isMobile ? 0.6 : 0.8
                    }}
                  >
                    Continue as guest
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Login;