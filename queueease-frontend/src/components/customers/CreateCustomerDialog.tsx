import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
}

interface CreateCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: CustomerFormData;
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>;
  formError: string;
  formLoading: boolean;
}

const CreateCustomerDialog: React.FC<CreateCustomerDialogProps> = ({
  open,
  onClose,
  onSubmit,
  formData,
  setFormData,
  formError,
  formLoading
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => !formLoading && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Add New Customer</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Enter the new customer's details below.
        </DialogContentText>
        
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        
        <Box component="form" sx={{ '& .MuiTextField-root': { my: 1 } }}>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={formLoading}
          />
          <TextField
            margin="dense"
            id="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={formLoading}
          />
          <TextField
            margin="dense"
            id="phone"
            label="Phone Number"
            type="tel"
            fullWidth
            variant="outlined"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={formLoading}/>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={formLoading}>
          Cancel
        </Button>
        <Button 
          onClick={onSubmit} 
          variant="contained" 
          disabled={formLoading}
          startIcon={formLoading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {formLoading ? 'Creating...' : 'Add Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateCustomerDialog;