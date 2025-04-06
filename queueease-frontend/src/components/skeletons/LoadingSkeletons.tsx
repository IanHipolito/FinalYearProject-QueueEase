import React from 'react';
import { Box, Skeleton, Grid, Card, CardContent, Paper } from '@mui/material';
import { LoadingSkeletonProps } from 'types/commonTypes';

export const StatCardSkeleton = () => (
  <Card sx={{ borderRadius: 4, height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 2 }} />
        <Skeleton variant="circular" width={32} height={32} />
      </Box>
      <Box sx={{ mt: 3 }}>
        <Skeleton variant="rectangular" width="60%" height={40} />
        <Skeleton variant="text" width="80%" sx={{ mt: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <>
    <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
    {Array(rows).fill(0).map((_, i) => (
      <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 0.5, opacity: 1 - i * 0.1 }} />
    ))}
  </>
);

export const DashboardSkeleton = () => (
  <Box sx={{ width: '100%' }}>
    <Skeleton variant="text" width="200px" height={40} sx={{ mb: 3 }} />
    
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {[1, 2, 3].map(i => (
        <Grid item xs={12} md={4} key={i}>
          <StatCardSkeleton />
        </Grid>
      ))}
    </Grid>
    
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Skeleton variant="text" width="180px" height={32} sx={{ mb: 2 }} />
            <TableSkeleton rows={3} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={5}>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Skeleton variant="text" width="180px" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant = 'detail' }) => {
  if (variant === 'detail') {
    return (
      <Paper
        elevation={0}
        sx={{ 
          borderRadius: 3,
          p: 3,
          border: `1px solid rgba(0, 0, 0, 0.12)`
        }}
      >
        <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={40} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (variant === 'list') {
    return (
      <>
        {[1, 2, 3].map(i => (
          <Paper 
            key={i}
            elevation={1}
            sx={{ 
              borderRadius: 3,
              p: 3,
              mb: 2
            }}
          >
            <Skeleton variant="rectangular" height={24} width="60%" sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={16} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={16} sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Skeleton variant="rectangular" height={36} width={120} />
            </Box>
          </Paper>
        ))}
      </>
    );
  }

  // Card variant
  return (
    <Paper
      elevation={1}
      sx={{ 
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      <Skeleton variant="rectangular" height={80} />
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={20} width="80%" sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ width: '100%' }}>
            <Skeleton variant="rectangular" height={16} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={16} width="80%" />
          </Box>
        </Box>
        
        <Skeleton variant="rectangular" height={40} sx={{ mt: 1 }} />
      </Box>
    </Paper>
  );
};

export default LoadingSkeleton;