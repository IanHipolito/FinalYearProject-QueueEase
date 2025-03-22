export interface FeedbackCategory {
  id: string;
  name: string;
}

export interface FeedbackData {
  id?: number;
  rating: number;
  comment: string;
  categories: string[];
  service_id: number;
  service_name?: string;
  created_at?: string;
  user_id?: number;
  order_id?: number;
  order_details?: string;
  sentiment?: string;
}

export interface UserFeedbackHistory {
  id: number;
  service_name: string;
  order_details: string;
  rating: number;
  date: string;
  comment: string;
  categories: string[];
  sentiment?: string;
}

export interface ServiceWithOrderDetails {
  id: number;
  name: string;
  order_id: number;
  order_details: string;
  date: string;
  has_feedback: boolean;
}