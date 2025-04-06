import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AppBar, Box, Button, Container, Menu, MenuItem, Toolbar, Typography, useMediaQuery, IconButton, useTheme
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Login dropdown menu state
  const [loginAnchorEl, setLoginAnchorEl] = useState<null | HTMLElement>(null);
  const loginMenuOpen = Boolean(loginAnchorEl);
  
  // Mobile menu state
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const mobileMenuOpen = Boolean(mobileMenuAnchorEl);

  const handleLoginMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setLoginAnchorEl(event.currentTarget);
  };

  const handleLoginMenuClose = () => {
    setLoginAnchorEl(null);
  };

  const handleMobileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const redirectToLogin = (userType: 'user' | 'admin') => {
    handleLoginMenuClose();
    handleMobileMenuClose();
    if (userType === 'admin') {
      navigate('/admin-login');
    } else {
      navigate('/login');
    }
  };

  const navigateToSignUp = () => {
    handleMobileMenuClose();
    navigate('/signup');
  };

  // Desktop navigation buttons
  const desktopNavButtons = (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button 
        variant="contained"
        startIcon={<LoginIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={handleLoginMenuClick}
        aria-controls={loginMenuOpen ? "login-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={loginMenuOpen ? "true" : undefined}
        sx={{ 
          bgcolor: '#6f42c1', 
          '&:hover': { bgcolor: '#8551d9' },
          borderRadius: 2,
          mr: 2
        }}
      >
        Login
      </Button>
      <Button 
        variant="outlined"
        startIcon={<PersonAddIcon />}
        onClick={() => navigate('/signup')}
        sx={{ 
          borderColor: '#6f42c1',
          color: '#6f42c1',
          '&:hover': { borderColor: '#8551d9', bgcolor: 'rgba(111, 66, 193, 0.04)' },
          borderRadius: 2
        }}
      >
        Sign Up
      </Button>
    </Box>
  );

  // Mobile hamburger menu
  const mobileNavMenu = (
    <>
      <IconButton
        size="large"
        edge="end"
        color="inherit"
        aria-label="menu"
        onClick={handleMobileMenuClick}
        sx={{ color: '#6f42c1' }}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="mobile-menu"
        anchorEl={mobileMenuAnchorEl}
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        PaperProps={{
          sx: { width: '200px', mt: 1 }
        }}
      >
        <MenuItem onClick={() => redirectToLogin('user')}>
          <LoginIcon sx={{ mr: 1 }} />
          User Login
        </MenuItem>
        <MenuItem onClick={() => redirectToLogin('admin')}>
          <AdminPanelSettingsIcon sx={{ mr: 1 }} />
          Admin Login
        </MenuItem>
        <MenuItem onClick={navigateToSignUp}>
          <PersonAddIcon sx={{ mr: 1 }} />
          Sign Up
        </MenuItem>
      </Menu>
    </>
  );

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ backgroundColor: '#fff' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#6f42c1',
              display: 'flex',
              alignItems: 'center',
              fontSize: isMobile ? '1.75rem' : '2rem'
            }}
          >
            QueueEase
          </Typography>
          
          {/* Display either desktop nav buttons or mobile menu based on screen size */}
          {isMobile ? mobileNavMenu : desktopNavButtons}
          
          {/* Login dropdown menu */}
          <Menu
            id="login-menu"
            anchorEl={loginAnchorEl}
            open={loginMenuOpen}
            onClose={handleLoginMenuClose}
            MenuListProps={{
              'aria-labelledby': 'login-button',
            }}
          >
            <MenuItem onClick={() => redirectToLogin('user')}>
              <PersonAddIcon sx={{ mr: 1 }} />
              User Login
            </MenuItem>
            <MenuItem onClick={() => redirectToLogin('admin')}>
              <AdminPanelSettingsIcon sx={{ mr: 1 }} />
              Admin Login
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;