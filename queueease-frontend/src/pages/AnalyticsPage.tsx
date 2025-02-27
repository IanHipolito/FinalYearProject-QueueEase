import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Divider,
  Chip,
  Rating
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InsightsIcon from '@mui/icons-material/Insights';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FeedbackIcon from '@mui/icons-material/Feedback';
import ChatIcon from '@mui/icons-material/Chat';

const AnalyticsPage: React.FC = () => {
  // Mock data for analytics
  const feedbackData = [
    { id: 1, category: 'Wait Time', satisfied: 65, neutral: 20, dissatisfied: 15 },
    { id: 2, category: 'Staff Service', satisfied: 80, neutral: 10, dissatisfied: 10 },
    { id: 3, category: 'Queue Management', satisfied: 70, neutral: 15, dissatisfied: 15 },
    { id: 4, category: 'Facilities', satisfied: 75, neutral: 20, dissatisfied: 5 },
  ];
  
  // Mock data for customer feedback comments
  const customerFeedback = [
    { 
      id: 1, 
      name: 'John Doe', 
      date: '2023-04-15', 
      queue: 'General Queue',
      rating: 5,
      comment: 'The staff was very professional and the queue moved quickly. Great experience overall!' 
    },
    { 
      id: 2, 
      name: 'Maria Garcia', 
      date: '2023-04-14', 
      queue: 'Technical Support',
      rating: 4,
      comment: 'The wait was reasonable but the seating area could be improved. Otherwise good service.' 
    },
    { 
      id: 3, 
      name: 'Robert Johnson', 
      date: '2023-04-14', 
      queue: 'VIP Service',
      rating: 2,
      comment: 'Despite being in the VIP queue, I had to wait nearly 20 minutes. Not what I expected from premium service.' 
    },
    { 
      id: 4, 
      name: 'Emily Chen', 
      date: '2023-04-13', 
      queue: 'Cashier Queue',
      rating: 5,
      comment: 'Very efficient service! The new digital queue system is a great improvement.' 
    },
    { 
      id: 5, 
      name: 'Michael Brown', 
      date: '2023-04-12', 
      queue: 'Returns',
      rating: 3,
      comment: 'Process was okay but staff seemed unsure about the return policy. More training needed.' 
    },
  ];

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Analytics
      </Typography>

      {/* Top Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Reports Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)',
            color: '#fff',
            overflow: 'visible',
            position: 'relative',
            height: '100%'
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
                  <FeedbackIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                  123
                  <Box component="span" sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    fontSize: '0.5em', 
                    p: 0.5, 
                    borderRadius: 1, 
                    ml: 1 
                  }}>
                    +12%
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Total Feedback Reports
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Satisfaction Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)',
            color: '#fff',
            height: '100%',
            position: 'relative',
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
                  <InsightsIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  78%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Customer Satisfaction
                </Typography>
              </Box>
              <Box sx={{ mt: 2, height: 40 }}>
                {/* Simple line chart placeholder */}
                <svg width="100%" height="40" viewBox="0 0 200 40">
                  <path d="M0,30 Q40,15 80,25 T160,10 T200,20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                </svg>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Wait Time Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #198754 0%, #28a745 100%)',
            color: '#fff',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
                  <AssessmentIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  12 min
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Average Wait Time
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Feedback Distribution Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="500">
                  Feedback Distribution
                </Typography>
                <FormControl size="small" sx={{ width: 120 }}>
                  <Select
                    value="month"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Bar Chart Placeholder */}
              <Box sx={{ height: 300, mt: 2 }}>
                <Paper sx={{ 
                  height: '100%', 
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  p: 2
                }}>
                  {feedbackData.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
                      <Box sx={{ display: 'flex', height: '230px', alignItems: 'flex-end', width: '100%' }}>
                        <Box 
                          sx={{ 
                            width: '30%', 
                            bgcolor: '#e57373', 
                            height: `${item.dissatisfied}%`,
                            borderRadius: '4px 4px 0 0'
                          }} 
                        />
                        <Box 
                          sx={{ 
                            width: '30%', 
                            bgcolor: '#ffb74d', 
                            height: `${item.neutral}%`,
                            borderRadius: '4px 4px 0 0',
                            mx: 0.5
                          }} 
                        />
                        <Box 
                          sx={{ 
                            width: '30%', 
                            bgcolor: '#81c784', 
                            height: `${item.satisfied}%`,
                            borderRadius: '4px 4px 0 0'
                          }} 
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        {item.category}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Donut Chart Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="500" gutterBottom>
                Customer Feedback
              </Typography>
              
              {/* Donut Chart Placeholder */}
              <Box sx={{ 
                height: 200, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                position: 'relative',
                mt: 2
              }}>
                {/* SVG Donut Chart */}
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#e8f5e9" strokeWidth="30" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#ffebee" strokeWidth="30" strokeDasharray="440" strokeDashoffset="374" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#e3f2fd" strokeWidth="30" strokeDasharray="440" strokeDashoffset="308" />
                </svg>
                
                {/* Center Text */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    85%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Satisfied
                  </Typography>
                </Box>
              </Box>
              
              {/* Legend */}
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#81c784', mr: 1 }} />
                  <Typography variant="body2">Satisfied</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffb74d', mr: 1 }} />
                  <Typography variant="body2">Neutral</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#e57373', mr: 1 }} />
                  <Typography variant="body2">Dissatisfied</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Feedback Data Table */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="500" gutterBottom>
            Detailed Feedback Reports
          </Typography>
          
          <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Satisfied %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Neutral %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Dissatisfied %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Responses</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedbackData.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: `${item.satisfied}%`, 
                            maxWidth: '100px',
                            height: '8px', 
                            bgcolor: '#81c784', 
                            borderRadius: 1,
                            mr: 1 
                          }} 
                        />
                        {item.satisfied}%
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: `${item.neutral}%`, 
                            maxWidth: '100px',
                            height: '8px', 
                            bgcolor: '#ffb74d', 
                            borderRadius: 1,
                            mr: 1 
                          }} 
                        />
                        {item.neutral}%
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: `${item.dissatisfied}%`, 
                            maxWidth: '100px',
                            height: '8px', 
                            bgcolor: '#e57373', 
                            borderRadius: 1,
                            mr: 1 
                          }} 
                        />
                        {item.dissatisfied}%
                      </Box>
                    </TableCell>
                    <TableCell>{item.satisfied + item.neutral + item.dissatisfied}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Customer Feedback Comments */}
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
                value="recent"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="negative">Negative</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {customerFeedback.map((feedback, index) => (
            <React.Fragment key={feedback.id}>
              <Box sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: `hsl(${feedback.id * 60}, 70%, 65%)`,
                        width: 40, 
                        height: 40,
                        mr: 1.5
                      }}
                    >
                      {feedback.name.charAt(0)}
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
              {index < customerFeedback.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsPage;