import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Chip,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';

const CustomersPage: React.FC = () => {
  // Mock data for customers
  const customers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', orders: 5 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', orders: 3 },
    { id: 3, name: 'Robert Johnson', email: 'robert@example.com', status: 'Inactive', orders: 0 },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', status: 'Active', orders: 7 },
    { id: 5, name: 'Michael Wilson', email: 'michael@example.com', status: 'Active', orders: 2 },
  ];

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Customers
      </Typography>

      {/* Top Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Users Card */}
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
                  <PersonIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
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
                    +8%
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Total Users
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Members Card */}
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
                  <PeopleAltIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  120
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Total Active Members
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

        {/* Total Orders Card */}
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
                  <ShoppingBagIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
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

      {/* Customer List Card */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          {/* Search and Add Button Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <TextField 
              placeholder="Search by name or email"
              variant="outlined"
              size="small"
              sx={{ 
                width: { xs: '100%', sm: '350px' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ 
                borderRadius: 2, 
                bgcolor: '#6f42c1', 
                '&:hover': { bgcolor: '#8551d9' }
              }}
            >
              Add New Customer
            </Button>
          </Box>

          {/* Customers Table */}
          <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Orders</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: '#6f42c1' }}>
                          {customer.name.charAt(0)}
                        </Avatar>
                        {customer.name}
                      </Box>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.status} 
                        size="small"
                        sx={{ 
                          bgcolor: customer.status === 'Active' ? '#e8f5e9' : '#ffebee',
                          color: customer.status === 'Active' ? '#2e7d32' : '#c62828',
                          fontWeight: 500
                        }} 
                      />
                    </TableCell>
                    <TableCell>{customer.orders}</TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomersPage;