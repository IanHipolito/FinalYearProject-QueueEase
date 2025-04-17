import React, { useMemo, useEffect, useState } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import { QueueProgressAnimationProps } from 'types/queueTypes';

const QueueProgressAnimation: React.FC<QueueProgressAnimationProps> = ({ position }) => {
  const [animationReady, setAnimationReady] = useState(false);
  
  // Position-based flags for styling
  const isNearlyThere = position <= 3;
  const isNext = position === 1;
  
  // Determine color theme based on queue position
  const accentColor = useMemo(() => {
    if (isNext) return '#4caf50';
    if (isNearlyThere) return '#6f42c1';
    return '#3f51b5';
  }, [isNext, isNearlyThere]);

  // Get contextual status message based on position
  const statusMessage = useMemo(() => {
    if (position === 1) return "You're next!";
    if (position <= 3) return "Almost there!";
    if (position <= 10) return "Getting closer...";
    return "Thanks for waiting";
  }, [position]);

  // Initialise animation with small delay for smoother transitions
  useEffect(() => {
    setAnimationReady(false);
    
    const setupTimer = setTimeout(() => {
      setAnimationReady(true);
    }, 300);
    
    return () => {
      clearTimeout(setupTimer);
    };
  }, [position]);
  
  // Define shared styles to reduce duplication
  const iconCircleStyles = {
    width: { xs: 50, sm: 60 },
    height: { xs: 50, sm: 60 },
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    mb: 1,
    position: 'relative'
  };
  
  // User icon styles with rotating border
  const userIconStyles = {
    ...iconCircleStyles,
    backgroundColor: alpha('#fff', 0.15),
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    border: '2px solid',
    borderColor: alpha('#fff', 0.2),
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: -4,
      borderRadius: '50%',
      border: '2px dashed',
      borderColor: alpha('#fff', 0.2),
      opacity: 0.6,
      animation: 'rotate 20s linear infinite'
    }
  };
  
  // Service icon styles with pulsing effect
  const serviceIconStyles = {
    ...iconCircleStyles,
    background: `linear-gradient(135deg, ${alpha('#CBC3E3', 0.8)}, ${alpha('#CBC3E3', 0.4)})`,
    boxShadow: '0 4px 12px rgba(203, 195, 227, 0.4)',
    animation: 'gentle-pulse 3s infinite ease-in-out'
  };
  
  // Icon container styles
  const iconContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };
  
  // Label text styles
  const labelStyles = { 
    color: '#fff', 
    opacity: 0.8, 
    fontSize: { xs: '0.7rem', sm: '0.75rem' } 
  };
  
  // Generate ambient floating particles
  const renderFloatingParticles = () => (
    <Box sx={{
      position: 'absolute',
      inset: 0,
      opacity: 0.3,
      overflow: 'hidden',
      zIndex: 0,
    }}>
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: i % 2 === 0 ? 30 : 20,
            height: i % 2 === 0 ? 30 : 20,
            borderRadius: '50%',
            backgroundColor: alpha(accentColor, 0.2),
            filter: 'blur(8px)',
            left: `${(i + 1) * 15}%`,
            top: `${(i * 10) + 20}%`,
            animation: `floatParticles ${3 + i * 0.5}s infinite ease-in-out ${i * 0.3}s`
          }}
        />
      ))}
    </Box>
  );

  // Render the status indicator
  const renderStatusIndicator = () => (
    <Box sx={{
      position: 'relative',
      zIndex: 5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mb: { xs: 1.5, sm: 2 },
      mt: { xs: 0.5, sm: 0 },
    }}>
      <Box sx={{ 
        backgroundColor: alpha(accentColor, isNearlyThere ? 0.25 : 0.15),
        borderRadius: '12px',
        padding: { xs: '4px 12px', sm: '6px 16px' },
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        transform: isNext ? 'scale(1.05)' : 'scale(1)',
        animation: 'subtlePulse 2s infinite ease-in-out',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Position number */}
        <Box component="span" sx={{ 
          bgcolor: isNearlyThere ? '#4caf50' : '#fff',
          color: isNearlyThere ? '#fff' : '#333',
          borderRadius: '50%',
          width: { xs: 22, sm: 24 },
          height: { xs: 22, sm: 24 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 1,
          fontWeight: 700,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: { xs: '0.8rem', sm: '0.9rem' },
        }}>
          {position}
        </Box>
        
        {/* Status message */}
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            fontWeight: 600,
            color: '#fff',
          }}
        >
          {statusMessage}
        </Typography>
      </Box>
    </Box>
  );

  // Generate moving dots for the path
  const renderMovingDots = () => (
    [...Array(5)].map((_, i) => (
      <Box
        key={i}
        sx={{
          position: 'absolute',
          width: i % 2 === 0 ? { xs: 6, sm: 8 } : { xs: 5, sm: 6 },
          height: i % 2 === 0 ? { xs: 6, sm: 8 } : { xs: 5, sm: 6 },
          borderRadius: '50%',
          backgroundColor: '#CBC3E3',
          top: '50%',
          transform: 'translateY(-50%)',
          left: `${(i * 20) % 100}%`,
          boxShadow: '0 0 8px #CBC3E3',
          animation: `moveDot ${2 + i * 0.7}s infinite ${i * 0.5}s`
        }}
      />
    ))
  );

  // Render user icon
  const renderUserIcon = () => (
    <Box sx={userIconStyles}>
      {position <= 3 ? (
        <EmojiPeopleIcon sx={{ color: '#fff', fontSize: { xs: 26, sm: 30 } }} />
      ) : (
        <PersonIcon sx={{ color: '#fff', fontSize: { xs: 26, sm: 30 } }} />
      )}
    </Box>
  );

  // Render service icon
  const renderServiceIcon = () => (
    <Box sx={serviceIconStyles}>
      <StorefrontIcon sx={{ color: '#CBC3E3', fontSize: { xs: 26, sm: 30 } }} />
    </Box>
  );

  // Render mobile view of icons
  const renderMobileIcons = () => (
    <Box sx={{ 
      display: { xs: 'flex', sm: 'none' },
      width: '100%',
      justifyContent: 'space-between',
      mb: 0.5,
      px: 3,
    }}>
      {/* User icon */}
      <Box sx={iconContainerStyles}>
        {renderUserIcon()}
        <Typography variant="caption" sx={labelStyles}>You</Typography>
      </Box>

      {/* Service icon */}
      <Box sx={iconContainerStyles}>
        {renderServiceIcon()}
        <Typography variant="caption" sx={labelStyles}>Service</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      mt: 3,
      p: { xs: 2, sm: 3 },
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
      backdropFilter: 'blur(12px)',
      backgroundColor: alpha('#1f1f1f', 0.6),
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '1px solid',
      borderColor: alpha(accentColor, 0.3),
      // Define keyframe animations
      '@keyframes floatParticles': {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-15px)' }
      },
      '@keyframes subtlePulse': {
        '0%, 100%': { opacity: 0.85 },
        '50%': { opacity: 1 }
      },
      '@keyframes rotate': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      },
      '@keyframes gentle-pulse': {
        '0%, 100%': { boxShadow: '0 4px 12px rgba(203, 195, 227, 0.4)' },
        '50%': { boxShadow: '0 4px 20px rgba(203, 195, 227, 0.6)' }
      },
      '@keyframes moveDot': {
        '0%': { left: '0%', opacity: 0 },
        '10%': { opacity: 1 },
        '90%': { opacity: 1 },
        '100%': { left: '100%', opacity: 0 }
      },
    }}>
      {/* Background floating particles */}
      {renderFloatingParticles()}
      
      {/* Position and status indicator */}
      {renderStatusIndicator()}

      {/* Main content with responsive layout */}
      <Box sx={{ 
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
      }}>
        {/* Mobile-specific layout for icons */}
        {renderMobileIcons()}

        {/* Desktop view - User icon */}
        <Box sx={{ 
          ...iconContainerStyles,
          display: { xs: 'none', sm: 'flex' },
        }}>
          {renderUserIcon()}
          <Typography variant="caption" sx={labelStyles}>You</Typography>
        </Box>
        
        {/* Path with animated dots */}
        <Box sx={{ 
          flexGrow: 1,
          mx: { xs: 0, sm: 3 },
          position: 'relative',
          height: { xs: 30, sm: 40 },
          display: 'flex',
          alignItems: 'center',
          width: { xs: '100%', sm: 'auto' },
        }}>
          {/* The path line */}
          <Box sx={{ 
            position: 'absolute',
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: alpha('#fff', 0.15),
            borderRadius: 1.5,
          }} />
          
          {/* Animated dots */}
          {renderMovingDots()}
        </Box>

        {/* Desktop view - Service icon */}
        <Box sx={{ 
          ...iconContainerStyles,
          display: { xs: 'none', sm: 'flex' },
        }}>
          {renderServiceIcon()}
          <Typography variant="caption" sx={labelStyles}>Service</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default QueueProgressAnimation;