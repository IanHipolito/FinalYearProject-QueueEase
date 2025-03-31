import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Button,
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Order {
  id: number | string;
  customer_name: string;
  date: string;
  status: string;
  service_name?: string;
  time?: string;
  type?: 'immediate' | 'appointment';
}

interface LatestOrdersListProps {
  orders: Order[];
  loading: boolean;
  isImmediateService: () => boolean;
  onRefresh: () => void;
  onOrderClick: (order: Order) => void;
  onViewAll: () => void;
  getStatusColor: (status?: string) => string;
}

const LatestOrdersList: React.FC<LatestOrdersListProps> = ({
  orders,
  loading,
  isImmediateService,
  onRefresh,
  onOrderClick,
  onViewAll,
  getStatusColor
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="500">
          {isImmediateService() ? 'Latest Customers' : 'Latest Appointments'}
        </Typography>
        <IconButton 
          size="small" 
          onClick={onRefresh}
          title="Refresh data"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : orders && orders.length > 0 ? (
          orders.map((order, index) => (
            <Box 
              key={`order-${order.id || index}`}
              sx={{ 
                py: 1.5, 
                px: 1,
                borderBottom: index < orders.length - 1 ? '1px solid #f0f0f0' : 'none',
                borderRadius: 1,
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  cursor: 'pointer'
                }
              }}
              onClick={() => onOrderClick(order)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={500}>
                    {isImmediateService() ? `Customer #${order.id}` : `Appointment #${order.id}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customer_name || 'Unknown Customer'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    {order.date || 'N/A'}{order.time && ` at ${order.time}`}
                  </Typography>
                  <Chip
                    label={order.status || 'N/A'}
                    size="small"
                    sx={{ 
                      fontSize: '0.7rem', 
                      height: 20,
                      bgcolor: getStatusColor(order.status),
                      color: 'white' 
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {isImmediateService() 
                ? 'No recent customers found' 
                : 'No recent appointments found'}
            </Typography>
          </Box>
        )}

        {orders && orders.length > 0 && (
          <Button
            variant="text"
            onClick={onViewAll}
            sx={{
              mt: 2,
              fontWeight: 'medium',
              color: '#3d8bfd'
            }}
          >
            {isImmediateService() ? 'View All Orders' : 'View All Appointments'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default LatestOrdersList;