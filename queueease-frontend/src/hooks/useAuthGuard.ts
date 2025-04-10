import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AuthGuardOptions {
  redirectTo?: string;
  adminRequired?: boolean;
  serviceRequired?: boolean;
}

export const useAuthGuard = (options: AuthGuardOptions = {}) => {
  const { 
    redirectTo = '/login', 
    adminRequired = false,
    serviceRequired = false
  } = options;
  
  const { user, isAdmin, loading, currentService } = useAuth();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    // Only perform check after auth context loading is complete
    if (!loading) {
      let shouldRedirect = false;
      
      if (!user) {
        shouldRedirect = true;
      }
      
      // Admin check
      if (user && adminRequired && !isAdmin) {
        shouldRedirect = true;
      }
      
      // Service check
      if (user && isAdmin && serviceRequired && !currentService) {
        shouldRedirect = true;
      }
      
      if (shouldRedirect) {
        navigate(redirectTo);
      } else {
        setAuthenticated(true);
      }
    }
  }, [user, isAdmin, loading, navigate, redirectTo, adminRequired, serviceRequired, currentService]);
  
  return { authenticated, loading: loading || !authenticated };
};