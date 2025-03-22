import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  TextField,
  Chip,
  Button,
  FormControl,
  FormHelperText,
  CircularProgress,
  Alert
} from '@mui/material';
import { FeedbackCategory, FeedbackData } from '../../types/feedbackTypes';

interface FeedbackFormProps {
  serviceId: number;
  serviceName: string;
  orderId: number;
  orderDetails: string;
  userId: number;
  onSubmitSuccess: () => void;
  availableCategories: FeedbackCategory[];
  isLoading: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  serviceId,
  serviceName,
  orderId,
  orderDetails,
  userId,
  onSubmitSuccess,
  availableCategories,
  isLoading
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    if (rating === null) {
      setError('Please provide a rating');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    const feedbackData: FeedbackData = {
      service_id: serviceId,
      rating,
      comment,
      categories: selectedCategories,
      order_id: orderId,
      user_id: userId
    };

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/feedback/submit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        setSuccess(true);
        setComment('');
        setRating(null);
        setSelectedCategories([]);
        onSubmitSuccess();
        
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Thank you for your feedback!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        Rate your experience with {serviceName}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Order: {orderDetails}
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Typography component="legend" sx={{ mr: 2 }}>Your Rating:</Typography>
        <Rating
          name="feedback-rating"
          value={rating}
          onChange={(event, newValue) => {
            setRating(newValue);
          }}
          size="large"
          precision={1}
          sx={{ fontSize: '2rem' }}
        />
      </Box>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <Typography component="legend" sx={{ mb: 1 }}>
          What aspects of your experience would you like to rate?
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {availableCategories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              onClick={() => handleCategoryToggle(category.id)}
              color={selectedCategories.includes(category.id) ? "primary" : "default"}
              sx={{ 
                borderRadius: 2,
                '&.MuiChip-colorPrimary': {
                  bgcolor: '#6f42c1',
                },
                '&:hover': {
                  bgcolor: selectedCategories.includes(category.id) ? '#8551d9' : '#f0f0f0',
                },
              }}
            />
          ))}
        </Box>
        {selectedCategories.length === 0 && (
          <FormHelperText error>Please select at least one category</FormHelperText>
        )}
      </FormControl>
      
      <TextField
        fullWidth
        label="Additional Comments"
        multiline
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Please share your thoughts about your experience..."
        sx={{ mb: 3 }}
      />
      
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={submitting}
        sx={{
          bgcolor: '#6f42c1',
          borderRadius: 2,
          py: 1,
          px: 4,
          '&:hover': {
            bgcolor: '#8551d9',
          },
        }}
      >
        {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : "Submit Feedback"}
      </Button>
    </Box>
  );
};

export default FeedbackForm;