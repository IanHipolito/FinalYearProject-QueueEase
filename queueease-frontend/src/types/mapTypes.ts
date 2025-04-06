export interface CategoryFilterProps {
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
}

export interface DistanceFilterProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

export interface SearchBarProps {
  filterText: string;
  onFilterTextChange: (text: string) => void;
  showFilters: boolean;
  toggleFilters: () => void;
  hasActiveFilters: boolean;
  children?: React.ReactNode;
}

export interface BottomSheetProps {
  height: 'collapsed' | 'partial' | 'full';
  toggleHeight: () => void;
  collapseSheet: () => void;
  title: string;
  filteredCount: number;
  showResetButton: boolean;
  onReset: () => void;
  children: React.ReactNode;
}

export interface ServiceCardProps {
    service: {
      id: number;
      name: string;
      description?: string;
      category?: string;
      wait_time?: number;
      queue_length?: number;
      service_type?: 'immediate' | 'appointment';
    };
    isSelected?: boolean;
    onCardClick: (service: any) => void;
    onJoinClick?: (serviceId: number) => void;
    onTransferClick?: (serviceId: number) => void;
    showTransferButton?: boolean;
    theme?: any;
}

export interface RouteInfo {
    type: 'walking' | 'driving' | 'cycling';
    distance: string;
    duration: string;
    loading: boolean;
}