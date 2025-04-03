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

export interface UserMainPageQueue {
  id?: number;
  service_id?: number;
  service_name?: string;
  position?: number;
  total_wait?: number;
  expected_ready_time?: string;
  estimated_time?: number;
  status?: string;
  time_created?: string;
  is_transferred?: boolean;
}

export interface QueueFormData {
  name: string;
  department: string;
  description: string;
  max_capacity: number;
}

export interface QRCodeScreenProps {
  queueId: number;
}

export interface QueueData {
  queue_id: number;
  service_id?: number;
  service_name: string;
  current_position: number | null;
  status: string;
  expected_ready_time: string | null;
  total_wait?: number;
  time_created?: string;
  is_transferred?: boolean;
  original_queue_id?: number;
}