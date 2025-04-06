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

export interface QueueEntry {
  id: number;
  service_name: string;
  date_created: string;
  status: string;
}

export interface UserActivityChartProps {
  queueHistory: QueueEntry[];
  timeRange: string;
}

export interface CreateQueueDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  formData: QueueFormData;
  setFormData: (data: QueueFormData) => void;
}

export interface QueueManagementProps {
  queues: Queue[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onToggleQueueStatus: (queueId: number, newStatus: boolean) => void;
}

export interface QueueSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export interface QueueStatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

export interface QueueStatsOverviewProps {
  totalQueues: number;
  activeQueues: number;
  inactiveQueues: number;
  totalCustomersInActiveQueues: number;
}

export interface QueueStatusToggleProps {
  activeQueues: number;
  inactiveQueues: number;
  bgColor: string;
  iconColor: string;
}

export interface QueueTableProps {
  queues: Queue[];
  loading: boolean;
  onToggleQueueStatus: (queueId: number, newStatus: boolean) => void;
}

export interface QueueProgressAnimationProps {
  position: number;
}