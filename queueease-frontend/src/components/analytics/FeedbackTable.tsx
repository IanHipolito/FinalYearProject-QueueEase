import React from 'react';
import {
  Box, Card, CardContent, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography
} from '@mui/material';
import { FeedbackTableProps } from 'types/analyticsTypes';

const FeedbackTable: React.FC<FeedbackTableProps> = ({ data }) => {
  return (
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
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default FeedbackTable;