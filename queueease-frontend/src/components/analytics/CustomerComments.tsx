import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  MenuItem,
  Rating,
  Select,
  SelectChangeEvent,
  Typography
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

interface CustomerComment {
  id: number;
  name: string;
  date: string;
  queue: string;
  rating: number;
  comment: string;
  avatar?: string;
}

interface CustomerCommentsProps {
  comments: CustomerComment[];
  filter: string;
  onFilterChange: (event: SelectChangeEvent) => void;
}

const CustomerComments: React.FC<CustomerCommentsProps> = ({ 
  comments, 
  filter, 
  onFilterChange 
}) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ChatIcon sx={{ mr: 1, color: '#6f42c1' }} />
            <Typography variant="h6" fontWeight="500">
              Customer Feedback Comments
            </Typography>
          </Box>
          <FormControl size="small" sx={{ width: 120 }}>
            <Select
              value={filter}
              onChange={onFilterChange}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="recent">Most Recent</MenuItem>
              <MenuItem value="positive">Positive</MenuItem>
              <MenuItem value="negative">Negative</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {comments.length > 0 ? (
          comments.map((feedback, index) => (
            <React.Fragment key={feedback.id}>
              <Box sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={feedback.avatar}
                      sx={{ 
                        bgcolor: !feedback.avatar ? `hsl(${feedback.id * 60}, 70%, 65%)` : undefined,
                        width: 40, 
                        height: 40,
                        mr: 1.5
                      }}
                    >
                      {!feedback.avatar && feedback.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="500">
                        {feedback.name}
                        <Chip 
                          label={feedback.queue} 
                          size="small" 
                          sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                        />
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {feedback.date}
                      </Typography>
                    </Box>
                  </Box>
                  <Rating value={feedback.rating} readOnly size="small" />
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    ml: 7, 
                    bgcolor: 'background.paper', 
                    p: 1.5, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {feedback.comment}
                </Typography>
              </Box>
              {index < comments.length - 1 && <Divider />}
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No feedback comments available for the selected filter.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerComments;