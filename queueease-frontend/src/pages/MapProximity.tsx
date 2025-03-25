import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Box, Typography, CircularProgress, Alert, Fade, Snackbar, Button
} from '@mui/material';

// Map and service components
import ServiceMap from '../components/map/ServiceMap';
import ServiceCard from '../components/serviceList/ServiceCard';
import BottomSheet from '../components/serviceList/BottomSheet';
import ServiceDetailPanel from '../components/serviceList/ServiceDetailPanel';
import DistanceFilter from '../components/map/DistanceFilter';
import SearchBar from '../components/map/SearchBar';
import CategoryFilter from '../components/map/CategoryFilter';
import { CATEGORIES, generateRandomDublinCoordinates } from '../utils/mapUtils';
import { Service } from '../types/serviceTypes';

interface MapProximityProps {
  apiUrl?: string;
}

const MapProximity: React.FC<MapProximityProps> = ({
  apiUrl = 'http://127.0.0.1:8000/api/list_services/'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [debouncedFilterText, setDebouncedFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false); // Default to hidden for less clutter
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'partial' | 'full'>('partial');
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean,
    message: string,
    severity: "success" | "error" | "info"
  }>({ open: false, message: "", severity: "success" });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2); // Default 2km radius
  const debounceTimerRef = useRef<number | null>(null);

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

    return R * c; // in meters
  }, []);

  // Handlers
  const handleMarkerClick = useCallback((service: Service) => {
    setSelectedService(service);
    if (window.innerWidth < 960) setSheetHeight('partial');
  }, []);

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

  // Handle user location change
  const handleUserLocationChange = useCallback((location: { latitude: number; longitude: number } | null) => {
    setUserLocation(location);
    if (location) {
      localStorage.setItem('userLocation', JSON.stringify(location));
    }
  }, []);

  // Check if there are any active filters
  const hasActiveFilters = useMemo(() => {
    return debouncedFilterText !== "" || selectedCategory !== "All" || searchRadius !== 2;
  }, [debouncedFilterText, selectedCategory, searchRadius]);

  // Filter services based on search, category, and distance
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
      
      return true;
    });
  }, [services, debouncedFilterText, selectedCategory, userLocation, searchRadius, calculateDistance]);

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

  // Load saved user location
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        setUserLocation(JSON.parse(savedLocation));
      } catch (e) {
        console.error('Error parsing saved location', e);
      }
    }
  }, []);

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
      />
    );
  }, [handleJoinQueue, handleMarkerClick, selectedService?.id]);

  // Render service list
  const renderServiceList = useCallback(() => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress size={24} /></Box>;
    }

    if (filteredServices.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', my: 4, px: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No services match your criteria
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2, borderRadius: 2 }}
            onClick={handleResetFilters}
            size="small"
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
        }}
      >
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
        {/* Distance Filter (only shown when user location is available) */}
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
      title="Nearby Services"
      filteredCount={filteredServices.length}
      showResetButton={hasActiveFilters}
      onReset={handleResetFilters}
    >
      {renderServiceList()}
    </BottomSheet>

    {/* Selected service detail panel */}
    <ServiceDetailPanel
      service={selectedService}
      onClose={() => setSelectedService(null)}
      onJoinQueue={handleJoinQueue}
      userLocation={userLocation}
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
  </Box>
);
};

export default React.memo(MapProximity);