import React, { useMemo } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Tooltip, 
  Skeleton,
  useTheme
} from '@mui/material';

interface KeywordData {
  text: string;
  value: number;
  sentiment: string;
}

interface FeedbackKeywordCloudProps {
  keywords: KeywordData[];
}

const FeedbackKeywordCloud: React.FC<FeedbackKeywordCloudProps> = ({ keywords = [] }) => {
  const theme = useTheme();
  const sortedKeywords = useMemo(() => 
    [...(keywords || [])].sort((a, b) => b.value - a.value), 
    [keywords]
  );
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '#4caf50';
      case 'negative': return '#f44336';
      case 'neutral': default: return '#ff9800';
    }
  };

  const getWordSize = (value: number) => {
    // Normalize word sizes between 14px and 38px
    const minSize = 14;
    const maxSize = 38;
    const maxValue = Math.max(...keywords.map(k => k.value || 0), 1);
    return Math.max(minSize, Math.min(maxSize, minSize + ((value || 0) / maxValue) * (maxSize - minSize)));
  };

  return (
    <Card sx={{ 
      borderRadius: 4, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      height: '100%',
      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
      }
    }}>
      <CardContent sx={{ height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="600" color="text.primary">
              Feedback Keywords
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Common terms from customer feedback
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          p: 2,
          height: '260px',
          overflow: 'hidden',
          alignItems: 'center',
          position: 'relative',
          bgcolor: theme.palette.background.default,
          borderRadius: 2
        }}>
          {keywords && keywords.length > 0 ? (
            sortedKeywords.map((word, idx) => (
              <Tooltip 
                key={idx}
                title={`${word.text}: Mentioned ${word.value} times (${word.sentiment})`}
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    m: 1.5,
                    p: 0.5,
                    fontSize: `${getWordSize(word.value)}px`,
                    color: getSentimentColor(word.sentiment),
                    fontWeight: (word.value || 0) > 5 ? 'bold' : 'medium',
                    opacity: Math.max(0.6, Math.min(1, 0.6 + (word.value || 0) * 0.04)),
                    textAlign: 'center',
                    display: 'inline-block',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      opacity: 1
                    }
                  }}
                >
                  {word.text || ''}
                </Box>
              </Tooltip>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              {keywords === undefined ? (
                <>
                  <Skeleton variant="text" width="60%" height={30} sx={{ mb: 1, mx: 'auto' }} />
                  <Skeleton variant="text" width="80%" height={30} sx={{ mb: 1, mx: 'auto' }} />
                  <Skeleton variant="text" width="50%" height={30} sx={{ mb: 1, mx: 'auto' }} />
                </>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 4 }}>
                  No feedback keywords available yet
                </Typography>
              )}
            </Box>
          )}
        </Box>
        
        {keywords && keywords.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: '#4caf50', 
                  mr: 1 
                }} 
              />
              <Typography variant="caption">Positive</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: '#ff9800', 
                  mr: 1 
                }} 
              />
              <Typography variant="caption">Neutral</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: '#f44336', 
                  mr: 1 
                }} 
              />
              <Typography variant="caption">Negative</Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackKeywordCloud;