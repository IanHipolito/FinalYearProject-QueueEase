import React from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Badge,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import QueueIcon from '@mui/icons-material/Queue';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import TextsmsIcon from '@mui/icons-material/Textsms';
import FolderIcon from '@mui/icons-material/Folder';
import FormatTextdirectionLToRIcon from '@mui/icons-material/FormatTextdirectionLToR';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import OpacityIcon from '@mui/icons-material/Opacity';
import ExtensionIcon from '@mui/icons-material/Extension';
import DescriptionIcon from '@mui/icons-material/Description';
import HelpIcon from '@mui/icons-material/Help';
import { Link } from 'react-router-dom';

const drawerWidth = 260;

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f7fb' }}>
      <CssBaseline />
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: 'white',
          color: '#333',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: '50%',
            position: 'relative',
            bgcolor: '#f5f7fb',
            borderRadius: 10,
            px: 2
          }}>
            <SearchIcon sx={{ color: '#9e9e9e', mr: 1 }} />
            <input
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                padding: '10px',
                background: 'transparent',
                fontSize: '14px'
              }}
              placeholder="Search..."
            />
            <Box sx={{ 
              position: 'absolute', 
              right: 10, 
              bgcolor: '#ededfd', 
              p: 0.5, 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MenuIcon fontSize="small" sx={{ color: '#6f42c1' }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Avatar 
              sx={{ ml: 2, width: 40, height: 40 }} 
              alt="User" 
              src="/api/placeholder/50/50" 
            />
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: 'white',
            color: '#333',
            boxShadow: '1px 0 5px rgba(0,0,0,0.05)',
            border: 'none',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="img"
            src="/api/placeholder/32/32"
            alt="Logo"
            sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#6f42c1' }}
          />
          <Typography variant="h6" fontWeight="bold">
            QueueEase
          </Typography>
        </Box>
        
        <IconButton 
          sx={{ 
            position: 'absolute', 
            top: 16, 
            right: 10, 
            color: '#9e9e9e'
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Divider sx={{ mt: 1, mb: 2 }} />
        
        <Typography variant="subtitle2" sx={{ px: 3, py: 1, color: '#9e9e9e' }}>
          Dashboard
        </Typography>
        
        <List component="nav" sx={{ px: 2 }}>
          <ListItemButton
            component={Link}
            to="/admin/dashboard"
            sx={{ 
              borderRadius: 2, 
              mb: 0.5,
              bgcolor: '#ededfd',
              color: '#6f42c1',
              '&:hover': { bgcolor: '#e0e0ff' }
            }}
          >
            <ListItemIcon>
              <DashboardIcon sx={{ color: '#6f42c1' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Dashboard" 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
          
          <ListItemButton
            component={Link}
            to="/admin/customers"
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>
              <PeopleIcon sx={{ color: '#9e9e9e' }} />
            </ListItemIcon>
            <ListItemText primary="Customers" />
          </ListItemButton>
          
          <ListItemButton
            component={Link}
            to="/admin/queues"
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>
              <QueueIcon sx={{ color: '#9e9e9e' }} />
            </ListItemIcon>
            <ListItemText primary="Queues" />
          </ListItemButton>
          
          <ListItemButton
            component={Link}
            to="/admin/analytics"
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>
              <BarChartIcon sx={{ color: '#9e9e9e' }} />
            </ListItemIcon>
            <ListItemText primary="Analytics" />
          </ListItemButton>

          <ListItemButton
            component={Link}
            to="/admin/notifications"
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>
              <NotificationsIcon sx={{ color: '#9e9e9e' }} />
            </ListItemIcon>
            <ListItemText primary="Notifications" />
          </ListItemButton>

          <ListItemButton
            component={Link}
            to="/admin/settings"
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>
              <SettingsIcon sx={{ color: '#9e9e9e' }} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>

          <ListItemButton sx={{ borderRadius: 2, mb: 0.5 }}>
            <ListItemIcon>
              <LogoutIcon sx={{ color: '#9e9e9e' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>

        </List>
        
        
        <Divider sx={{ my: 2 }} />
      </Drawer>
      
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          mt: 8,
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;