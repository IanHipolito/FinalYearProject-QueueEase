import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Chip,
  Divider
} from '@mui/material';
import { UserFeedbackHistory } from '../../types/feedbackTypes';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

interface FeedbackHistoryCardProps {
  feedback: UserFeedbackHistory;
}

const FeedbackHistoryCard: React.FC<FeedbackHistoryCardProps> = ({ feedback }) => {
  const getSentimentDisplay = (sentiment: string | undefined) => {
    if (!sentiment) return { icon: null, color: 'text.primary' };
    
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return {
          icon: <SentimentSatisfiedAltIcon sx={{ color: '#4caf50', ml: 1 }} />,
          color: '#4caf50'
        };
      case 'negative':
        return {
          icon: <SentimentVeryDissatisfiedIcon sx={{ color: '#f44336', ml: 1 }} />,
          color: '#f44336'
        };
      case 'neutral':
      default:
        return {
          icon: <SentimentNeutralIcon sx={{ color: '#ff9800', ml: 1 }} />,
          color: '#ff9800'
        };
    }
  };
  
  const sentimentDisplay = getSentimentDisplay(feedback.sentiment);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        mb: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="medium">{feedback.service_name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {feedback.order_details}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(feedback.date)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating value={feedback.rating} readOnly size="small" />
              {sentimentDisplay.icon}
            </Box>
          </Box>
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        {feedback.comment && (
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              "{feedback.comment}"
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          {feedback.categories.map((category, idx) => (
            <Chip 
              key={idx} 
              label={category} 
              size="small" 
              sx={{ 
                borderRadius: 1,
                bgcolor: 'rgba(111, 66, 193, 0.1)',
                color: '#6f42c1',
                fontSize: '0.75rem'
              }} 
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeedbackHistoryCard;