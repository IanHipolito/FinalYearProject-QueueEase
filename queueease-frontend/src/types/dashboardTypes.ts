import { SelectChangeEvent } from '@mui/material/Select';
import { ReactNode } from 'react';

export interface Order {
  id: number | string;
  customer_name: string;
  date: string;
  status: string;
  service_name?: string;
  time?: string;
  type?: 'immediate' | 'appointment';
}

export interface DashboardData {
  customerCount: number;
  queueCount: number;
  orderCount: number;
  latestOrders: Order[];
  customerStats: number[];
  growth: number;
  service_type: 'immediate' | 'appointment';
}

export interface DashboardHeaderProps {
  title: string;
  serviceName?: string;
  services?: Array<{id: number, name: string, is_owner?: boolean}>;
  onServiceChange: (event: SelectChangeEvent<number>) => void;
  currentServiceId?: number;
}

export interface LatestOrdersListProps {
  orders: Order[];
  loading: boolean;
  isImmediateService: () => boolean;
  onRefresh: () => void;
  onOrderClick: (order: Order) => void;
  getStatusColor: (status?: string) => string;
}

export interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  color: string;
  children?: ReactNode;
}
