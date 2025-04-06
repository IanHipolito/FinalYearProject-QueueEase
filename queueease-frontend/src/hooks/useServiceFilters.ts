import { useState, useEffect, useCallback, useMemo } from 'react';
import { Service, UseServiceFiltersProps } from '../types/serviceTypes';

interface UseServiceFiltersReturn {
  filterText: string;
  setFilterText: React.Dispatch<React.SetStateAction<string>>;
  debouncedFilterText: string;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  searchRadius: number;
  setSearchRadius: React.Dispatch<React.SetStateAction<number>>;
  filteredServices: Service[];
  handleResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const useServiceFilters = ({
  services,
  calculateDistance
}: UseServiceFiltersProps): UseServiceFiltersReturn => {
  // Filter states
  const [filterText, setFilterText] = useState("");
  const [debouncedFilterText, setDebouncedFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchRadius, setSearchRadius] = useState(2); // Default 2km radius
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterText(filterText);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [filterText]);

  // Get user location from localStorage if available
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

  // Update userLocation when it changes elsewhere in the app
  const updateUserLocation = useCallback((location: { latitude: number; longitude: number } | null) => {
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

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setFilterText("");
    setSelectedCategory("All");
    setSearchRadius(2);
  }, []);

  return {
    filterText,
    setFilterText,
    debouncedFilterText,
    selectedCategory,
    setSelectedCategory,
    searchRadius,
    setSearchRadius,
    filteredServices,
    handleResetFilters,
    hasActiveFilters
  };
};

export default useServiceFilters;