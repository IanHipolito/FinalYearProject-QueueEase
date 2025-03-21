import React from 'react';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  backUrl?: string;
  onBack?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, backUrl, onBack }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    }
  };
  
  return (
    <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', width: '100%' }}>
      <IconButton 
        onClick={handleBack} 
        sx={{ 
          mr: 2,
          color: theme.palette.primary.main,
          '&:hover': { bgcolor: 'rgba(111, 66, 193, 0.08)' }
        }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4" fontWeight={700} color="text.primary">
        {title}
      </Typography>
    </Box>
  );
};

export default PageHeader;