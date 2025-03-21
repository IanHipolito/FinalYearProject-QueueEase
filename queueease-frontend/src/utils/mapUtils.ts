export const DUBLIN_CENTER: [number, number] = [-6.2603, 53.3498];

export const DUBLIN_BOUNDS = {
  north: 53.4,
  south: 53.3,
  east: -6.1,
  west: -6.4
};

export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

export const MARKER_COLORS = {
  default: '#00757F',
  restaurant: '#FF5722',
  fast_food: '#E91E63',
  cafe: '#FF9800',
  bar: '#9C27B0',
  shop: '#795548',
  bank: '#DB9A00',
  attraction: '#4CAF50',
  hotel: '#2196F3',
  healthcare: '#F44336',
};

export const CATEGORIES = [
  { id: "All", label: "All Services" },
  { id: "restaurant", label: "Restaurant" },
  { id: "fast_food", label: "Fast Food" },
  { id: "cafe", label: "Cafe" },
  { id: "bar", label: "Bar" },
  { id: "shop", label: "Shop" },
  { id: "bank", label: "Bank" },
  { id: "attraction", label: "Attraction" },
  { id: "hotel", label: "Hotel" },
  { id: "healthcare", label: "Healthcare" },
];

export const generateRandomDublinCoordinates = () => {
  return {
    latitude: DUBLIN_BOUNDS.south + Math.random() * (DUBLIN_BOUNDS.north - DUBLIN_BOUNDS.south),
    longitude: DUBLIN_BOUNDS.west + Math.random() * (DUBLIN_BOUNDS.east - DUBLIN_BOUNDS.west)
  };
};

export const getCategoryColor = (category: string): string => {
  const lowerCategory = category?.toLowerCase() || '';

  switch (lowerCategory) {
    case 'restaurant':
      return '#FF5722';
    case 'fast_food':
      return '#E91E63';
    case 'cafe':
      return '#FF9800';
    case 'bar':
      return '#9C27B0';
    case 'hotel':
      return '#2196F3';
    case 'bank':
      return '#FFC107';
    case 'shop':
      return '#795548';
    case 'storefront':
      return '#8D6E63';
    case 'attraction':
      return '#4CAF50';
    case 'healthcare':
      return '#F44336';
    default:
      return '#00BCD4';
  }
};