import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  Chip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Service } from '../../types/serviceTypes';

interface BottomSheetProps {
  height: 'collapsed' | 'partial' | 'full';
  toggleHeight: () => void;
  collapseSheet: () => void;
  title: string;
  filteredCount: number;
  showResetButton: boolean;
  onReset: () => void;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  height,
  toggleHeight,
  collapseSheet,
  title,
  filteredCount,
  showResetButton,
  onReset,
  children
}) => {
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        height: height === 'full' ? 'calc(85vh)' :
          height === 'partial' ? 'calc(40vh)' :
            height === 'collapsed' ? '40px' : '64px',
        maxHeight: 'calc(90vh)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#ffffff',
        transform: 'translateZ(0)',
        willChange: 'height',
        boxShadow: '0px -2px 10px rgba(0,0,0,0.1)'
      }}
    >
      {/* Handle for dragging sheet - works in all states */}
      <Box
        onClick={toggleHeight}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 1,
          cursor: 'pointer',
          userSelect: 'none',
          minHeight: height === 'collapsed' ? '40px' : 'auto',
          alignItems: 'center'
        }}
      >
        {height === 'collapsed' ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight={600} sx={{ mr: 1 }}>
              {filteredCount} Services Available
            </Typography>
            <KeyboardArrowUpIcon fontSize="small" />
          </Box>
        ) : (
          <Box
            sx={{
              width: 40,
              height: 4,
              bgcolor: 'rgba(0,0,0,0.1)',
              borderRadius: 2
            }}
          />
        )}
      </Box>

      {/* Title bar - only shown when not collapsed */}
      {height !== 'collapsed' && (
        <Box sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {title} ({filteredCount})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {showResetButton && (
              <Button
                variant="outlined"
                size="small"
                onClick={onReset}
                startIcon={<RestartAltIcon />}
                sx={{ borderRadius: 4 }}
              >
                Reset
              </Button>
            )}
            <IconButton
              size="small"
              onClick={height === 'full' ? toggleHeight : collapseSheet}
              sx={{
                bgcolor: 'rgba(0,0,0,0.05)',
                borderRadius: 2,
                width: 32,
                height: 32
              }}
            >
              {height === 'full' ? <KeyboardArrowDownIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Services list - only rendered when not collapsed */}
      {height !== 'collapsed' && (
        <Box
          className="service-list-container"
          sx={{
            overflow: 'auto',
            flexGrow: 1,
            px: 2,
            pb: 2,
            overscrollBehavior: 'contain'
          }}
        >
          {children}
        </Box>
      )}
    </Paper>
  );
};

export default BottomSheet;