export interface AnalyticsHistoryEntry {
  id: number;
  date_created: string;
  status: string;
  waiting_time?: string | number;
  service_name: string;
  service_type?: 'immediate' | 'appointment';
  category?: string;
}

export interface ServiceVisit {
  name: string;
  count: number;
}

export interface WaitTimeStatsEntry {
  day: string;
  avgWait: number;
  count: number;
}

export interface WaitTimeByHourEntry {
  hour: number;
  avgWait: number;
  count: number;
}

export interface BusyTimeEntry {
  dayName: string;
  hour: number;
  count: number;
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

export interface AnalyticsData {
  totalQueues: number;
  completedQueues: number;
  canceledQueues: number;
  appointmentCount: number;
  averageWaitTime: number;
  queueHistory: AnalyticsHistoryEntry[];
  mostVisitedServices: ServiceVisit[];
  waitTimeByDay: WaitTimeStatsEntry[];
  waitTimeByHour: WaitTimeByHourEntry[];
  busyTimes: BusyTimeEntry[];
  userFeedback?: UserFeedback[];
  averageRating?: number;
}

export interface AnalyticsApiResponse {
  totalQueues?: number;
  completedQueues?: number;
  canceledQueues?: number;
  averageWaitTime?: number;
  queueHistory?: AnalyticsHistoryEntry[];
  mostVisitedServices?: ServiceVisit[];
  waitTimeByDay?: WaitTimeStatsEntry[];
  waitTimeByHour?: WaitTimeByHourEntry[];
  busyTimes?: BusyTimeEntry[];
}

export interface DayStats {
  day: string;
  avgWait: number;
  count: number;
}

export interface HourStats {
  hour: number;
  avgWait: number;
  count: number;
}

export interface WaitTimeStatsProps {
  data: (DayStats | HourStats)[];
  type: 'day' | 'hour';
}