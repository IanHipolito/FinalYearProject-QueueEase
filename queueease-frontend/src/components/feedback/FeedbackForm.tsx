import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Rating, TextField, Chip, 
  Button, FormControl, FormHelperText, Stack,
  CircularProgress, Alert, Paper, Fade, Grow
} from '@mui/material';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { API } from 'services/api';
import { FeedbackData, FeedbackFormProps } from 'types/feedbackTypes';

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
  // Form state
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // UI state
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  
  // Custom rating labels for better UX
  const labels: { [index: string]: string } = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  // Calculate form completion progress
  useEffect(() => {
    let progress = 0;
    // Rating is 40% of the form weight
    if (rating !== null) progress += 40;
    // Categories are 40% of the form weight
    if (selectedCategories.length > 0) progress += 40;
    // Comment is 20% of the form weight
    if (comment.trim().length > 0) progress += 20;
    setFormProgress(progress);
  }, [rating, selectedCategories, comment]);

  // Toggle category selection
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Get appropriate icon based on rating value
  const getRatingIcon = (value: number) => {
    if (value >= 4) return <SentimentSatisfiedAltIcon />;
    if (value <= 2) return <SentimentVeryDissatisfiedIcon />;
    return <SentimentNeutralIcon />;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Form validation
    if (rating === null) {
      setError('Please provide a rating');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    // Prepare feedback data
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
      // Submit feedback to API
      await API.feedback.submitFeedback(feedbackData);
      
      // Reset form and show success message
      setSuccess(true);
      setComment('');
      setRating(null);
      setSelectedCategories([]);
      
      // Callback to parent component
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  // Reusable style for step number bubble
  const stepNumberStyle = {
    mr: 1, 
    bgcolor: '#6f42c1', 
    color: 'white', 
    borderRadius: '50%',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 'bold'
  };

  // Get colour based on rating
  const getRatingColor = (value: number | null) => {
    if (!value) return '#6f42c1';
    if (value > 3) return '#4caf50';
    if (value < 3) return '#f44336';
    return '#ff9800';
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} color="secondary" />
      </Box>
    );
  }

  return (
    <Box>
      {/* Success message */}
      <Fade in={success}>
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0px 4px 12px rgba(0,0,0,0.05)'
          }}
          icon={<CheckCircleIcon fontSize="inherit" />}
        >
          Thank you for your valuable feedback! We appreciate your input.
        </Alert>
      </Fade>
      
      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Form Progress Indicator */}
      <Box sx={{ mb: 3, width: '100%', bgcolor: 'rgba(111, 66, 193, 0.1)', borderRadius: 2, height: 4, overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            width: `${formProgress}%`,
            bgcolor: '#6f42c1',
            transition: 'width 0.5s ease'
          }}
        />
      </Box>

      {/* Form header with service info */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#fafafa' }}>
        <Typography variant="h5" fontWeight="500" gutterBottom>
          Rate your experience with {serviceName}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Order: <Box component="span" fontWeight="500">{orderDetails}</Box>
        </Typography>
      </Paper>
      
      {/* Rating */}
      <Grow in={true}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Box sx={stepNumberStyle}>1</Box>
            How was your experience?
          </Typography>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              borderRadius: 3,
              // Background colour based on rating
              bgcolor: rating ? (rating > 3 ? '#f0f7f0' : rating < 3 ? '#fdf0f0' : '#f5f5f5') : '#f5f5f5',
              transition: 'background-color 0.3s ease',
              border: '1px solid',
              // Border colour based on rating
              borderColor: rating ? (rating > 3 ? 'rgba(76, 175, 80, 0.2)' : rating < 3 ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255, 152, 0, 0.2)') : 'transparent'
            }}
          >
            <Rating
              name="feedback-rating"
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              size="large"
              precision={1}
              sx={{ 
                fontSize: '2.5rem',
                '& .MuiRating-iconFilled': {
                  color: getRatingColor(rating),
                }
              }}
              icon={rating ? getRatingIcon(rating) : undefined}
            />
            
            {/* Show rating label when a rating is selected */}
            {rating !== null && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                {getRatingIcon(rating)}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: '500',
                    color: getRatingColor(rating)
                  }}
                >
                  {labels[rating]}
                </Typography>
              </Stack>
            )}
          </Paper>
        </Box>
      </Grow>
      
      {/* Categories */}
      <FormControl fullWidth sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Box sx={stepNumberStyle}>2</Box>
          Which aspects would you like to rate?
        </Typography>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: '#f5f5f5', mb: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {availableCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                onClick={() => handleCategoryToggle(category.id)}
                color={selectedCategories.includes(category.id) ? "primary" : "default"}
                sx={{ 
                  borderRadius: 2,
                  py: 0.5,
                  fontSize: '0.9rem',
                  '&.MuiChip-colorPrimary': {
                    bgcolor: '#6f42c1',
                  },
                  '&:hover': {
                    bgcolor: selectedCategories.includes(category.id) ? '#8551d9' : '#f0f0f0',
                    transform: 'translateY(-2px)',
                    transition: 'transform 0.2s ease'
                  },
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Box>
        </Paper>
        {/* Helper text based on selection state */}
        {selectedCategories.length === 0 ? (
          <FormHelperText error>Please select at least one category</FormHelperText>
        ) : (
          <FormHelperText sx={{ color: '#4caf50' }}>
            {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
          </FormHelperText>
        )}
      </FormControl>
      
      {/* Comments */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Box sx={stepNumberStyle}>3</Box>
          Additional Comments
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Please share your thoughts about your experience..."
          variant="outlined"
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: '#fafafa',
              '&:hover fieldset': {
                borderColor: '#8551d9',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#6f42c1',
              },
            }
          }}
        />
        {/* Character count or helper text */}
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
          {comment.length > 0 
            ? `${comment.length} characters` 
            : 'Add a comment to provide more details (optional)'}
        </Typography>
      </Box>
      
      {/* Form footer with completion percentage and submit button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Form completion: {formProgress}%
        </Typography>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || rating === null || selectedCategories.length === 0}
          size="large"
          startIcon={submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : null}
          sx={{
            bgcolor: '#6f42c1',
            borderRadius: 2,
            py: 1.2,
            px: 4,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '1rem',
            boxShadow: '0px 4px 12px rgba(111, 66, 193, 0.2)',
            '&:hover': {
              bgcolor: '#8551d9',
              boxShadow: '0px 6px 15px rgba(111, 66, 193, 0.3)',
            },
            '&:disabled': {
              bgcolor: '#e0e0e0',
            },
          }}
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </Box>
    </Box>
  );
};

export default FeedbackForm;