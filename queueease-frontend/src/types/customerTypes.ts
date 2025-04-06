import { SelectChangeEvent } from '@mui/material/Select';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  orders: number;
  avatar?: string;
  is_active: boolean;
  last_visit?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalOrders: number;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
}

export interface CustomerComment {
  id: number;
  name: string;
  date: string;
  queue: string;
  rating: number;
  comment: string;
  avatar?: string;
}

export interface CreateCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: CustomerFormData;
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>;
  formError: string;
  formLoading: boolean;
}

export interface CustomerDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export interface CustomerFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onCreateCustomer: () => void;
}

export interface CustomerStatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  loading: boolean;
  gradient: string;
  chart?: React.ReactNode;
}

export interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  renderSkeletons: () => React.ReactNode;
  onShowDetails: (customer: Customer) => void;
  searchTerm: string;
  onClearFilter: () => void;
}

export interface CustomerTrendsChartProps {
  customerStats: number[];
  timeLabels: string[];
  loading: boolean;
  statsTimeRange: string;
  onTimeRangeChange: (event: SelectChangeEvent) => void;
  onRefresh: () => void;
  isImmediateService: () => boolean;
}

export interface CustomerCommentsProps {
  comments: CustomerComment[];
  filter: string;
  onFilterChange: (event: SelectChangeEvent) => void;
}