import React from 'react';
import {
  Paper, TableContainer, Table, TableHead, TableBody, TableRow, 
  TableCell, Typography, Box, Avatar, Chip, IconButton, Button
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { CustomerTableProps } from 'types/customerTypes';

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  renderSkeletons,
  onShowDetails,
  searchTerm,
  onClearFilter
}) => {
  return (
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
          {loading ? (
            renderSkeletons()
          ) : customers.length > 0 ? (
            customers.map((customer) => (
              <TableRow key={customer.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ 
                      mr: 2, 
                      bgcolor: customer.is_active ? '#6f42c1' : '#9e9e9e'
                    }}>
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
                  <IconButton 
                    size="small"
                    onClick={() => onShowDetails(customer)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No customers found matching your criteria
                </Typography>
                {searchTerm && (
                  <Button 
                    variant="text" 
                    color="primary" 
                    sx={{ mt: 1 }}
                    onClick={onClearFilter}
                  >
                    Clear filters
                  </Button>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;