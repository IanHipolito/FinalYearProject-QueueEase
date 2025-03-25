import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Chip,
  Divider,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import { UserFeedbackHistory } from '../../types/feedbackTypes';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EventIcon from '@mui/icons-material/Event';
import StoreIcon from '@mui/icons-material/Store';

interface FeedbackHistoryCardProps {
  feedback: UserFeedbackHistory;
}

const FeedbackHistoryCard: React.FC<FeedbackHistoryCardProps> = ({ feedback }) => {
  const [expanded, setExpanded] = useState(false);

  const getSentimentDisplay = (sentiment: string | undefined) => {
    if (!sentiment) return { icon: null, color: 'text.primary' };
    
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return {
          icon: <SentimentSatisfiedAltIcon sx={{ color: '#4caf50', ml: 1 }} />,
          color: '#4caf50',
          label: 'Positive'
        };
      case 'negative':
        return {
          icon: <SentimentVeryDissatisfiedIcon sx={{ color: '#f44336', ml: 1 }} />,
          color: '#f44336',
          label: 'Negative'
        };
      case 'neutral':
      default:
        return {
          icon: <SentimentNeutralIcon sx={{ color: '#ff9800', ml: 1 }} />,
          color: '#ff9800',
          label: 'Neutral'
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
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              mr: 2, 
              p: 1, 
              borderRadius: 2, 
              bgcolor: 'rgba(111, 66, 193, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <StoreIcon sx={{ color: '#6f42c1' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="medium">{feedback.service_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {feedback.order_details}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Chip
              {...(sentimentDisplay.icon ? { icon: sentimentDisplay.icon } : {})}
              label={sentimentDisplay.label}
              size="small"
              sx={{
                color: 'white',
                bgcolor: sentimentDisplay.color,
                fontWeight: 'medium',
                mb: 1
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Rating value={feedback.rating} readOnly size="small" />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <EventIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate(feedback.date)}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        {feedback.comment && (
          <Collapse in={expanded || feedback.comment.length < 100}>
            <Box sx={{ my: 2 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                "{feedback.comment}"
              </Typography>
            </Box>
          </Collapse>
        )}

        {feedback.comment && feedback.comment.length >= 100 && (
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Tooltip title={expanded ? "Show less" : "Show more"}>
              <IconButton 
                size="small" 
                onClick={() => setExpanded(!expanded)}
                sx={{ 
                  bgcolor: 'rgba(111, 66, 193, 0.1)', 
                  '&:hover': { bgcolor: 'rgba(111, 66, 193, 0.2)' } 
                }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
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
                fontSize: '0.75rem',
                '&:hover': {
                  bgcolor: 'rgba(111, 66, 193, 0.2)',
                }
              }} 
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeedbackHistoryCard;