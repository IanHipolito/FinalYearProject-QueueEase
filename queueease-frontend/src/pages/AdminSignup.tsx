import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, CircularProgress, createTheme } from "@mui/material";
import { debounce } from "lodash";
import { API } from '../services/api';
import { ServiceAdmin } from '../types/serviceTypes';
import FormContainer from '../components/common/FormContainer';
import ServiceSelector from '../components/admin/ServiceSelector';
import ServiceDetailDialog from '../components/admin/ServiceDetailDialog';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6f42c1',
      light: '#8551d9',
      dark: '#5e35b1'
    }
  }
});

const AdminSignup: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    serviceId: ""
  });
  
  // Services state
  const [services, setServices] = useState<ServiceAdmin[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceAdmin | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [serviceDetailView, setServiceDetailView] = useState<ServiceAdmin | null>(null);
  
  // Virtual scrolling settings
  const [visibleStart, setVisibleStart] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Fetch available services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await API.services.listWithStatus();
        
        if (response.ok) {
          const data = await response.json();
          setServices(data);
          const availableServices = data.filter((service: ServiceAdmin) => !service.has_admin);
          setFilteredServices(availableServices);
        } else {
          setError("Failed to load services");
        }
      } catch (err) {
        setError("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim() === "") {
        const availableServices = services.filter(service => !service.has_admin);
        setFilteredServices(availableServices);
      } else {
        const filtered = services.filter(
          service => 
            !service.has_admin && 
            (
              service.name.toLowerCase().includes(query.toLowerCase()) ||
              (service.category && service.category.toLowerCase().includes(query.toLowerCase())) ||
              (service.location && service.location.toLowerCase().includes(query.toLowerCase()))
            )
        );
        setFilteredServices(filtered);
      }
      setVisibleStart(0);
    }, 300),
    [services, setFilteredServices, setVisibleStart]
  );

  // Apply search filtering
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Virtual scrolling - visible services subset
  const visibleServices = useMemo(() => {
    return filteredServices.slice(visibleStart, visibleStart + ITEMS_PER_PAGE);
  }, [filteredServices, visibleStart]);

  // Load more services on scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      if (visibleStart + ITEMS_PER_PAGE < filteredServices.length) {
        setVisibleStart(prev => prev + ITEMS_PER_PAGE);
      }
    }
  }, [filteredServices.length, visibleStart]);

  // Handle text input changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Service selection handler
  const handleServiceSelect = (service: ServiceAdmin | null) => {
    setSelectedService(service);
    if (service) {
      setFormData({ ...formData, serviceId: service.id.toString() });
    } else {
      setFormData({ ...formData, serviceId: "" });
    }
  };

  // View service details
  const viewServiceDetails = (service: ServiceAdmin, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setServiceDetailView(service);
    setDetailDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!formData.serviceId) {
      setError("Please select a service to manage");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await API.auth.adminSignup({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        serviceId: formData.serviceId
      });

      const data = await response.json();
      
      if (response.ok) {
        navigate("/admin-login", { 
          state: { 
            message: "Admin account created successfully! Please sign in." 
          } 
        });
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormContainer 
      title="Register as Service Administrator" 
      error={error}
      theme={theme}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Full Name"
          name="name"
          autoComplete="name"
          value={formData.name}
          onChange={handleTextChange}
          disabled={submitting}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleTextChange}
          disabled={submitting}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          id="phoneNumber"
          label="Phone Number"
          name="phoneNumber"
          autoComplete="tel"
          value={formData.phoneNumber}
          onChange={handleTextChange}
          disabled={submitting}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleTextChange}
          disabled={submitting}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleTextChange}
          disabled={submitting}
        />
        
        {/* Service Selection with Services Selector Component */}
        <ServiceSelector
          selectedService={selectedService}
          onSelectService={handleServiceSelect}
          loading={loading}
          services={services}
          visibleServices={visibleServices}
          filteredServices={filteredServices}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          visibleStart={visibleStart}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          onScroll={handleScroll}
          viewServiceDetails={viewServiceDetails}
          submitting={submitting}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2, py: 1.2, borderRadius: 2 }}
          disabled={submitting || !selectedService}
        >
          {submitting ? <CircularProgress size={24} /> : "Register"}
        </Button>
        
        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Already have an admin account?{" "}
            <Button
              color="primary"
              onClick={() => navigate("/admin-login")}
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
              disabled={submitting}
            >
              Login
            </Button>
          </Typography>
        </Box>
      </Box>
      
      {/* Service Detail Dialog Component */}
      <ServiceDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        service={serviceDetailView}
        onSelect={(service) => {
          handleServiceSelect(service);
          setDetailDialogOpen(false);
        }}
      />
    </FormContainer>
  );
};

export default AdminSignup;