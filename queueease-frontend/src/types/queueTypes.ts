export interface Queue {
  id: number;
  name: string;
  department: string;
  status: string;
  customers: number;
  description?: string;
  max_capacity?: number;
  sequence_number?: number;
  is_active?: boolean;
}

export interface QueueFormData {
  name: string;
  department: string;
  description: string;
  max_capacity: number;
}