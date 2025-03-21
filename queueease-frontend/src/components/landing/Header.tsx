import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Menu,
  MenuItem,
  Toolbar,
  Typography
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleLoginMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLoginMenuClose = () => {
    setAnchorEl(null);
  };

  const redirectToLogin = (userType: 'user' | 'admin') => {
    handleLoginMenuClose();
    if (userType === 'admin') {
      navigate('/admin-login');
    } else {
      navigate('/login');
    }
  };

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
              alignItems: 'center'
            }}
          >
            QueueEase
          </Typography>
          <Box>
            <Button 
              variant="contained"
              startIcon={<LoginIcon />}
              endIcon={<KeyboardArrowDownIcon />}
              onClick={handleLoginMenuClick}
              aria-controls={open ? "login-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              sx={{ 
                bgcolor: '#6f42c1', 
                '&:hover': { bgcolor: '#8551d9' },
                borderRadius: 2,
                mr: 2
              }}
            >
              Login
            </Button>
            <Menu
              id="login-menu"
              anchorEl={anchorEl}
              open={open}
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
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;