export interface Service {
  id: number;
  name: string;
  description?: string;
  category?: string;
  latitude: number;
  longitude: number;
  queue_length?: number;
  wait_time?: number;
  service_type?: 'immediate' | 'appointment';
}

export interface ServiceAdmin {
  id: number;
  name: string;
  description: string;
  category?: string;
  location?: string;
  business_hours?: string;
  has_admin?: boolean;
}
