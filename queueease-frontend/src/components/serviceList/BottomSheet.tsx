import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

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
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        height: height === 'full' ? 'calc(75vh)' :
          height === 'partial' ? 'calc(35vh)' :
            height === 'collapsed' ? '36px' : '64px',
        maxHeight: 'calc(85vh)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#ffffff',
        transform: 'translateZ(0)',
        willChange: 'height',
        boxShadow: '0px -1px 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* Handle for dragging sheet */}
      <Box
        onClick={toggleHeight}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 0.75,
          cursor: 'pointer',
          userSelect: 'none',
          minHeight: height === 'collapsed' ? '36px' : 'auto',
          alignItems: 'center'
        }}
      >
        {height === 'collapsed' ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight={500} sx={{ mr: 0.5 }}>
              {filteredCount} {filteredCount === 1 ? 'Service' : 'Services'}
            </Typography>
            <KeyboardArrowUpIcon fontSize="small" />
          </Box>
        ) : (
          <Box
            sx={{
              width: 36,
              height: 4,
              bgcolor: 'rgba(0,0,0,0.1)',
              borderRadius: 2
            }}
          />
        )}
      </Box>

      {/* Title bar */}
      {height !== 'collapsed' && (
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {title} ({filteredCount})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {showResetButton && (
              <Button
                variant="text"
                size="small"
                onClick={onReset}
                startIcon={<RestartAltIcon />}
                sx={{ borderRadius: 4, py: 0.5, px: 1.5 }}
              >
                Reset
              </Button>
            )}
            <IconButton
              size="small"
              onClick={height === 'full' ? toggleHeight : collapseSheet}
              sx={{
                bgcolor: 'rgba(0,0,0,0.04)',
                borderRadius: 1.5,
                width: 28,
                height: 28
              }}
            >
              {height === 'full' ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Services list */}
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