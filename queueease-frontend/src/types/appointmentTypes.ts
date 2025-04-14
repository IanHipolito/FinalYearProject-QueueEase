export interface Appointment {
    order_id: string;
    appointment_date: string;
    appointment_time: string;
    service_name: string;
    appointment_title: string;
    status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
}

export interface AppointmentDetail {
    order_id: string;
    appointment_date: string;
    appointment_time: string;
    service_name: string;
    status: string;
    estimated_wait_time?: number;
    queue_position: number;
    appointment_title: string;
    expected_start_time: string;
    actual_start_time?: string | null;
    actual_end_time?: string | null;
    delay_minutes?: number | null;
    delay_notified?: boolean;
    check_in_time?: string | null;
    time_until_formatted?: string;
    seconds_until_appointment?: number;
    server_current_time?: string;
}

export const APPOINTMENT_STATUS_DISPLAY = {
    scheduled: 'Scheduled',
    checked_in: 'Checked In',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    missed: 'Missed'
};

export const APPOINTMENT_STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    scheduled: 'primary',
    checked_in: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'error',
    missed: 'error'
};

export interface ManageAppointment {
    order_id: string;
    user_name: string;
    service_name: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    actual_start_time: string | null;
    actual_end_time: string | null;
    delay_minutes: number | null;
    check_in_time: string | null;
}
  
export interface AppointmentManagementProps {
    serviceId: number;
    onRefresh?: () => void;
}

export interface AppointmentCardProps {
    appointment: {
      order_id: string;
      appointment_date: string;
      appointment_time: string;
      service_name: string;
      appointment_title: string;
      status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
    };
    onView: (orderId: string) => void;
    onRemove: (orderId: string) => void;
    formatDate: (dateString: string) => string;
}

export interface AppointmentDetailHeaderProps {
    title: string;
    orderId: string;
}

export interface AppointmentFormProps {
    onSubmit: (orderID: string) => Promise<void>;
    isSubmitting: boolean;
    initialValue?: string;
    buttonText?: string;
}

export interface AppointmentInfoGridProps {
    appointment: {
      service_name: string;
      queue_status: string;
      appointment_date: string;
      appointment_time: string;
      queue_position: number;
    };
    formatDate: (date: string) => string;
}