import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { API } from '../services/api';
import {
  Box, Container, Typography, Tabs, Tab, Paper, Divider,
  CircularProgress, Alert, Button, Fade
} from '@mui/material';
import FeedbackForm from '../components/feedback/FeedbackForm';
import ServiceSelectionCard from '../components/feedback/ServiceSelectionCard';
import FeedbackHistoryCard from '../components/feedback/FeedbackHistoryCard';
import EmptyState from '../components/feedback/EmptyState';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import RateReviewIcon from '@mui/icons-material/RateReview';
import {  FeedbackCategory,  ServiceWithOrderDetails, UserFeedbackHistory } from '../types/feedbackTypes';

const FeedbackPage: React.FC = () => {
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

  useEffect(() => {
    const fetchEligibleServices = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingServices(true);
        setError('');
        
        const response = await API.feedback.getUserEligibleServices(user.id);
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error('API response error:', errorData);
            
            if (errorData.error && errorData.error.includes("time_created")) {
              console.log("Using fallback for eligible services due to time_created field error");
              
              const historyResponse = await API.feedback.getUserFeedbackHistory(user.id);
              if (historyResponse.ok) {
                const historyData = await historyResponse.json();
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
                
                setServices(Array.from(serviceMap.values()));
                setLoadingServices(false);
                return;
              }
              
              throw new Error(
                "Unable to retrieve your eligible services due to a database field mismatch. Please contact the administrator."
              );
            } else {
              throw new Error(`Failed to load services: ${response.status}`);
            }
          } catch (jsonError) {
            const errorText = await response.text().catch(() => '');
            console.error('API response error:', errorText);
            throw new Error(`Failed to load services: ${response.status}`);
          }
        }
        
        const data = await response.json();
        const validatedData = Array.isArray(data) ? data.map(service => ({
          id: service.id || 0,
          name: service.name || 'Unknown Service',
          order_id: service.order_id || 0,
          order_details: service.order_details || 'Unknown Order',
          date: service.date || new Date().toISOString(),
          has_feedback: !!service.has_feedback
        })) : [];
        
        setServices(validatedData);
      } catch (err: any) {
        console.error('Error fetching eligible services:', err);
        setError(err.message || 'Failed to load services');
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    
    fetchEligibleServices();
  }, [user?.id]);

  useEffect(() => {
    const fetchFeedbackHistory = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingHistory(true);
        const response = await API.feedback.getUserFeedbackHistory(user.id);
        
        if (!response.ok) {
          throw new Error(`Failed to load feedback history: ${response.status}`);
        }
        
        const data = await response.json();
        setFeedbackHistory(data);
      } catch (err: any) {
        console.error('Error fetching feedback history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchFeedbackHistory();
  }, [user?.id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await API.feedback.getCategories();
        
        if (!response.ok) {
          throw new Error(`Failed to load categories: ${response.status}`);
        }
        
        const data = await response.json();
        setCategories(data);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSelectService = (service: ServiceWithOrderDetails) => {
    setSelectedService(service);
  };

  const handleSubmitSuccess = () => {
    if (user?.id) {
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === selectedService?.id 
            ? { ...service, has_feedback: true } 
            : service
        )
      );
      
      API.feedback.getUserFeedbackHistory(user.id)
        .then(response => response.json())
        .then(data => {
          setFeedbackHistory(data);
          setActiveTab(1);
        })
        .catch(err => console.error('Error refreshing feedback history:', err));
    }
  };

  const handleBackToServices = () => {
    setSelectedService(null);
  };

  const availableServiceCount = services.filter(service => !service.has_feedback).length;
  const submittedFeedbackCount = services.filter(service => service.has_feedback).length;

  if (!user) {
    navigate('/login');
    return null;
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
          <Alert severity="error" sx={{ mb: 3 }}>
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
                    <Typography variant="h6" gutterBottom fontWeight="medium">
                      Select a service to provide feedback
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      You can only give feedback for services you've used and haven't rated yet.
                    </Typography>
                    
                    {availableServiceCount > 0 ? (
                      services
                        .filter(service => !service.has_feedback)
                        .map(service => (
                          <ServiceSelectionCard
                            key={`${service.id}-${service.order_id}`}
                            service={service}
                            onSelect={() => handleSelectService(service)}
                          />
                        ))
                    ) : (
                      <EmptyState 
                        message="You've already provided feedback for all your services."
                        buttonText="View History"
                        buttonAction={() => setActiveTab(1)}
                      />
                    )}
                    
                    {submittedFeedbackCount > 0 && (
                      <>
                        <Typography variant="h6" sx={{ mt: 4, mb: 2 }} fontWeight="medium">
                          Services with submitted feedback
                        </Typography>
                        
                        {services
                          .filter(service => service.has_feedback)
                          .map(service => (
                            <ServiceSelectionCard
                              key={`${service.id}-${service.order_id}`}
                              service={service}
                              onSelect={() => {}}
                              disabled
                            />
                          ))}
                      </>
                    )}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
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
                        {feedbackHistory.length} Feedback{feedbackHistory.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    
                    {feedbackHistory.map(feedback => (
                      <FeedbackHistoryCard
                        key={feedback.id}
                        feedback={feedback}
                      />
                    ))}
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