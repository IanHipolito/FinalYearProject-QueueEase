import React, { useState } from 'react';
import { useAuth } from '../pages/AuthContext';
import { useNavigate, Link, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Box, CssBaseline, AppBar, Toolbar, Typography, 
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, 
  IconButton, Avatar, Divider, FormControl, InputLabel, 
  Select, MenuItem, SelectChangeEvent,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import QueueIcon from '@mui/icons-material/Queue';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardPage from '../pages/DashboardPage';
import CustomersPage from '../pages/CustomersPage';
import QueuesPage from '../pages/QueuesPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';

const drawerWidth = 260;

const AdminLayout: React.FC = () => {
  const { user, logout, managedServices, currentService, setCurrentService } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Handle service change
  const handleServiceChange = (event: SelectChangeEvent) => {
    const serviceId = parseInt(event.target.value);
    const selected = managedServices.find((s) => s.id === serviceId);
    if (selected) {
      setCurrentService(selected);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  if (!user || !user.is_admin) {
    return <Navigate to="/admin-login" />;
  }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          component="img"
          src="/static/images/logo.png"
          alt="Logo"
          sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#6f42c1' }}
        />
        <Typography variant="h6" fontWeight="bold">
          QueueEase
        </Typography>
      </Box>
      
      <Divider sx={{ mt: 1, mb: 2 }} />
      
      {/* Service Selection Dropdown */}
      {managedServices && managedServices.length > 0 && (
        <Box sx={{ px: 2, mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="service-select-label">Managing Service</InputLabel>
            <Select
              labelId="service-select-label"
              id="service-select"
              value={currentService?.id?.toString() || ''}
              label="Managing Service"
              onChange={handleServiceChange}
            >
              {managedServices.map((service) => (
                <MenuItem key={service.id} value={service.id.toString()}>
                  {service.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      
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
            bgcolor: window.location.pathname === '/admin/dashboard' ? '#ededfd' : 'transparent',
            color: window.location.pathname === '/admin/dashboard' ? '#6f42c1' : 'inherit',
            '&:hover': { bgcolor: '#e0e0ff' }
          }}
        >
          <ListItemIcon>
            <DashboardIcon sx={{ color: window.location.pathname === '/admin/dashboard' ? '#6f42c1' : '#9e9e9e' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Dashboard" 
            primaryTypographyProps={{ 
              fontWeight: window.location.pathname === '/admin/dashboard' ? 500 : 400 
            }}
          />
        </ListItemButton>
        
        <ListItemButton
          component={Link}
          to="/admin/customers"
          sx={{ 
            borderRadius: 2, 
            mb: 0.5,
            bgcolor: window.location.pathname === '/admin/customers' ? '#ededfd' : 'transparent',
            color: window.location.pathname === '/admin/customers' ? '#6f42c1' : 'inherit',
            '&:hover': { bgcolor: '#e0e0ff' }
          }}
        >
          <ListItemIcon>
            <PeopleIcon sx={{ color: window.location.pathname === '/admin/customers' ? '#6f42c1' : '#9e9e9e' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Customers" 
            primaryTypographyProps={{ 
              fontWeight: window.location.pathname === '/admin/customers' ? 500 : 400 
            }}
          />
        </ListItemButton>
        
        <ListItemButton
          component={Link}
          to="/admin/queues"
          sx={{ 
            borderRadius: 2, 
            mb: 0.5,
            bgcolor: window.location.pathname === '/admin/queues' ? '#ededfd' : 'transparent',
            color: window.location.pathname === '/admin/queues' ? '#6f42c1' : 'inherit',
            '&:hover': { bgcolor: '#e0e0ff' }
          }}
        >
          <ListItemIcon>
            <QueueIcon sx={{ color: window.location.pathname === '/admin/queues' ? '#6f42c1' : '#9e9e9e' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Queues" 
            primaryTypographyProps={{ 
              fontWeight: window.location.pathname === '/admin/queues' ? 500 : 400 
            }}
          />
        </ListItemButton>
        
        <ListItemButton
          component={Link}
          to="/admin/analytics"
          sx={{ 
            borderRadius: 2, 
            mb: 0.5,
            bgcolor: window.location.pathname === '/admin/analytics' ? '#ededfd' : 'transparent',
            color: window.location.pathname === '/admin/analytics' ? '#6f42c1' : 'inherit',
            '&:hover': { bgcolor: '#e0e0ff' }
          }}
        >
          <ListItemIcon>
            <BarChartIcon sx={{ color: window.location.pathname === '/admin/analytics' ? '#6f42c1' : '#9e9e9e' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Analytics" 
            primaryTypographyProps={{ 
              fontWeight: window.location.pathname === '/admin/analytics' ? 500 : 400 
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/admin/notifications"
          sx={{ 
            borderRadius: 2, 
            mb: 0.5,
            bgcolor: window.location.pathname === '/admin/notifications' ? '#ededfd' : 'transparent',
            color: window.location.pathname === '/admin/notifications' ? '#6f42c1' : 'inherit',
            '&:hover': { bgcolor: '#e0e0ff' }
          }}
        >
          <ListItemIcon>
            <NotificationsIcon sx={{ color: window.location.pathname === '/admin/notifications' ? '#6f42c1' : '#9e9e9e' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Notifications" 
            primaryTypographyProps={{ 
              fontWeight: window.location.pathname === '/admin/notifications' ? 500 : 400 
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/admin/settings"
          sx={{ 
            borderRadius: 2, 
            mb: 0.5,
            bgcolor: window.location.pathname === '/admin/settings' ? '#ededfd' : 'transparent',
            color: window.location.pathname === '/admin/settings' ? '#6f42c1' : 'inherit',
            '&:hover': { bgcolor: '#e0e0ff' }
          }}
        >
          <ListItemIcon>
            <SettingsIcon sx={{ color: window.location.pathname === '/admin/settings' ? '#6f42c1' : '#9e9e9e' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Settings" 
            primaryTypographyProps={{ 
              fontWeight: window.location.pathname === '/admin/settings' ? 500 : 400 
            }}
          />
        </ListItemButton>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Logout Button */}
      <Box sx={{ px: 2 }}>
        <ListItemButton 
          sx={{ borderRadius: 2, mb: 0.5 }}
          onClick={handleLogout}
        >
          <ListItemIcon>
            <LogoutIcon sx={{ color: '#9e9e9e' }} />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
      
      {/* Admin User Info */}
      {user && (
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              sx={{ width: 36, height: 36 }} 
              alt={user.name || "Admin"} 
              src="/static/images/avatar/1.jpg" 
            />
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentService ? `${currentService.name} Admin` : 'Administrator'}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f7fb', height: '100vh' }}>
      <CssBaseline />
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: '#333',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
          </IconButton>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: '50%',
            position: 'relative',
            bgcolor: '#f5f7fb',
            borderRadius: 10,
            px: 2
          }}>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ ml: 2, width: 40, height: 40 }} 
              alt={user?.name || "Admin"} 
              src="/static/images/avatar/1.jpg" 
            />
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'white',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'white',
              border: 'none',
              boxShadow: '0 0 10px rgba(0,0,0,0.05)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          overflow: 'auto'
        }}
      >
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/queues" element={<QueuesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminLayout;