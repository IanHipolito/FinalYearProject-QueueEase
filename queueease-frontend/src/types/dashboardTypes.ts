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