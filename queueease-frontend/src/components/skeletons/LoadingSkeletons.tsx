import React from 'react';
import { Box, Skeleton, Grid, Card, CardContent } from '@mui/material';

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