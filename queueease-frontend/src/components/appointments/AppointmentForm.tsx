import React, { useState } from 'react';
import { Box, Alert } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FormTextField from '../form/FormTextField';
import StyledButton from '../common/StyledButton';
import { AppointmentFormProps } from 'types/appointmentTypes';

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSubmit,
  initialValue = '',
  buttonText = 'Add Appointment'
}) => {
  const [orderID, setOrderID] = useState(initialValue);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await onSubmit(orderID);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderID(e.target.value);
  };
  
  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <FormTextField
          id="orderID"
          label="Order ID"
          value={orderID}
          onChange={handleOrderIdChange}
          required
          helperText="Enter the order ID provided to you"
        />
        
        <StyledButton
          type="submit"
          fullWidth
          startIcon={<AddCircleOutlineIcon />}
          sx={{ mt: 2 }}
        >
          {buttonText}
        </StyledButton>
      </Box>
    </Box>
  );
};

export default AppointmentForm;