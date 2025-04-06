export interface Service {
  id: number;
  name: string;
  description?: string;
  category?: string;
  latitude: number;
  longitude: number;
  queue_length?: number;
  wait_time?: number;
  service_type?: 'immediate' | 'appointment';
}

export interface ServiceAdmin {
  id: number;
  name: string;
  description: string;
  category?: string;
  location?: string;
  business_hours?: string;
  has_admin?: boolean;
}

export interface ServiceDetailDialogProps {
  open: boolean;
  onClose: () => void;
  service: ServiceAdmin | null;
  onSelect?: (service: ServiceAdmin) => void;
}

export interface ServiceSelectorProps {
  selectedService: ServiceAdmin | null;
  onSelectService: (service: ServiceAdmin | null) => void;
  loading: boolean;
  services: ServiceAdmin[];
  visibleServices: ServiceAdmin[];
  filteredServices: ServiceAdmin[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  visibleStart: number;
  ITEMS_PER_PAGE: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  viewServiceDetails: (service: ServiceAdmin, e?: React.MouseEvent) => void;
  submitting: boolean;
}

export interface ServiceMapProps {
  services: Service[];
  selectedService: Service | null;
  onServiceClick: (service: Service) => void;
  height?: string;
  isMobile?: boolean;
  maxDistance?: number;
  userLocation: { latitude: number; longitude: number } | null;
  onUserLocationChange: (location: { latitude: number; longitude: number } | null) => void;
}

export interface ServiceMarkerProps {
  service: Service;
  onClick: (service: Service) => void;
  isSelected?: boolean;
}

export interface ServiceDetailProps {
  service: Service | null;
  onClose: () => void;
  onTransferClick: (serviceId: number) => void;
  userLocation: { latitude: number; longitude: number } | null;
  canTransfer: boolean;
  activeQueue: any | null;
}

export interface CategoryFilterProps {
  selectedCategory: string;
  onChange: (category: string) => void;
}

export interface ServiceListProps {
  services: Service[];
  loading: boolean;
  selectedService: Service | null;
  onServiceClick: (service: Service) => void;
  onJoinClick: (serviceId: number) => void;
  theme: any;
  emptyMessage?: string;
  onClearFilters?: () => void;
}

export interface ServiceSearchFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder?: string;
}

export interface UseServiceFiltersProps {
  services: Service[];
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}