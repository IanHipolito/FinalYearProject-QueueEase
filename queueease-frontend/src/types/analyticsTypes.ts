import { SelectChangeEvent } from '@mui/material/Select';
import { KeywordData } from './feedbackTypes';

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
  average_wait_time: number;
  wait_time_trend: number[];
  satisfaction_trend: number[];
  feedback_keywords: KeywordData[];
  satisfied_pct: number;
  neutral_pct: number;
  dissatisfied_pct: number; 
}

export interface AnalyticsSummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export interface ServiceData {
  name: string;
  count: number;
}

export interface SatisfactionDonutChartProps {
  satisfactionRate: number;
  neutralRate?: number;
  dissatisfiedRate?: number;
}

export interface StatisticCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string | number;
  bgGradient: string;
  chart?: React.ReactNode;
}

export interface FeedbackDistributionChartProps {
  data: FeedbackCategory[];
  timeRange: string;
  onTimeRangeChange: (event: SelectChangeEvent) => void;
}

export interface FeedbackKeywordCloudProps {
  keywords: KeywordData[];
}

export interface FeedbackTableProps {
  data: FeedbackCategory[];
}

export interface FrequentServicesChartProps {
  services: ServiceData[];
}

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  severity: 'positive' | 'negative' | 'neutral' | 'warning';
  recommendations?: string[];
  metric?: string;
  change?: string;
  icon?: React.ReactNode;
}

export interface InsightsSectionProps {
  analyticsData: AnalyticsData;
  timeRange: string;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
