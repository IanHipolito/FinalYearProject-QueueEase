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

export interface UserFeedback {
  id: number;
  service_name: string;
  order_details: string;
  rating: number;
  date: string;
  comment: string;
  categories: string[];
  sentiment: string;
}

export interface KeywordData {
  text: string;
  value: number;
  sentiment: string;
}

export interface FeedbackAnalyticsSectionProps {
  userFeedback: UserFeedback[];
  averageRating: number;
  userId: number;
}

export interface FeedbackKeywordCloudProps {
  keywords: KeywordData[];
}

export interface FeedbackTableProps {
  data: FeedbackCategory[];
}

export interface FeedbackFormProps {
  serviceId: number;
  serviceName: string;
  orderId: number;
  orderDetails: string;
  userId: number;
  onSubmitSuccess: () => void;
  availableCategories: FeedbackCategory[];
  isLoading: boolean;
}

export interface FeedbackHistoryCardProps {
  feedback: UserFeedbackHistory;
}

export interface ServiceSelectionCardProps {
  service: ServiceWithOrderDetails;
  onSelect: () => void;
  disabled?: boolean;
}