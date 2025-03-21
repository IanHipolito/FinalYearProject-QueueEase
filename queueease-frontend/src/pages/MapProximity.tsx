import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Box, Typography, TextField, InputAdornment, Chip, useTheme, 
  useMediaQuery, CircularProgress, Alert, Fade, Snackbar, 
  Divider, Paper, IconButton, Collapse, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Map and service components
import ServiceMap from '../components/map/ServiceMap';
import ServiceCard from '../components/serviceList/ServiceCard';
import BottomSheet from '../components/serviceList/BottomSheet';
import ServiceDetailPanel from '../components/serviceList/ServiceDetailPanel';
import { getCategoryIcon } from '../components/map/mapUtils';

// Utils
import { CATEGORIES, generateRandomDublinCoordinates } from '../utils/mapUtils';
import { Service } from '../types/serviceTypes';

interface MapProximityProps {
  apiUrl?: string;
}

const MapProximity: React.FC<MapProximityProps> = ({
  apiUrl = 'http://127.0.0.1:8000/api/list_services/'
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const debounceTimerRef = useRef<number | null>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [debouncedFilterText, setDebouncedFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'partial' | 'full'>('partial');
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean,
    message: string,
    severity: "success" | "error" | "info"
  }>({ open: false, message: "", severity: "success" });

  // Handlers
  const handleMarkerClick = useCallback((service: Service) => {
    setSelectedService(service);
    if (isMobile) setSheetHeight('partial');
  }, [isMobile]);

  const handleJoinQueue = useCallback(async (serviceId: number) => {
    if (!user) {
      navigate('/login', { state: { from: '/mapproximity', service: serviceId } });
      return;
    }

    try {
      const serviceToJoin = services.find(s => s.id === serviceId);
      if (!serviceToJoin) {
        throw new Error('Service not found');
      }

      // Check if this is a service that requires appointments
      if (serviceToJoin.service_type === 'appointment') {
        // Route to booking page for appointment-based services
        navigate(`/book-appointment/${serviceId}`);
        return;
      }

      // For immediate services, create a queue entry
      setSnackbarState({
        open: true,
        message: "Creating your queue entry...",
        severity: "info"
      });

      const response = await fetch("http://127.0.0.1:8000/api/create-queue/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          service_id: serviceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create queue: ${response.status}`);
      }

      const data = await response.json();
      setSnackbarState({
        open: true,
        message: "Successfully joined queue!",
        severity: "success"
      });

      // Navigate to QR code screen with the queue ID
      navigate(`/qrcodescreen/${data.queue_id}`);
    } catch (err) {
      console.error('Error joining queue:', err);
      setSnackbarState({
        open: true,
        message: `Failed to join queue: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  }, [navigate, user, services]);

  // Filter services based on search and category
  const filteredServices = useMemo(() => {
    if (!debouncedFilterText && selectedCategory === "All") {
      return services;
    }

    return services.filter(service => {
      // Text filter
      if (debouncedFilterText) {
        const searchText = debouncedFilterText.toLowerCase();
        const serviceName = service.name?.toLowerCase() || '';
        const serviceCategory = service.category?.toLowerCase() || '';
        const serviceDesc = service.description?.toLowerCase() || '';

        if (!(
          serviceName.includes(searchText) ||
          serviceCategory.includes(searchText) ||
          serviceDesc.includes(searchText)
        )) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "All") {
        const serviceCategory = service.category?.toLowerCase() || '';
        const serviceName = service.name?.toLowerCase() || '';

        if (selectedCategory.toLowerCase() === 'healthcare') {
            return ["healthcare", "hospital", "doctors", "clinic", "dentist", "medical"].some(term =>
              serviceCategory.includes(term) || serviceName.includes(term)
            );
        }

        return serviceCategory === selectedCategory.toLowerCase();
      }

      return true;
    });
  }, [services, debouncedFilterText, selectedCategory]);

  // Get visible services for the list
  const visibleServices = useMemo(() => {
    if (sheetHeight === 'collapsed') return [];
    const MAX_VISIBLE = visibleCount;
    return filteredServices.slice(0, MAX_VISIBLE);
  }, [filteredServices, sheetHeight, visibleCount]);

  // Fetch services data
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.status}`);
        }

        let data = await response.json();

        data = data.map((service: Service) => {
          const newService = { 
            ...service,
            subcategory: ''
          };

          if (!newService.latitude || !newService.longitude) {
            const { latitude, longitude } = generateRandomDublinCoordinates();
            newService.latitude = latitude;
            newService.longitude = longitude;
          }

          const nameLower = newService.name?.toLowerCase() || '';
          if (
            nameLower.includes('mcdonald') ||
            nameLower.includes('burger king') ||
            nameLower.includes('kfc') ||
            nameLower.includes('subway') ||
            nameLower.includes('wendy') ||
            nameLower.includes('taco bell') ||
            nameLower.includes('domino') ||
            nameLower.includes('pizza hut') ||
            nameLower.includes('chipotle') ||
            (newService.category && newService.category.toLowerCase() === 'fast_food')
          ) {
            newService.category = 'fast_food';
            newService.subcategory = 'fast_food';
          }

          if ((newService.category && newService.category.toLowerCase().includes('health')) ||
            (newService.category && newService.category.toLowerCase().includes('clinic')) ||
            (newService.category && newService.category.toLowerCase().includes('doctor')) ||
            (newService.category && newService.category.toLowerCase().includes('hospital'))) {
            newService.category = 'healthcare';
          }

          if (!newService.category) {
            newService.category = 'other';
          }

          return newService;
        });

        setServices(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching services:', err);
        setLoading(false);
      }
    };

    fetchServices();
  }, [apiUrl]);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterText(filterText);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [filterText]);

  // Setup scroll listener
  useEffect(() => {
    // Reset visible count when filters change
    setVisibleCount(10);

    // Setup scroll listener for the service list container
    const container = document.querySelector('.service-list-container');
    if (container) {
      const handleScroll = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
          setVisibleCount(prev => Math.min(prev + 5, filteredServices.length));
        }
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [filteredServices.length]);

  // Bottom sheet control
  const toggleSheetHeight = useCallback(() => {
    setSheetHeight(prev => {
      if (prev === 'collapsed') return 'partial';
      if (prev === 'partial') return 'full';
      if (prev === 'full') return 'partial';
      return 'partial';
    });
  }, []);

  const collapseSheet = useCallback(() => {
    setSheetHeight('collapsed');
  }, []);

  // Event handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setFilterText("");
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterText("");
    setSelectedCategory("All");
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarState(prev => ({ ...prev, open: false }));
  }, []);

  // Render service row
  const renderServiceRow = useCallback((service: Service) => {
    const isSelected = selectedService?.id === service.id;
    return (
      <ServiceCard
        key={service.id}
        service={service}
        isSelected={isSelected}
        onCardClick={handleMarkerClick}
        onJoinClick={handleJoinQueue}
        theme={theme}
      />
    );
  }, [handleJoinQueue, handleMarkerClick, selectedService?.id, theme]);

  // Render service list
  const renderServiceList = useCallback(() => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    }

    if (filteredServices.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', my: 4, px: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No services match your criteria
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2, borderRadius: 4 }}
            onClick={handleResetFilters}
          >
            Clear filters
          </Button>
        </Box>
      );
    }

    return visibleServices.map(renderServiceRow);
  }, [filteredServices.length, handleResetFilters, loading, renderServiceRow, visibleServices]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#f8f8f8',
      }}
    >
      {/* Map Container */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          transform: 'translateZ(0)',
          willChange: 'transform',
          WebkitBackfaceVisibility: 'hidden',
          WebkitPerspective: 1000,
        }}
      >
        <ServiceMap
          services={services}
          selectedService={selectedService}
          onServiceClick={handleMarkerClick}
          height="100%"
          isMobile={isMobile}
        />
      </Box>

      {/* Search bar at top */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <IconButton
            sx={{ mx: 1 }}
            onClick={() => navigate('/usermainpage')}
          >
            <ArrowBackIcon />
          </IconButton>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search services..."
            value={filterText}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: filterText ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                py: 0.5,
                '& fieldset': { border: 'none' }
              }
            }}
          />

          <Divider orientation="vertical" flexItem />

          <IconButton
            color={selectedCategory !== "All" ? "primary" : "default"}
            sx={{ mx: 1 }}
            onClick={toggleFilters}
          >
            <FilterAltIcon />
          </IconButton>
        </Paper>

        {/* Horizontal category chips */}
        <Collapse in={showFilters}>
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 1,
              pb: 1,
              '&::-webkit-scrollbar': {
                height: 4,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: 4,
              }
            }}
          >
            {CATEGORIES.map((category) => (
              <Chip
                key={category.id}
                icon={category.id !== "All" ? getCategoryIcon(category.id) : undefined}
                label={category.label}
                clickable
                color={selectedCategory === category.id ? "primary" : "default"}
                onClick={() => setSelectedCategory(category.id)}
                sx={{
                  borderRadius: 3,
                  py: 0.5,
                  px: 0.5,
                  border: '1px solid',
                  borderColor: selectedCategory === category.id ? 'primary.main' : 'rgba(0,0,0,0.1)',
                  '&.MuiChip-colorPrimary': {
                    bgcolor: theme.palette.primary.main,
                  }
                }}
              />
            ))}
          </Box>
        </Collapse>
      </Box>

      {/* Bottom sheet UI */}
      <BottomSheet
        height={sheetHeight}
        toggleHeight={toggleSheetHeight}
        collapseSheet={collapseSheet}
        title="Nearby Services"
        filteredCount={filteredServices.length}
        showResetButton={selectedCategory !== "All" || filterText !== ""}
        onReset={handleResetFilters}
      >
        {renderServiceList()}
      </BottomSheet>

      {/* Selected service detail panel */}
      <ServiceDetailPanel
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onJoinQueue={handleJoinQueue}
      />

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            padding: 3,
            borderRadius: 2,
            zIndex: 30
          }}
        >
          <CircularProgress size={40} color="primary" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading services...
          </Typography>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Fade in={!!error}>
          <Alert
            severity="error"
            sx={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 25,
              maxWidth: '90%',
              boxShadow: 3,
              borderRadius: 2
            }}
            action={
              <Button color="inherit" size="small" onClick={() => setError(null)}>
                Dismiss
              </Button>
            }
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarState.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default React.memo(MapProximity);