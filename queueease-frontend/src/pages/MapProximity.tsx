import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import {
  Box, Typography, CircularProgress, Alert, Fade, Snackbar, Button, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import ServiceMap from '../components/map/ServiceMap';
import ServiceCard from '../components/serviceList/ServiceCard';
import BottomSheet from '../components/serviceList/BottomSheet';
import ServiceDetailPanel from '../components/serviceList/ServiceDetailPanel';
import DistanceFilter from '../components/map/DistanceFilter';
import SearchBar from '../components/map/SearchBar';
import CategoryFilter from '../components/map/CategoryFilter';
import { generateRandomDublinCoordinates, DUBLIN_CENTER, DUBLIN_BOUNDS } from '../utils/mapUtils';
import { Service } from '../types/serviceTypes';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { UserMainPageQueue } from '../types/queueTypes';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

const MapProximity: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Services and UI states
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [debouncedFilterText, setDebouncedFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'partial' | 'full'>('partial');
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean,
    message: string,
    severity: "success" | "error" | "info" | "warning"
  }>({ open: false, message: "", severity: "success" });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2); // Default 2km radius
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  
  // Add new state variables for transfer functionality
  const [activeQueue, setActiveQueue] = useState<UserMainPageQueue | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState<boolean>(false);
  const [targetService, setTargetService] = useState<Service | null>(null);
  const [transferring, setTransferring] = useState<boolean>(false);
  const [ignoreActiveQueueFilter, setIgnoreActiveQueueFilter] = useState<boolean>(false);

  // Refs for stable references
  const serviceListRef = useRef<HTMLDivElement>(null);
  const debounceFilterRef = useRef<ReturnType<typeof debounce>>();
  const activeQueueInterval = useRef<number | null>(null);

  // Calculate distance between two points (haversine formula)
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Fetch the active queue for the logged-in user
  useEffect(() => {
    if (!user) return;

    const fetchActiveQueue = async () => {
      try {
        const res = await API.queues.getActive(user.id);

        if (!res.ok) {
          setActiveQueue(null);
          return;
        }

        const data = await res.json();

        if (data && data.queue_id) {
          // Get detailed queue information
          const detailRes = await API.queues.getDetails(data.queue_id);
          if (detailRes.ok) {
            const detailData = await detailRes.json();

            if (detailData.status === 'pending') {
              setActiveQueue({
                id: data.queue_id,
                service_id: detailData.service_id || data.service_id,
                service_name: detailData.service_name || data.service_name,
                position: data.position || detailData.current_position,
                expected_ready_time: data.expected_ready_time || detailData.expected_ready_time,
                status: 'pending',
                time_created: detailData.time_created || new Date().toISOString(),
              });
            } else {
              setActiveQueue(null);
            }
          }
        } else {
          setActiveQueue(null);
        }
      } catch (error) {
        console.error("Error fetching active queue:", error);
        setActiveQueue(null);
      }
    };

    fetchActiveQueue();

    // Refresh active queue every 15 seconds
    activeQueueInterval.current = window.setInterval(fetchActiveQueue, 15000);
    return () => {
      if (activeQueueInterval.current) {
        clearInterval(activeQueueInterval.current);
        activeQueueInterval.current = null;
      }
    };
  }, [user]);

  const isEligibleForTransfer = useCallback((service: Service) => {
    if (!activeQueue || !activeQueue.service_name || !activeQueue.id) return false;

    const creationTime = new Date(activeQueue.time_created || '').getTime();
    const now = new Date().getTime();
    const twoMinutesInMs = 2 * 60 * 1000;
    const isWithin2Minutes = now - creationTime < twoMinutesInMs;

    return isWithin2Minutes &&
      service.name === activeQueue.service_name &&
      service.id !== activeQueue.service_id &&
      service.service_type === 'immediate';
  }, [activeQueue]);

  const handleTransferClick = useCallback((service: Service) => {
    if (!activeQueue || !user) return;

    setTargetService(service);
    setTransferDialogOpen(true);
  }, [activeQueue, user]);

  const handleMarkerClick = useCallback((service: Service) => {
    if (isEligibleForTransfer(service)) {
      handleTransferClick(service);
    } else {
      setSelectedService(service);
      if (window.innerWidth < 960) setSheetHeight('partial');
    }
  }, [isEligibleForTransfer, handleTransferClick]);

  // Handle transfer confirmation
  const handleConfirmTransfer = async () => {
    if (!activeQueue || !targetService || !user) return;

    setTransferring(true);

    try {
      const response = await API.queues.transferQueue(
        activeQueue.id!,
        targetService.id,
        user.id
      );

      if (response.ok) {
        const data = await response.json();

        setSnackbarState({
          open: true,
          message: 'Queue transferred successfully!',
          severity: 'success'
        });

        // Update the active queue with the new queue information
        setActiveQueue({
          id: data.queue_id,
          service_id: targetService.id,
          service_name: targetService.name,
          position: data.position,
          expected_ready_time: data.expected_ready_time,
          status: 'pending',
          time_created: activeQueue.time_created,
        });

        // Navigate to the success page for the new queue
        navigate(`/success/${data.queue_id}`);
      } else {
        const errorData = await response.json();
        setSnackbarState({
          open: true,
          message: errorData.error || 'Failed to transfer queue',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error("Error transferring queue:", error);
      setSnackbarState({
        open: true,
        message: 'An error occurred while transferring the queue',
        severity: 'error'
      });
    } finally {
      setTransferring(false);
      setTransferDialogOpen(false);
    }
  };

  // Convert coordinates to numbers and store in state
  const handleUserLocationChange = useCallback((location: { latitude: number; longitude: number } | null) => {
    if (location) {
      const parsedLoc = {
        latitude: Number(location.latitude),
        longitude: Number(location.longitude)
      };
      setUserLocation(parsedLoc);
    } else {
      setUserLocation(null);
    }
  }, []);

  // Geolocation get user's current location
  const getUserLocation = useCallback(() => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      fallbackToDublinCenter();
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Update state without saving to localStorage
          setUserLocation({ latitude, longitude });
          setLocationLoading(false);
        } catch (error) {
          console.error('Error processing user location:', error);
          fallbackToDublinCenter();
        }
      },
      (error) => {
        let errorMsg = 'Unknown error getting location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'User denied the request for geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to get user location timed out';
            break;
        }
        console.error('Geolocation error:', errorMsg);
        setSnackbarState({
          open: true,
          message: `Using Dublin center as fallback location. ${errorMsg}`,
          severity: 'info'
        });
        fallbackToDublinCenter();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
    
    // Helper function to use Dublin center as fallback
    function fallbackToDublinCenter() {
      console.log('Using Dublin center as fallback');
      // Using DUBLIN_CENTER from imported constants
      const dublinCenter = { 
        latitude: DUBLIN_CENTER[1], 
        longitude: DUBLIN_CENTER[0] 
      };
      
      setUserLocation(dublinCenter);
      setLocationLoading(false);
    }
  }, []);

  // Get the user's current location on mount if not already set
  useEffect(() => {
    if (!userLocation) {
      getUserLocation();
    }
  }, [userLocation, getUserLocation]);

  // Check if there are any active filters
  const hasActiveFilters = useMemo(() => {
    return debouncedFilterText !== "" || selectedCategory !== "All" || searchRadius !== 2 || ignoreActiveQueueFilter;
  }, [debouncedFilterText, selectedCategory, searchRadius, ignoreActiveQueueFilter]);

  // Filter services based on search, category, distance, and transferability with memoization
  const filteredServices = useMemo(() => {
    if (!services.length) return [];

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

      // Distance filter
      if (userLocation && searchRadius > 0) {
        const distanceInMeters = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          service.latitude,
          service.longitude
        );

        // Convert distance to kilometers and compare with searchRadius
        if (distanceInMeters / 1000 > searchRadius) {
          return false;
        }
      }

      // Filter for transferable services if there's an active queue and not ignoring the filter
      if (activeQueue && activeQueue.service_name && !ignoreActiveQueueFilter) {
        // If we have an active queue, only show eligible services for transfer
        return isEligibleForTransfer(service);
      }

      return true;
    });
  }, [
    services, 
    debouncedFilterText, 
    selectedCategory, 
    userLocation, 
    searchRadius, 
    calculateDistance, 
    activeQueue, 
    isEligibleForTransfer, 
    ignoreActiveQueueFilter
  ]);

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
        const response = await API.services.list();
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.status}`);
        }

        let data = await response.json();

        // Data processing with a single-pass transformation
        data = data.map((service: Service) => {
          const newService = {
            ...service,
            subcategory: ''
          };

          // Add coordinates if missing
          if (!newService.latitude || !newService.longitude) {
            const { latitude, longitude } = generateRandomDublinCoordinates();
            newService.latitude = latitude;
            newService.longitude = longitude;
          }

          // Categorize fast food places
          if ( newService.category && newService.category.toLowerCase() === 'fast_food') {
            newService.category = 'fast_food';
            newService.subcategory = 'fast_food';
          }

          // Categorize healthcare places
          if ((newService.category && newService.category.toLowerCase().includes('health')) ||
            (newService.category && newService.category.toLowerCase().includes('clinic')) ||
            (newService.category && newService.category.toLowerCase().includes('doctor')) ||
            (newService.category && newService.category.toLowerCase().includes('hospital'))) {
            newService.category = 'healthcare';
          }

          // Default category
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
  }, []);

  // Debounce search text with proper cleanup
  useEffect(() => {
    // Create debounced function only once
    if (!debounceFilterRef.current) {
      debounceFilterRef.current = debounce((value: string) => {
        setDebouncedFilterText(value);
      }, 300);
    }

    // Call the debounced function with current value
    debounceFilterRef.current(filterText);

    // Cleanup
    return () => {
      debounceFilterRef.current?.cancel();
    };
  }, [filterText]);

  // Setup scroll listener with passive flag for better performance
  useEffect(() => {
    // Reset visible count when filters change
    setVisibleCount(10);

    // Setup scroll listener for the service list container
    const container = document.querySelector('.service-list-container');
    if (container) {
      const handleScroll = throttle((e: Event) => {
        const target = e.target as HTMLElement;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
          setVisibleCount(prev => Math.min(prev + 5, filteredServices.length));
        }
      }, 100);

      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [filteredServices.length]);

  // Bottom sheet control with memoized callbacks
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

  // Toggle filters visibility
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarState(prev => ({ ...prev, open: false }));
  }, []);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setFilterText("");
    setSelectedCategory("All");
    setSearchRadius(2);
    // If user wants to see all services, temporarily disable active queue filtering
    if (activeQueue) {
      setIgnoreActiveQueueFilter(true);
    }
  }, [activeQueue]);

  // Handle join queue - only for appointment services
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

      // Only for appointment services
      if (serviceToJoin.service_type === 'appointment') {
        navigate(`/book-appointment/${serviceId}`);
      }
    } catch (err) {
      console.error('Error handling queue action:', err);
      setSnackbarState({
        open: true,
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  }, [navigate, user, services]);

  const renderServiceRow = useCallback((service: Service) => {
    const isSelected = selectedService?.id === service.id;
    const canTransfer = isEligibleForTransfer(service);

    return (
      <ServiceCard
        key={service.id}
        service={service}
        isSelected={isSelected}
        onCardClick={handleMarkerClick}
        showTransferButton={canTransfer}
        onTransferClick={() => handleTransferClick(service)}
        onJoinClick={service.service_type === 'appointment' ? handleJoinQueue : undefined}
      />
    );
  }, [selectedService, isEligibleForTransfer, handleTransferClick, handleMarkerClick, handleJoinQueue]);

  // Render service list
  const renderServiceList = useCallback(() => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress size={24} /></Box>;
    }

    if (filteredServices.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', my: 4, px: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {activeQueue && !ignoreActiveQueueFilter
              ? "No transferable services found within your radius"
              : "No services match your criteria"}
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2, borderRadius: 2 }}
            onClick={handleResetFilters}
            size="small"
          >
            {activeQueue && !ignoreActiveQueueFilter
              ? "Show all services"
              : "Clear filters"}
          </Button>
        </Box>
      );
    }

    return visibleServices.map(renderServiceRow);
  }, [
    filteredServices, 
    handleResetFilters, 
    loading, 
    renderServiceRow, 
    visibleServices, 
    activeQueue, 
    ignoreActiveQueueFilter
  ]);

  // Render transfer dialog
  const renderTransferDialog = useCallback(() => (
    <Dialog
      open={transferDialogOpen}
      onClose={() => !transferring && setTransferDialogOpen(false)}
    >
      <DialogTitle>Transfer Queue?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to transfer your queue from {activeQueue?.service_name} to {targetService?.name}?
          This action cannot be undone.
        </DialogContentText>
        <Box sx={{
          mt: 2,
          p: 2,
          bgcolor: 'rgba(25, 118, 210, 0.1)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center'
        }}>
          <SwapHorizIcon sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="body2">
            You will keep your place in line relative to the new location's queue.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setTransferDialogOpen(false)}
          color="primary"
          disabled={transferring}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirmTransfer}
          color="primary"
          variant="contained"
          disabled={transferring}
          startIcon={transferring ? <CircularProgress size={16} color="inherit" /> : <SwapHorizIcon />}
        >
          {transferring ? 'Transferring...' : 'Transfer Queue'}
        </Button>
      </DialogActions>
    </Dialog>
  ), [transferDialogOpen, transferring, activeQueue?.service_name, targetService?.name]);

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
          pointerEvents: 'auto',
          willChange: 'transform',
        }}
      >
        {/* Service Map */}
        <ServiceMap
          services={filteredServices}
          selectedService={selectedService}
          onServiceClick={handleMarkerClick}
          height="100%"
          isMobile={window.innerWidth < 960}
          maxDistance={searchRadius}
          userLocation={userLocation}
          onUserLocationChange={handleUserLocationChange}
        />
      </Box>
      
      {/* Search and filter components */}
      <SearchBar
        filterText={filterText}
        onFilterTextChange={setFilterText}
        showFilters={showFilters}
        toggleFilters={toggleFilters}
        hasActiveFilters={hasActiveFilters}
      >
        {/* Distance Filter */}
        {userLocation && (
          <DistanceFilter
            value={searchRadius}
            onChange={setSearchRadius}
            min={0.5}
            max={10}
            step={0.5}
          />
        )}

        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </SearchBar>

      {/* Bottom sheet UI */}
      <BottomSheet
        height={sheetHeight}
        toggleHeight={toggleSheetHeight}
        collapseSheet={collapseSheet}
        title={activeQueue && !ignoreActiveQueueFilter ? "Transferable Services" : "Nearby Services"}
        filteredCount={filteredServices.length}
        showResetButton={hasActiveFilters}
        onReset={handleResetFilters}
      >
        {renderServiceList()}
      </BottomSheet>

      {/* User Location Button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 100,
          right: 16,
          zIndex: 10
        }}
      >
        <Button
          variant="contained"
          size="small"
          onClick={getUserLocation}
          disabled={locationLoading}
          title="Find my location"
          sx={{
            minWidth: '44px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: locationLoading ? '#f0f0f0' : 'white',
            color: '#FF0000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            },
            transition: 'transform 0.2s ease',
            '&:active': {
              transform: 'scale(0.95)'
            },
            willChange: 'transform'
          }}
        >
          {locationLoading ? (
            <CircularProgress size={24} color="error" /> 
          ) : (
            <MyLocationIcon fontSize="medium" />
          )}
        </Button>
      </Box>

      {/* Selected service detail panel */}
      <ServiceDetailPanel
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onTransferClick={(serviceId) => handleTransferClick(
          services.find(s => s.id === serviceId) || selectedService!
        )}
        userLocation={userLocation}
        canTransfer={selectedService ? isEligibleForTransfer(selectedService) : false}
        activeQueue={activeQueue}
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
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            padding: 2,
            borderRadius: 2,
            zIndex: 30,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          <CircularProgress size={24} color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="body2" fontWeight={500}>
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
              top: 70,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 25,
              maxWidth: '90%',
              boxShadow: 2,
              borderRadius: 1
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
          sx={{ width: '100%', borderRadius: 1 }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>

      {/* Transfer confirmation dialog */}
      {renderTransferDialog()}
    </Box>
  );
};

export default React.memo(MapProximity);