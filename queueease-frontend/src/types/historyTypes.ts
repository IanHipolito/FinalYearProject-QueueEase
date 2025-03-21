export interface HistoryEntry {
    id: number;
    service_name: string;
    service_type: 'immediate' | 'appointment';
    category?: string;
    date_created: string;
    status: 'completed' | 'pending' | 'cancelled';
    waiting_time?: number;
    position?: number;
    order_id?: string;
    appointment_date?: string;
    appointment_time?: string;
}