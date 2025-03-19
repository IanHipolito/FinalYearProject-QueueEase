import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  user_type?: string;
  is_admin?: boolean;
}

interface ManagedService {
  id: number;
  name: string;
  is_owner: boolean;
  service_type: 'immediate' | 'appointment';
  location?: string;
  business_hours?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAdmin: boolean;
  managedServices: ManagedService[];
  currentService: ManagedService | null;
  setCurrentService: (service: ManagedService) => void;
  refreshServiceData: (serviceId: number) => Promise<any>;
  switchService: (serviceId: number) => boolean;
}

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
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const newUser = { 
          id: data.user_id, 
          name: data.name, 
          email: data.email,
          user_type: data.user_type,
          is_admin: data.user_type === 'admin'
        };
        
        setUser(newUser);
        setIsAdmin(data.user_type === 'admin');
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(newUser));
        return;
      } 
      throw new Error('Invalid email or password');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Admin-specific login
  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
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
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('managedServices', JSON.stringify(data.managed_services || []));
        return;
      }
      throw new Error('Invalid email or password');
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
    localStorage.removeItem('user');
    localStorage.removeItem('managedServices');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedServices = localStorage.getItem('managedServices');
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsAdmin(parsedUser.is_admin || parsedUser.user_type === 'admin');
    }
    
    if (savedServices) {
      const parsedServices = JSON.parse(savedServices);
      setManagedServices(parsedServices);
      if (parsedServices.length > 0) {
        setCurrentService(parsedServices[0]);
      }
    }
    
    setLoading(false);
  }, []);

  const refreshServiceData = async (serviceId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/service/${serviceId}/`);
      if (response.ok) {
        const updatedService = await response.json();
        setManagedServices(prev => 
          prev.map(service => service.id === serviceId ? {...service, ...updatedService} : service)
        );
        if (currentService?.id === serviceId) {
          setCurrentService(prev => ({...prev, ...updatedService}));
        }
        return updatedService;
      }
    } catch (error) {
      console.error("Error refreshing service data:", error);
    }
    return null;
  };
  
  // Add a function to switch between managed services
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