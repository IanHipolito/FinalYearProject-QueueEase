import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Box,
  TextField,
  DialogActions,
  Button
} from '@mui/material';

interface QueueFormData {
  name: string;
  department: string;
  description: string;
  max_capacity: number;
}

interface CreateQueueDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  formData: QueueFormData;
  setFormData: (data: QueueFormData) => void;
}

const CreateQueueDialog: React.FC<CreateQueueDialogProps> = ({
  open,
  onClose,
  onCreate,
  formData,
  setFormData
}) => {
  const handleChange = (field: keyof QueueFormData, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Create New Queue</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Fill in the details to create a new queue for your service.
        </DialogContentText>
        
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            margin="dense"
            label="Queue Name"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            variant="outlined"
          />
          
          <TextField
            margin="dense"
            label="Department"
            fullWidth
            required
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
            variant="outlined"
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            variant="outlined"
          />
          
          <TextField
            margin="dense"
            label="Maximum Capacity"
            type="number"
            fullWidth
            value={formData.max_capacity}
            onChange={(e) => handleChange('max_capacity', parseInt(e.target.value))}
            inputProps={{ min: 1 }}
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onCreate} 
          variant="contained"
          disabled={!formData.name || !formData.department}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateQueueDialog;