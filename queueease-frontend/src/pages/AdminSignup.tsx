import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Container, Paper, TextField, Typography,
  ThemeProvider, createTheme, CssBaseline, useMediaQuery,
  Alert, CircularProgress, Divider, Dialog, DialogTitle, 
  DialogContent, DialogActions, Tooltip, Card, CardContent, List,
  ListItemButton, ListItemText, ListItemIcon, IconButton, InputAdornment,
  Stack, Skeleton, Chip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
import { debounce } from "lodash";

const theme = createTheme({
  palette: {
    primary: {
      main: '#6f42c1',
      light: '#8551d9',
      dark: '#5e35b1'
    }
  }
});

interface Service {
  id: number;
  name: string;
  description: string;
  category?: string;
  location?: string;
  business_hours?: string;
  has_admin?: boolean;
}

const AdminSignup: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    serviceId: ""
  });
  
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [serviceDetailView, setServiceDetailView] = useState<Service | null>(null);
  
  // Virtualization settings for better performance
  const [visibleStart, setVisibleStart] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Fetch available services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:8000/api/list_services_with_status/");
        if (response.ok) {
          const data = await response.json();
          setServices(data);
          // Only set filtered services for what's initially visible
          const availableServices = data.filter((service: Service) => !service.has_admin);
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

  // Handle searching with debounce for performance
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
      // Reset pagination when search changes
      setVisibleStart(0);
    }, 300),
    [services]
  );

  // Call search handler when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Pagination: only show a subset of services at a time
  const visibleServices = useMemo(() => {
    return filteredServices.slice(visibleStart, visibleStart + ITEMS_PER_PAGE);
  }, [filteredServices, visibleStart]);

  // Load more services when scrolling
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
  
  // Handle service selection
  const handleServiceSelect = (service: Service | null) => {
    setSelectedService(service);
    if (service) {
      setFormData({ ...formData, serviceId: service.id.toString() });
    } else {
      setFormData({ ...formData, serviceId: "" });
    }
  };

  // Open the dialog to choose a service
  const openServiceDialog = () => {
    setServiceDialogOpen(true);
  };

  // View service details
  const viewServiceDetails = (service: Service, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setServiceDetailView(service);
    setDetailDialogOpen(true);
  };

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
      const response = await fetch("http://127.0.0.1:8000/api/admin-signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          serviceId: formData.serviceId
        }),
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        py: 4,
        background: 'linear-gradient(135deg, rgba(111,66,193,0.1) 0%, rgba(133,81,217,0.05) 100%)',
      }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" component="h1" align="center" fontWeight="bold" mb={3}>
              Register as Service Administrator
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
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
              
              {/* Service Selection with Details */}
              <Box sx={{ mt: 3, mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                  Select Service to Manage
                </Typography>
                
                {selectedService ? (
                  <Card variant="outlined" sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6">{selectedService.name}</Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {selectedService.category || "General Service"}
                          </Typography>
                          {selectedService.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {selectedService.location}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Button 
                          size="small" 
                          onClick={(e) => viewServiceDetails(selectedService, e)}
                        >
                          Details
                        </Button>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleServiceSelect(null)}
                          sx={{ mr: 1 }}
                        >
                          Change
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={openServiceDialog}
                    disabled={submitting || loading}
                    sx={{ my: 1, py: 1.5, borderStyle: 'dashed' }}
                  >
                    {loading ? "Loading services..." : "Choose a service to manage"}
                  </Button>
                )}
              </Box>
              
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
          </Paper>
        </Container>
      </Box>
      
      {/* Service Selection Dialog - Optimized */}
      <Dialog 
        open={serviceDialogOpen} 
        onClose={() => setServiceDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Select a Service
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Choose the service you want to manage
          </Typography>
          
          <TextField
            margin="dense"
            fullWidth
            placeholder="Search by name, category or location"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {loading ? (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="70%" height={24} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : filteredServices.length > 0 ? (
            <List 
              component="div"
              sx={{ maxHeight: '400px', overflow: 'auto', pt: 0 }}
              onScroll={handleScroll}
            >
              {visibleServices.map((service) => (
                <React.Fragment key={service.id}>
                  <ListItemButton
                    onClick={() => {
                      handleServiceSelect(service);
                      setServiceDialogOpen(false);
                    }}
                  >
                    <ListItemIcon>
                      <CheckCircleOutlineIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={service.name}
                      secondary={
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                          {service.category && (
                            <Chip 
                              size="small" 
                              label={service.category} 
                              variant="outlined"
                              icon={<CategoryIcon fontSize="small" />}
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )}
                          {service.location && (
                            <Chip 
                              size="small" 
                              label={service.location} 
                              variant="outlined"
                              icon={<LocationOnIcon fontSize="small" />}
                              sx={{ mb: 0.5 }}
                            />
                          )}
                        </Stack>
                      }
                    />
                    <Tooltip title="View details">
                      <IconButton
                        edge="end"
                        onClick={(e) => viewServiceDetails(service, e)}
                      >
                        <InfoOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemButton>
                  <Divider component="li" />
                </React.Fragment>
              ))}
              {visibleStart + ITEMS_PER_PAGE < filteredServices.length && (
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <CircularProgress size={20} thickness={4} />
                </Box>
              )}
            </List>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchQuery ? "No matching services found" : "No services available for registration"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Service Detail Dialog with Enhanced Location Information */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {serviceDetailView?.name}
        </DialogTitle>
        <DialogContent dividers>
          {serviceDetailView && (
            <>
              {/* Location Banner - Add prominent location display */}
              {serviceDetailView.location && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2, 
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(111,66,193,0.05)',
                    border: '1px solid rgba(111,66,193,0.1)'
                  }}
                >
                  <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2">
                    Located at: <strong>{serviceDetailView.location}</strong>
                  </Typography>
                </Box>
              )}
              
              {/* Description with integrated location reference */}
              <Typography variant="body1" paragraph>
                {serviceDetailView.description || "No description available."} 
                {serviceDetailView.location && !serviceDetailView.description?.includes(serviceDetailView.location) && (
                  <> This service is available at <strong>{serviceDetailView.location}</strong>.</>
                )}
              </Typography>
              
              {/* Service Details List */}
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 'medium' }}>
                Service Details
              </Typography>
              <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {serviceDetailView.category && (
                  <ListItemButton>
                    <ListItemIcon>
                      <CategoryIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Category"
                      secondary={serviceDetailView.category}
                    />
                  </ListItemButton>
                )}
                
                {serviceDetailView.location && (
                  <ListItemButton>
                    <ListItemIcon>
                      <LocationOnIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Location"
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                      secondary={
                        <Typography variant="body2" component="span">
                          {serviceDetailView.location}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                )}
                
                {serviceDetailView.business_hours && (
                  <ListItemButton>
                    <ListItemIcon>
                      <BusinessIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Business Hours"
                      secondary={serviceDetailView.business_hours}
                    />
                  </ListItemButton>
                )}
              </List>
              
              {/* Add a location context note if location exists */}
              {serviceDetailView.location && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary" align="center">
                    *You'll be able to manage this service's queue system for customers at this location
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {serviceDetailView && !serviceDetailView.has_admin && (
            <Button 
              variant="contained"
              onClick={() => {
                handleServiceSelect(serviceDetailView);
                setDetailDialogOpen(false);
                setServiceDialogOpen(false);
              }}
            >
              Select This Service
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default AdminSignup;