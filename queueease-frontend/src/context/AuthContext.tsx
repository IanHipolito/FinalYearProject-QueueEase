import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { API } from '../services/api';
import { User, ManagedService, AuthContextType } from '../types/authContextTypes';
import { secureStorage } from '../utils/secureStorage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [managedServices, setManagedServices] = useState<ManagedService[]>([]);
  const [currentService, setCurrentService] = useState<ManagedService | null>(null);

  // Regular user login
  const login = async (email: string, password: string) => {
    try {
      const data = await API.auth.login(email, password);
      
      const newUser = { 
        id: data.user_id, 
        name: data.name, 
        email: data.email,
        user_type: data.user_type,
        is_admin: data.user_type === 'admin'
      };
      
      setUser(newUser);
      setIsAdmin(data.user_type === 'admin');
      
      // Save to secure storage with 12 hour expiry
      secureStorage.setItem('user', newUser, 12);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Admin-specific login
  const adminLogin = async (email: string, password: string) => {
    try {
      const data = await API.auth.adminLogin(email, password);
      
      if (!data.is_admin) {
        throw new Error('This account does not have admin privileges');
      }
      
      const newUser = { 
        id: data.user_id, 
        name: data.name, 
        email: data.email,
        user_type: 'admin',
        is_admin: true
      };
      
      setUser(newUser);
      setIsAdmin(true);
      
      if (data.managed_services && Array.isArray(data.managed_services)) {
        setManagedServices(data.managed_services);
        if (data.managed_services.length > 0) {
          setCurrentService(data.managed_services[0]);
        }
      }
      
      // Save to secure storage with 12 hour expiry
      secureStorage.setItem('user', newUser, 12);
      secureStorage.setItem('managedServices', data.managed_services || [], 12);
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    setManagedServices([]);
    setCurrentService(null);
    secureStorage.removeItem('user');
    secureStorage.removeItem('managedServices');
  };

  useEffect(() => {
    const savedUser = secureStorage.getItem('user');
    const savedServices = secureStorage.getItem('managedServices');
    
    if (savedUser) {
      setUser(savedUser);
      setIsAdmin(savedUser.is_admin || savedUser.user_type === 'admin');
    }
    
    if (savedServices) {
      setManagedServices(savedServices);
      if (savedServices.length > 0) {
        setCurrentService(savedServices[0]);
      }
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    const loadCurrentService = async () => {
      if (currentService?.id) {
        try {
          // Fetch the service details including service_type
          const serviceDetails = await API.services.getServiceDetails(currentService.id);
          setCurrentService(prev => ({
            ...prev,
            ...serviceDetails,
            service_type: serviceDetails.service_type
          }));
          console.log("Loaded service details:", serviceDetails);
        } catch (error) {
          console.error("Error loading service details:", error);
        }
      }
    };

    if (user && currentService?.id && !currentService?.service_type) {
      loadCurrentService();
    }
  }, [user, currentService?.id]);

  const refreshServiceData = async (serviceId: number) => {
    try {
      const updatedService = await API.services.getServiceDetails(serviceId);
      
      setManagedServices(prev => 
        prev.map(service => service.id === serviceId ? {...service, ...updatedService} : service)
      );
      
      if (currentService?.id === serviceId) {
        setCurrentService(prev => prev ? {...prev, ...updatedService} : null);
      }
      
      return updatedService;
    } catch (error) {
      console.error("Error refreshing service data:", error);
      return null;
    }
  };
  
  // Function to switch between managed services
  const switchService = (serviceId: number) => {
    const service = managedServices.find(s => s.id === serviceId);
    if (service) {
      setCurrentService(service);
      localStorage.setItem('currentServiceId', serviceId.toString());
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      adminLogin,
      logout, 
      loading, 
      isAdmin, 
      managedServices,
      currentService,
      setCurrentService,
      refreshServiceData,
      switchService
    }}>
      {children}
    </AuthContext.Provider>
  );
};