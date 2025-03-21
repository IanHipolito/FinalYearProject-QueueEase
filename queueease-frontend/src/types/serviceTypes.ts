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