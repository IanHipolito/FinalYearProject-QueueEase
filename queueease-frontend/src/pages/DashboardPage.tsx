import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Button,
  Paper,
  IconButton,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const DashboardPage: React.FC = () => {
  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Dashboard
      </Typography>

      {/* Top Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Customer Card */}
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
                  <ShoppingBagIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreHorizIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                  123
                  <Box component="span" sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    fontSize: '0.5em', 
                    p: 0.5, 
                    borderRadius: 1, 
                    ml: 1 
                  }}>
                    +5%
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Total Customers in Queue
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Queues Card */}
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
                  <DashboardIcon />
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Button size="small" variant="contained" sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    mr: 1,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}>
                    Month
                  </Button>
                  <Button size="small" variant="text" sx={{ color: 'white' }}>
                    Year
                  </Button>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  5
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  No. of Queues
                </Typography>
              </Box>
              <Box sx={{ mt: 2, height: 40 }}>
                {/* Simple line chart placeholder */}
                <svg width="100%" height="40" viewBox="0 0 200 40">
                  <path d="M0,30 Q40,10 80,25 T160,15 T200,20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                </svg>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Orders Card */}
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
                  <AccountBalanceWalletIcon />
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  50
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Total Orders
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Growth Chart Card */}
      <Card sx={{ borderRadius: 4, mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Growth
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                $2,324.00
              </Typography>
            </Box>
            <FormControl size="small" sx={{ width: 120 }}>
              <Select
                value="today"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ height: 250, mt: 3 }}>
            {/* This would be replaced with an actual chart component */}
            <Paper sx={{ 
              height: '100%', 
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              p: 2
            }}>
              {[80, 180, 70, 120, 60, 140, 180, 140, 120, 90, 120, 180].map((height, index) => (
                <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{ 
                    width: 16, 
                    height: height * 0.8, 
                    borderRadius: '4px 4px 0 0',
                    background: `linear-gradient(to top, rgba(61, 139, 253, 0.8) 50%, rgba(111, 66, 193, 0.8) 50%)`,
                  }} />
                </Box>
              ))}
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Latest Orders */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="500" gutterBottom>
                Latest Orders
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ py: 1, borderBottom: '1px solid #f0f0f0' }}>
                  Order #123 (Burger King) - Completed
                </Typography>
                <Typography variant="body2" sx={{ py: 1, borderBottom: '1px solid #f0f0f0' }}>
                  Order #124 (McDonald's) - In Progress
                </Typography>
                <Typography variant="body2" sx={{ py: 1, borderBottom: '1px solid #f0f0f0' }}>
                  Order #125 (Domino's Pizza) - Pending
                </Typography>
                <Button 
                  variant="text" 
                  sx={{ 
                    mt: 2, 
                    fontWeight: 'medium', 
                    color: '#3d8bfd'
                  }}
                >
                  View All
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Map */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="500" gutterBottom>
                  Customer Map
                </Typography>
                <FormControl size="small" sx={{ width: 120 }}>
                  <Select
                    value="monthly"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box 
                sx={{
                  mt: 2,
                  height: 180,
                  bgcolor: '#f8f9fa',
                  borderRadius: 2,
                  p: 2,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between'
                }}
              >
                {/* Simplified bar chart */}
                {[40, 65, 25, 45, 75].map((height, index) => (
                  <Box 
                    key={index}
                    sx={{
                      width: '12%',
                      height: `${height}%`,
                      bgcolor: '#3d8bfd',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;