export interface Queue {
  id: number;
  name: string;
  department: string;
  status: string;
  customers: number;
  description?: string;
  max_capacity?: number;
}

export interface QueueFormData {
  name: string;
  department: string;
  description: string;
  max_capacity: number;
}