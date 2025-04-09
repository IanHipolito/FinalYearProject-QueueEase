import React, { act } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ServiceSelector from '../../../components/admin/ServiceSelector';
import '@testing-library/jest-dom';

// Mock console.error to suppress Material-UI DOM nesting warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning: validateDOMNesting/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

const mockServices = [
  {
    id: 1,
    name: 'Hospital Service',
    description: 'Hospital service description',
    category: 'Healthcare',
    location: 'City Center',
    has_admin: false
  },
  {
    id: 2,
    name: 'Bank Service',
    description: 'Banking service description',
    category: 'Finance',
    location: 'Downtown',
    has_admin: false
  },
  {
    id: 3,
    name: 'Cafe Service',
    description: 'Cafe service description',
    category: 'Food',
    location: 'Mall',
    has_admin: true
  }
];

describe('ServiceSelector Component', () => {
  const mockOnSelectService = jest.fn();
  const mockViewServiceDetails = jest.fn();
  const mockSetSearchQuery = jest.fn();
  const mockOnScroll = jest.fn();

  const defaultProps = {
    selectedService: null,
    onSelectService: mockOnSelectService,
    loading: false,
    services: mockServices,
    visibleServices: mockServices.slice(0, 2),
    filteredServices: mockServices,
    searchQuery: '',
    setSearchQuery: mockSetSearchQuery,
    visibleStart: 0,
    ITEMS_PER_PAGE: 10,
    onScroll: mockOnScroll,
    viewServiceDetails: mockViewServiceDetails,
    submitting: false
  };

  beforeEach(() => {
    mockOnSelectService.mockClear();
    mockViewServiceDetails.mockClear();
    mockSetSearchQuery.mockClear();
    mockOnScroll.mockClear();
  });

  test('renders button to choose service when no service is selected', () => {
    render(<ServiceSelector {...defaultProps} />);
    
    const button = screen.getByText('Choose a service to manage');
    expect(button).toBeInTheDocument();
  });

  test('renders loading state correctly', () => {
    render(<ServiceSelector {...defaultProps} loading={true} />);
    
    const loadingButton = screen.getByText('Loading services...');
    expect(loadingButton).toBeInTheDocument();
    expect(loadingButton).toBeDisabled();
  });

  test('renders selected service details when a service is selected', () => {
    render(
      <ServiceSelector 
        {...defaultProps} 
        selectedService={mockServices[0]} 
      />
    );
    
    expect(screen.getByText('Hospital Service')).toBeInTheDocument();
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
    expect(screen.getByText('City Center')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  test('opens dialog when choose service button is clicked', () => {
    render(<ServiceSelector {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Choose a service to manage'));
    
    // Dialog should be open with title
    expect(screen.getByText('Select a Service')).toBeInTheDocument();
    // Input field should be present
    expect(screen.getByPlaceholderText('Search by name, category or location')).toBeInTheDocument();
  });

  test('shows visible services in the dialog list', () => {
    render(<ServiceSelector {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Choose a service to manage'));
    
    // Should show visible services
    expect(screen.getByText('Hospital Service')).toBeInTheDocument();
    expect(screen.getByText('Bank Service')).toBeInTheDocument();
  });

  test('handles search query changes', () => {
    render(<ServiceSelector {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Choose a service to manage'));
    
    const searchInput = screen.getByPlaceholderText('Search by name, category or location');
    fireEvent.change(searchInput, { target: { value: 'hospital' } });
    
    expect(mockSetSearchQuery).toHaveBeenCalledWith('hospital');
  });

  test('calls viewServiceDetails when Details button is clicked', () => {
    render(
      <ServiceSelector 
        {...defaultProps} 
        selectedService={mockServices[0]} 
      />
    );
    
    fireEvent.click(screen.getByText('Details'));
    
    expect(mockViewServiceDetails).toHaveBeenCalledWith(mockServices[0], expect.anything());
  });

  test('calls onSelectService with null when Change button is clicked', () => {
    render(
      <ServiceSelector 
        {...defaultProps} 
        selectedService={mockServices[0]} 
      />
    );
    
    fireEvent.click(screen.getByText('Change'));
    
    expect(mockOnSelectService).toHaveBeenCalledWith(null);
  });

  test('calls onSelectService when a service is selected from dialog', () => {
    render(<ServiceSelector {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Choose a service to manage'));
    
    // Find the first list item and click it
    const listItems = screen.getAllByRole('button');
    const firstServiceItem = listItems.find(item => within(item).queryByText('Hospital Service'));
    
    if (firstServiceItem) {
      fireEvent.click(firstServiceItem);
      expect(mockOnSelectService).toHaveBeenCalledWith(mockServices[0]);
    } else {
      throw new Error('Service item not found');
    }
  });

  test('renders ServiceListSkeleton when loading services in dialog', async () => {
    // Use render result's rerender method
    const { rerender } = render(<ServiceSelector {...defaultProps} />);
    
    // Use act when triggering events
    await act(async () => {
      fireEvent.click(screen.getByText('Choose a service to manage'));
    });
    
    // Wrap rerender in act
    await act(async () => {
      rerender(<ServiceSelector {...defaultProps} loading={true} />);
    });
    
    // Check for progress indicators
    const progressIndicators = screen.getAllByRole('progressbar');
    expect(progressIndicators.length).toBeGreaterThan(0);
  });

  test('renders empty state when no services match search query', () => {
    render(
      <ServiceSelector 
        {...defaultProps} 
        filteredServices={[]}
        searchQuery="nonexistent"
      />
    );
    
    fireEvent.click(screen.getByText('Choose a service to manage'));
    
    expect(screen.getByText('No matching services found')).toBeInTheDocument();
  });

  test('renders empty state when no services are available', () => {
    render(
      <ServiceSelector 
        {...defaultProps} 
        filteredServices={[]}
        searchQuery=""
      />
    );
    
    fireEvent.click(screen.getByText('Choose a service to manage'));
    
    expect(screen.getByText('No services available for registration')).toBeInTheDocument();
  });
});