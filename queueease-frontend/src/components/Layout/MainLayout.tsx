import React from 'react';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

interface MainLayoutProps {
  children?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, maxWidth = 'md' }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fb',
        py: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Container maxWidth={maxWidth}>
        {children || <Outlet />}
      </Container>
    </Box>
  );
};

export default MainLayout;