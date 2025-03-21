export interface FeedbackCategory {
  id: number;
  category: string;
  satisfied: number;
  neutral: number;
  dissatisfied: number;
  total?: number;
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

export interface AnalyticsData {
  feedback_distribution: FeedbackCategory[];
  customer_comments: CustomerComment[];
  total_reports: number;
  satisfaction_rate: number;
  average_wait_time: number;
  wait_time_trend: number[];
  satisfaction_trend: number[];
}