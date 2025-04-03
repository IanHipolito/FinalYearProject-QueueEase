export interface User {
    id: number;
    name: string;
    email: string;
    user_type?: string;
    is_admin?: boolean;
}
  
export interface ManagedService {
    id: number;
    name: string;
    is_owner: boolean;
    service_type: 'immediate' | 'appointment';
    location?: string;
    business_hours?: string;
}
  
export interface AuthContextType {
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