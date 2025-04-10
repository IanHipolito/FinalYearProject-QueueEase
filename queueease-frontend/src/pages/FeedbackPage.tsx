import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import {
  Box, Container, Typography, Tabs, Tab, Paper, Divider,
  CircularProgress, Alert, Button, Fade, Pagination,
  FormControl, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import RateReviewIcon from '@mui/icons-material/RateReview';
import FeedbackForm from '../components/feedback/FeedbackForm';
import ServiceSelectionCard from '../components/feedback/ServiceSelectionCard';
import FeedbackHistoryCard from '../components/feedback/FeedbackHistoryCard';
import EmptyState from '../components/feedback/EmptyState';
import FilterBar from '../components/feedback/FilterBar';
import { FeedbackCategory, ServiceWithOrderDetails, UserFeedbackHistory } from '../types/feedbackTypes';
import { useAuthGuard } from '../hooks/useAuthGuard';

const FeedbackPage: React.FC = () => {
  const { authenticated, loading: authLoading } = useAuthGuard();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceWithOrderDetails | null>(null);
  const [services, setServices] = useState<ServiceWithOrderDetails[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<UserFeedbackHistory[]>([]);
  const [categories, setCategories] = useState<FeedbackCategory[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  
  // History tab filters
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [showHistoryDateFilter, setShowHistoryDateFilter] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState<Date | null>(null);
  const [historyEndDate, setHistoryEndDate] = useState<Date | null>(null);
  const [filteredHistory, setFilteredHistory] = useState<UserFeedbackHistory[]>([]);
  
  // Service tab filters
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [showServiceDateFilter, setShowServiceDateFilter] = useState(false);
  const [serviceStartDate, setServiceStartDate] = useState<Date | null>(null);
  const [serviceEndDate, setServiceEndDate] = useState<Date | null>(null);
  const [filteredServices, setFilteredServices] = useState<ServiceWithOrderDetails[]>([]);

  // Pagination states for services tab
  const [servicePage, setServicePage] = useState(1);
  const [servicesPerPage, setServicesPerPage] = useState(5);
  const [servicesTotalPages, setServicesTotalPages] = useState(1);
  const [displayedServices, setDisplayedServices] = useState<ServiceWithOrderDetails[]>([]);

  // Pagination states for history tab
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(5);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [displayedHistory, setDisplayedHistory] = useState<UserFeedbackHistory[]>([]);

  useEffect(() => {
    if (!authenticated || !user?.id) return;
    
    const fetchEligibleServices = async () => {
      try {
        setLoadingServices(true);
        setError('');
        
        const data = await API.feedback.getUserEligibleServices(user.id);
        
        const validatedData = Array.isArray(data) ? data.map(service => ({
          id: service.id || 0,
          name: service.name || 'Unknown Service',
          order_id: service.order_id || 0,
          order_details: service.order_details || 'Unknown Order',
          date: service.date || new Date().toISOString(),
          has_feedback: !!service.has_feedback
        })) : [];
        
        setServices(validatedData);
        setFilteredServices(validatedData); // Initialize filtered services
      } catch (err) {
        // Try to handle the time_created field error with a fallback approach
        if (err instanceof Error && err.message.includes("time_created")) {
          try {
            // Use history as a fallback to get services
            const historyData = await API.feedback.getUserFeedbackHistory(user.id);
            const serviceMap = new Map();
            
            historyData.forEach((item: any) => {
              serviceMap.set(item.service_id, {
                id: item.service_id,
                name: item.service_name || 'Unknown Service',
                order_id: item.id || 0,
                order_details: `Service #${item.service_id}`,
                date: new Date().toISOString(),
                has_feedback: true
              });
            });
            
            const mappedServices = Array.from(serviceMap.values());
            setServices(mappedServices);
            setFilteredServices(mappedServices);
          } catch (fallbackErr) {
            setError(
              "Unable to retrieve your eligible services due to a database field mismatch. Please contact the administrator."
            );
          }
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load services');
        }
        
        if (!services.length) {
          setServices([]);
          setFilteredServices([]);
        }
      } finally {
        setLoadingServices(false);
      }
    };
    
    fetchEligibleServices();
  }, [authenticated, user?.id]);

  useEffect(() => {
    if (!authenticated || !user?.id) return;
    
    const fetchFeedbackHistory = async () => {
      try {
        setLoadingHistory(true);
        
        const data = await API.feedback.getUserFeedbackHistory(user.id);
        setFeedbackHistory(data);
        setFilteredHistory(data); // Initialize filtered history with all history
      } catch (err) {
        // Error handling without console logging
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchFeedbackHistory();
  }, [authenticated, user?.id]);

  useEffect(() => {
    if (!authenticated) return;
    
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        
        const data = await API.feedback.getCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, [authenticated]);

  // Apply filters to feedback history
  useEffect(() => {
    let filtered = [...feedbackHistory];
    
    // Apply search query filter
    if (historySearchQuery.trim() !== '') {
      const query = historySearchQuery.toLowerCase();
      filtered = filtered.filter(feedback => 
        feedback.service_name.toLowerCase().includes(query) ||
        feedback.comment.toLowerCase().includes(query)
      );
    }
    
    // Apply date filters
    if (historyStartDate) {
      const start = new Date(historyStartDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(feedback => {
        const feedbackDate = new Date(feedback.date);
        return feedbackDate >= start;
      });
    }
    
    if (historyEndDate) {
      const end = new Date(historyEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(feedback => {
        const feedbackDate = new Date(feedback.date);
        return feedbackDate <= end;
      });
    }
    
    setFilteredHistory(filtered);
    setHistoryPage(1); // Reset to first page when filters change
  }, [feedbackHistory, historySearchQuery, historyStartDate, historyEndDate]);

  // Apply filters to available services
  useEffect(() => {
    // First filter to only get services without feedback
    let availableServices = services.filter(service => !service.has_feedback);
    
    // Apply search query filter
    if (serviceSearchQuery.trim() !== '') {
      const query = serviceSearchQuery.toLowerCase();
      availableServices = availableServices.filter(service => 
        service.name.toLowerCase().includes(query) ||
        service.order_details.toLowerCase().includes(query)
      );
    }
    
    // Apply date filters
    if (serviceStartDate) {
      const start = new Date(serviceStartDate);
      start.setHours(0, 0, 0, 0);
      availableServices = availableServices.filter(service => {
        const serviceDate = new Date(service.date);
        return serviceDate >= start;
      });
    }
    
    if (serviceEndDate) {
      const end = new Date(serviceEndDate);
      end.setHours(23, 59, 59, 999);
      availableServices = availableServices.filter(service => {
        const serviceDate = new Date(service.date);
        return serviceDate <= end;
      });
    }
    
    setFilteredServices(availableServices);
    setServicePage(1); // Reset to first page when filters change
  }, [services, serviceSearchQuery, serviceStartDate, serviceEndDate]);

  // Update pagination for services tab
  useEffect(() => {
    const calculatedTotalPages = Math.ceil(filteredServices.length / servicesPerPage);
    setServicesTotalPages(calculatedTotalPages || 1); // Ensure at least 1 page
    
    // Get current page items
    const startIndex = (servicePage - 1) * servicesPerPage;
    const endIndex = startIndex + servicesPerPage;
    const currentPageItems = filteredServices.slice(startIndex, endIndex);
    setDisplayedServices(currentPageItems);
    
    // Handle case where current page is out of bounds
    if (servicePage > calculatedTotalPages && calculatedTotalPages > 0) {
      setServicePage(calculatedTotalPages);
    }
  }, [filteredServices, servicePage, servicesPerPage]);
  
  // Update pagination for history tab
  useEffect(() => {
    const calculatedTotalPages = Math.ceil(filteredHistory.length / historyPerPage);
    setHistoryTotalPages(calculatedTotalPages || 1); // Ensure at least 1 page
    
    // Get current page items
    const startIndex = (historyPage - 1) * historyPerPage;
    const endIndex = startIndex + historyPerPage;
    const currentPageItems = filteredHistory.slice(startIndex, endIndex);
    setDisplayedHistory(currentPageItems);
    
    // Handle case where current page is out of bounds
    if (historyPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setHistoryPage(calculatedTotalPages);
    }
  }, [filteredHistory, historyPage, historyPerPage]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSelectService = (service: ServiceWithOrderDetails) => {
    setSelectedService(service);
  };

  const handleSubmitSuccess = async () => {
    if (!authenticated || !user?.id) return;
    
    setServices(prevServices => 
      prevServices.map(service => 
        service.id === selectedService?.id 
          ? { ...service, has_feedback: true } 
          : service
      )
    );
    
    try {
      const data = await API.feedback.getUserFeedbackHistory(user.id);
      setFeedbackHistory(data);
      setFilteredHistory(data);
      setActiveTab(1);
      setHistoryPage(1); // Reset to first page when switching to history after new feedback
    } catch (err) {
      console.error('Error refreshing feedback history:', err);
      }
  };

  const handleBackToServices = () => {
    setSelectedService(null);
  };

  // Pagination handlers
  const handleServicePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setServicePage(value);
    // Scroll to top of the list when changing pages
    document.getElementById('service-list-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHistoryPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setHistoryPage(value);
    // Scroll to top of the list when changing pages
    document.getElementById('history-list-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleServicesPerPageChange = (event: SelectChangeEvent<number>) => {
    setServicesPerPage(event.target.value as number);
    setServicePage(1); // Reset to first page when changing items per page
  };

  const handleHistoryPerPageChange = (event: SelectChangeEvent<number>) => {
    setHistoryPerPage(event.target.value as number);
    setHistoryPage(1); // Reset to first page when changing items per page
  };

  // Filter handlers for history tab
  const clearHistoryFilters = () => {
    setHistorySearchQuery('');
    setHistoryStartDate(null);
    setHistoryEndDate(null);
    setFilteredHistory(feedbackHistory);
    setHistoryPage(1);
  };

  const handleHistorySearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHistorySearchQuery(event.target.value);
  };

  // Filter handlers for services tab
  const clearServiceFilters = () => {
    setServiceSearchQuery('');
    setServiceStartDate(null);
    setServiceEndDate(null);
    setFilteredServices(services.filter(service => !service.has_feedback));
    setServicePage(1);
  };

  const handleServiceSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setServiceSearchQuery(event.target.value);
  };

  const availableServiceCount = services.filter(service => !service.has_feedback).length;
  const hasServiceFilters = serviceSearchQuery !== '' || serviceStartDate !== null || serviceEndDate !== null;
  const hasHistoryFilters = historySearchQuery !== '' || historyStartDate !== null || historyEndDate !== null;

  // Show loading state during auth check instead of redirecting
  if (authLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        bgcolor: '#f8f9fa',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={40} sx={{ color: '#6f42c1' }} />
        <Typography variant="body1" color="text.secondary">
          Loading feedback page...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: '#f8f9fa', 
      minHeight: '100vh', 
      py: 4,
      background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)'
    }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/usermainpage')}
            sx={{ 
              mr: 2, 
              color: '#6f42c1',
              '&:hover': { bgcolor: 'rgba(111, 66, 193, 0.08)' }
            }}
          >
            Back
          </Button>
          <Typography variant="h4" fontWeight="bold">
            Feedback
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
          Share your thoughts and help us improve our services
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
        
        <Paper
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
              '& .MuiTab-root': {
                minHeight: 64,
                fontWeight: 500,
                fontSize: '0.95rem'
              },
              '& .Mui-selected': {
                color: '#6f42c1'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#6f42c1'
              }
            }}
          >
            <Tab 
              label="Give Feedback" 
              icon={<RateReviewIcon />} 
              iconPosition="start"
              sx={{ 
                '& .MuiTab-iconWrapper': { mr: 1 },
              }} 
            />
            <Tab 
              label="Feedback History" 
              icon={<HistoryIcon />} 
              iconPosition="start"
              sx={{ 
                '& .MuiTab-iconWrapper': { mr: 1 },
              }} 
            />
          </Tabs>
          
          <Divider />
          
          <Box sx={{ p: 3 }}>
            <Fade in={activeTab === 0}>
              <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
                {selectedService ? (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 3,
                        cursor: 'pointer',
                        color: '#6f42c1',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={handleBackToServices}
                    >
                      <ArrowBackIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                      <Typography variant="body2">Back to services</Typography>
                    </Box>
                    
                    {authenticated && user?.id ? (
                      <FeedbackForm
                        serviceId={selectedService.id}
                        serviceName={selectedService.name}
                        orderId={selectedService.order_id}
                        orderDetails={selectedService.order_details}
                        userId={user.id}
                        onSubmitSuccess={handleSubmitSuccess}
                        availableCategories={categories}
                        isLoading={loadingCategories}
                      />
                    ) : (
                      <Alert severity="warning">
                        You need to be logged in to submit feedback.
                      </Alert>
                    )}
                  </>
                ) : loadingServices ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress size={40} sx={{ color: '#6f42c1', mb: 2 }} />
                    <Typography>Loading services...</Typography>
                  </Box>
                ) : services.length === 0 ? (
                  <EmptyState 
                    message="You don't have any services available for feedback."
                    buttonText="Browse Services"
                    buttonAction={() => navigate('/services')}
                  />
                ) : (
                  <>
                    <Box id="service-list-container">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom fontWeight="medium">
                            Select a service to provide feedback
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            You can only give feedback for services you've used and haven't rated yet.
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ 
                          color: 'white', 
                          bgcolor: '#6f42c1',
                          p: 1,
                          px: 2,
                          borderRadius: 2,
                          fontWeight: 'medium'
                        }}>
                          {filteredServices.length} Available Service{filteredServices.length !== 1 ? 's' : ''}
                          {filteredServices.length !== availableServiceCount && 
                            ` (filtered from ${availableServiceCount})`}
                        </Typography>
                      </Box>
                      
                      {/* Service Search and Filter */}
                      <FilterBar 
                        searchQuery={serviceSearchQuery}
                        showDateFilter={showServiceDateFilter}
                        handleSearchChange={handleServiceSearchChange}
                        toggleDateFilter={() => setShowServiceDateFilter(!showServiceDateFilter)}
                        clearFilters={clearServiceFilters}
                        hasActiveFilters={hasServiceFilters}
                      />
                      
                      {/* Service Date Filters */}
                      {showServiceDateFilter && (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 2, 
                            mb: 3,
                            p: 2,
                            bgcolor: '#f8f9fa',
                            borderRadius: 2
                          }}>
                            <DatePicker
                              label="From Date"
                              value={serviceStartDate}
                              onChange={(newValue) => setServiceStartDate(newValue)}
                              slotProps={{ 
                                textField: { 
                                  size: 'small',
                                  variant: 'outlined',
                                  fullWidth: true 
                                } 
                              }}
                              sx={{ 
                                width: { xs: '100%', sm: '48%' }
                              }}
                            />
                            <DatePicker
                              label="To Date"
                              value={serviceEndDate}
                              onChange={(newValue) => setServiceEndDate(newValue)}
                              slotProps={{ 
                                textField: { 
                                  size: 'small',
                                  variant: 'outlined',
                                  fullWidth: true 
                                } 
                              }}
                              sx={{ 
                                width: { xs: '100%', sm: '48%' }
                              }}
                            />
                          </Box>
                        </LocalizationProvider>
                      )}
                      
                      {/* No services matches filter message */}
                      {filteredServices.length === 0 && hasServiceFilters && (
                        <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8f9fa', borderRadius: 2, mb: 3 }}>
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            No services match your search criteria
                          </Typography>
                          <Button 
                            variant="outlined" 
                            color="primary"
                            onClick={clearServiceFilters}
                            sx={{ mt: 1 }}
                          >
                            Clear Filters
                          </Button>
                        </Box>
                      )}
                      
                      {/* No services available message */}
                      {filteredServices.length === 0 && !hasServiceFilters && (
                        <EmptyState 
                          message="You've already provided feedback for all your services."
                          buttonText="View History"
                          buttonAction={() => setActiveTab(1)}
                        />
                      )}
                      
                      {/* Services list */}
                      {filteredServices.length > 0 && (
                        <>
                          {displayedServices.map(service => (
                            <ServiceSelectionCard
                              key={`${service.id}-${service.order_id}`}
                              service={service}
                              onSelect={() => handleSelectService(service)}
                            />
                          ))}
                          
                          {/* Pagination for services */}
                          {filteredServices.length > servicesPerPage && (
                            <Box sx={{ 
                              mt: 3, 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: 2
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Showing {Math.min((servicePage - 1) * servicesPerPage + 1, filteredServices.length)}-
                                  {Math.min(servicePage * servicesPerPage, filteredServices.length)} of {filteredServices.length} services
                                </Typography>
                                
                                <FormControl variant="outlined" size="small" sx={{ minWidth: 80 }}>
                                  <Select
                                    value={servicesPerPage}
                                    onChange={handleServicesPerPageChange}
                                    displayEmpty
                                    sx={{ height: 36 }}
                                  >
                                    <MenuItem value={5}>5</MenuItem>
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={25}>25</MenuItem>
                                    <MenuItem value={50}>50</MenuItem>
                                  </Select>
                                </FormControl>
                              </Box>
                              
                              <Pagination 
                                count={servicesTotalPages}
                                page={servicePage}
                                onChange={handleServicePageChange}
                                color="primary"
                                size="medium"
                                sx={{ 
                                  '& .MuiPaginationItem-root': {
                                    color: '#6f42c1',
                                  },
                                  '& .Mui-selected': {
                                    bgcolor: '#6f42c1 !important',
                                    color: 'white !important'
                                  }
                                }}
                              />
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Fade>
            
            <Fade in={activeTab === 1}>
              <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
                {loadingHistory ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress size={40} sx={{ color: '#6f42c1', mb: 2 }} />
                    <Typography>Loading feedback history...</Typography>
                  </Box>
                ) : feedbackHistory.length === 0 ? (
                  <EmptyState 
                    message="You haven't provided any feedback yet."
                    buttonText="Give Feedback"
                    buttonAction={() => setActiveTab(0)}
                  />
                ) : (
                  <>
                    <Box id="history-list-container">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom fontWeight="medium">
                            Your Feedback History
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Review the feedback you've provided for various services.
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ 
                          color: 'white', 
                          bgcolor: '#6f42c1',
                          p: 1,
                          px: 2,
                          borderRadius: 2,
                          fontWeight: 'medium'
                        }}>
                          {filteredHistory.length} Feedback{filteredHistory.length !== 1 ? 's' : ''}
                          {filteredHistory.length !== feedbackHistory.length && 
                            ` (filtered from ${feedbackHistory.length})`}
                        </Typography>
                      </Box>

                      {/* History Search and Filter */}
                      <FilterBar 
                        searchQuery={historySearchQuery}
                        showDateFilter={showHistoryDateFilter}
                        handleSearchChange={handleHistorySearchChange}
                        toggleDateFilter={() => setShowHistoryDateFilter(!showHistoryDateFilter)}
                        clearFilters={clearHistoryFilters}
                        hasActiveFilters={hasHistoryFilters}
                      />
                      
                      {/* History Date Filters */}
                      {showHistoryDateFilter && (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 2, 
                            mb: 3,
                            p: 2,
                            bgcolor: '#f8f9fa',
                            borderRadius: 2
                          }}>
                            <DatePicker
                              label="From Date"
                              value={historyStartDate}
                              onChange={(newValue) => setHistoryStartDate(newValue)}
                              slotProps={{ 
                                textField: { 
                                  size: 'small',
                                  variant: 'outlined',
                                  fullWidth: true 
                                } 
                              }}
                              sx={{ 
                                width: { xs: '100%', sm: '48%' }
                              }}
                            />
                            <DatePicker
                              label="To Date"
                              value={historyEndDate}
                              onChange={(newValue) => setHistoryEndDate(newValue)}
                              slotProps={{ 
                                textField: { 
                                  size: 'small',
                                  variant: 'outlined',
                                  fullWidth: true 
                                } 
                              }}
                              sx={{ 
                                width: { xs: '100%', sm: '48%' }
                              }}
                            />
                          </Box>
                        </LocalizationProvider>
                      )}

                      {/* No results message */}
                      {filteredHistory.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8f9fa', borderRadius: 2, mb: 3 }}>
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            No feedback matches your search criteria
                          </Typography>
                          <Button 
                            variant="outlined" 
                            color="primary"
                            onClick={clearHistoryFilters}
                            sx={{ mt: 1 }}
                          >
                            Clear Filters
                          </Button>
                        </Box>
                      )}

                      {displayedHistory.map(feedback => (
                        <FeedbackHistoryCard
                          key={feedback.id}
                          feedback={feedback}
                        />
                      ))}

                      {/* Pagination for feedback history */}
                      {filteredHistory.length > historyPerPage && (
                        <Box sx={{ 
                          mt: 3, 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 2
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Showing {Math.min((historyPage - 1) * historyPerPage + 1, filteredHistory.length)}-
                              {Math.min(historyPage * historyPerPage, filteredHistory.length)} of {filteredHistory.length} items
                            </Typography>
                            
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 80 }}>
                              <Select
                                value={historyPerPage}
                                onChange={handleHistoryPerPageChange}
                                displayEmpty
                                sx={{ height: 36 }}
                              >
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          
                          <Pagination 
                            count={historyTotalPages}
                            page={historyPage}
                            onChange={handleHistoryPageChange}
                            color="primary"
                            size="medium"
                            sx={{ 
                              '& .MuiPaginationItem-root': {
                                color: '#6f42c1',
                              },
                              '& .Mui-selected': {
                                bgcolor: '#6f42c1 !important',
                                color: 'white !important'
                              }
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Fade>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default FeedbackPage;