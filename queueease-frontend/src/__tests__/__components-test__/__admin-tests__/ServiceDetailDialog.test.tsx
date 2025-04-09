import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ServiceDetailDialog from '../../../components/admin/ServiceDetailDialog';
import '@testing-library/jest-dom';

const mockService = {
  id: 1,
  name: 'Test Service',
  description: 'This is a test service description',
  category: 'Healthcare',
  location: 'Downtown Test Location',
  business_hours: 'Mon-Fri: 9am-5pm',
  has_admin: false
};

describe('ServiceDetailDialog Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSelect.mockClear();
  });

  test('renders correctly with service details', () => {
    render(
      <ServiceDetailDialog
        open={true}
        onClose={mockOnClose}
        service={mockService}
        onSelect={mockOnSelect}
      />
    );

    // Check title
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    
    // Check location highlight
    expect(screen.getByText(/Located at:/)).toBeInTheDocument();
    // Using getAllByText instead of getByText since there are multiple instances
    expect(screen.getAllByText('Downtown Test Location', { exact: false }).length).toBeGreaterThan(0);
    
    // Check description
    expect(screen.getByText(/This is a test service description/)).toBeInTheDocument();

    // Check service details
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Business Hours')).toBeInTheDocument();
    expect(screen.getByText('Mon-Fri: 9am-5pm')).toBeInTheDocument();
    
    // Check footer note
    expect(screen.getByText(/You'll be able to manage this service's queue system/)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.getByText('Select This Service')).toBeInTheDocument();
  });

  test('handles service with minimal details', () => {
    const minimalService = {
      id: 2,
      name: 'Minimal Service',
      description: '',
      has_admin: false
    };

    render(
      <ServiceDetailDialog
        open={true}
        onClose={mockOnClose}
        service={minimalService}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Minimal Service')).toBeInTheDocument();
    expect(screen.getByText('No description available.')).toBeInTheDocument();
    
    // These elements should not be present
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
    expect(screen.queryByText('Location')).not.toBeInTheDocument();
    expect(screen.queryByText('Business Hours')).not.toBeInTheDocument();
  });

  test('does not show select button if service has admin', () => {
    const serviceWithAdmin = {
      ...mockService,
      has_admin: true
    };

    render(
      <ServiceDetailDialog
        open={true}
        onClose={mockOnClose}
        service={serviceWithAdmin}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.queryByText('Select This Service')).not.toBeInTheDocument();
  });

  test('calls onClose when Close button is clicked', () => {
    render(
      <ServiceDetailDialog
        open={true}
        onClose={mockOnClose}
        service={mockService}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onSelect when Select This Service button is clicked', () => {
    render(
      <ServiceDetailDialog
        open={true}
        onClose={mockOnClose}
        service={mockService}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('Select This Service'));
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(mockService);
  });

  test('does not render when service is null', () => {
    const { container } = render(
      <ServiceDetailDialog
        open={true}
        onClose={mockOnClose}
        service={null}
        onSelect={mockOnSelect}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});