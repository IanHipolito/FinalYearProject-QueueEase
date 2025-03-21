import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Button,
  IconButton
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  orders: number;
  avatar?: string;
  is_active: boolean;
  last_visit?: string;
}

interface CustomerDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerDetailsDialog: React.FC<CustomerDetailsDialogProps> = ({
  open,
  onClose,
  customer
}) => {
  if (!customer) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Customer Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <MoreVertIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              bgcolor: customer.is_active ? '#6f42c1' : '#9e9e9e',
              mr: 2
            }}
          >
            {customer.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{customer.name}</Typography>
            <Chip 
              label={customer.status} 
              size="small"
              sx={{ 
                mt: 0.5,
                bgcolor: customer.status === 'Active' ? '#e8f5e9' : '#ffebee',
                color: customer.status === 'Active' ? '#2e7d32' : '#c62828',
                fontWeight: 500
              }} 
            />
          </Box>
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body1">{customer.email}</Typography>
            </Box>
          </Grid>
          
          {customer.phone && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Phone</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body1">{customer.phone}</Typography>
              </Box>
            </Grid>
          )}
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Total Orders</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <ShoppingBagIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body1">{customer.orders}</Typography>
            </Box>
          </Grid>
          
          {customer.last_visit && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Last Visit</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body1">
                  {new Date(customer.last_visit).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
        
        <Typography variant="subtitle1" gutterBottom>
          Customer Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<EmailIcon />}
            onClick={() => window.location.href = `mailto:${customer.email}`}
          >
            Send Email
          </Button>
          
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
          >
            Remove
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailsDialog;