import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface KeywordData {
  text: string;
  value: number;
  sentiment: string;
}

interface FeedbackKeywordCloudProps {
  keywords: KeywordData[];
}

const FeedbackKeywordCloud: React.FC<FeedbackKeywordCloudProps> = ({ keywords = [] }) => {
  const sortedKeywords = [...(keywords || [])].sort((a, b) => b.value - a.value);
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '#4caf50';
      case 'negative': return '#f44336';
      case 'neutral': default: return '#ff9800';
    }
  };

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="500" gutterBottom>
          Feedback Keywords
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          p: 2,
          height: 250,
          overflow: 'hidden',
          alignItems: 'center'
        }}>
          {sortedKeywords && sortedKeywords.length > 0 ? (
            sortedKeywords.map((word, idx) => (
              <Box
                key={idx}
                sx={{
                  m: 1,
                  p: 1,
                  fontSize: `${Math.max(14, Math.min(30, 14 + (word.value || 0) * 2))}px`,
                  color: getSentimentColor(word.sentiment),
                  fontWeight: (word.value || 0) > 5 ? 'bold' : 'normal',
                  opacity: Math.max(0.5, Math.min(1, 0.5 + (word.value || 0) * 0.05)),
                  textAlign: 'center',
                  display: 'inline-block'
                }}
              >
                {word.text || ''}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No feedback keywords available
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeedbackKeywordCloud;