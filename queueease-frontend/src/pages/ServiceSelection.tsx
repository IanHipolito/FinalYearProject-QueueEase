import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from "./AuthContext";
import {
  Box,
  Container,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Pagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';

interface Service {
  id: number;
  name: string;
  description: string;
  wait_time: number;
  queue_length: number;
  category: string | null;
}

const ServiceSelection: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [displayedServices, setDisplayedServices] = useState<Service[]>([]);
  const [filterText, setFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const servicesPerPage = 6; // Show 6 services per page (2 rows of 3 on desktop, or more rows on mobile)

  const { user } = useAuth();
  const loggedInUserId = user?.id;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get<Service[]>(
          "http://127.0.0.1:8000/api/list_services/"
        );
        console.log(response.data); // Log services data to check category values
        setServices(response.data);
        setFilteredServices(response.data);
        setTotalPages(Math.ceil(response.data.length / servicesPerPage));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching services", error);
        setError("Failed to fetch services.");
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    let filtered = services;

    if (filterText.trim() !== "") {
      const lowerFilter = filterText.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(lowerFilter) ||
          service.description.toLowerCase().includes(lowerFilter)
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((service) => {
        const category = service.category?.toLowerCase();
        if (selectedCategory === "healthcare") {
          return ["doctors", "clinic", "dentist"].includes(category ?? "");
        }
        return category === selectedCategory.toLowerCase();
      });
    }

    setFilteredServices(filtered);
    setPage(1);
  }, [filterText, selectedCategory, services]);

  useEffect(() => {
    setTotalPages(Math.ceil(filteredServices.length / servicesPerPage));
    const startIndex = (page - 1) * servicesPerPage;
    const endIndex = startIndex + servicesPerPage;
    setDisplayedServices(filteredServices.slice(startIndex, endIndex));
  }, [page, filteredServices, servicesPerPage]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServiceSelect = async (serviceId: number) => {
    if (!loggedInUserId) {
      setError("User not logged in.");
      return;
    }
    try {
      const response = await axios.post<{ queue_id: number }>(
        "http://127.0.0.1:8000/api/create-queue/",
        {
          user_id: loggedInUserId,
          service_id: serviceId,
        }
      );
      const { queue_id } = response.data;
      navigate(`/qrcodescreen/${queue_id}`);
    } catch (error) {
      console.error("Error creating queue", error);
      setError("Failed to create queue.");
    }
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, mb: 4 }}>
          <Typography variant="h5" fontWeight="500" gutterBottom>
            Select a Service
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Choose the service you want to queue for from the options below.
          </Typography>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for services..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{
              mb: 2,
              mt: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#fff'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="restaurant">Restaurant</MenuItem>
              <MenuItem value="fast_food">Fast Food</MenuItem>
              <MenuItem value="cafe">Cafe</MenuItem>
              <MenuItem value="pub">Pub</MenuItem>
              <MenuItem value="post_office">Post Office</MenuItem>
              <MenuItem value="bar">Bar</MenuItem>
              <MenuItem value="bank">Bank</MenuItem>
              <MenuItem value="events_venue">Events Venue</MenuItem>
              <MenuItem value="veterinary">Veterinary</MenuItem>
              <MenuItem value="charging_station">Charging Station</MenuItem>
              <MenuItem value="healthcare">Healthcare</MenuItem>
              <MenuItem value="government">Government</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress sx={{ color: '#6f42c1' }} />
          </Box>
        ) : (
          <>
            {displayedServices.length > 0 ? (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {displayedServices.map((service) => (
                    <Grid item xs={12} sm={6} md={4} key={service.id}>
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: 4,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                          },
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight="600">
                              {service.name}
                            </Typography>
                            <Chip
                              label={`Queue: ${service.queue_length}`}
                              size="small"
                              icon={<PersonIcon fontSize="small" />}
                              sx={{
                                bgcolor: service.queue_length > 10 ? '#ffebee' : '#e8f5e9',
                                color: service.queue_length > 10 ? '#c62828' : '#2e7d32',
                                fontWeight: 500,
                                '& .MuiChip-icon': {
                                  color: service.queue_length > 10 ? '#c62828' : '#2e7d32',
                                }
                              }}
                            />
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {service.description}
                          </Typography>

                          <Divider sx={{ my: 2 }} />

                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '0.9rem' }} />
                            <Typography variant="body2" fontWeight="500" color="text.secondary">
                              Estimated Wait: <Box component="span" sx={{ color: service.wait_time > 30 ? '#c62828' : '#2e7d32' }}>
                                {service.wait_time} mins
                              </Box>
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() => handleServiceSelect(service.id)}
                            endIcon={<AddIcon />}
                            sx={{
                              borderRadius: 2,
                              bgcolor: '#6f42c1',
                              '&:hover': {
                                bgcolor: '#8551d9'
                              },
                              mt: 2
                            }}
                          >
                            Join Queue
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          color: '#6f42c1',
                        },
                        '& .Mui-selected': {
                          bgcolor: '#6f42c1 !important',
                          color: 'white',
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 4,
                  bgcolor: '#fff'
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No services found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search or check back later for new services.
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default ServiceSelection;