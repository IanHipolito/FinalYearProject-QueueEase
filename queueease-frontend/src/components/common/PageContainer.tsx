import React from 'react';
import { Box, Container } from '@mui/material';
import { PageContainerProps } from 'types/commonTypes';

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  maxWidth = "md", 
  centerContent = false 
}) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fb',
        py: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: centerContent ? 'center' : 'stretch'
      }}
    >
      <Container maxWidth={maxWidth}>
        {children}
      </Container>
    </Box>
  );
};

export default PageContainer;