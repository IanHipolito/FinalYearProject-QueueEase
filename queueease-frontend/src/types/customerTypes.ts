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