export interface Appointment {
    order_id: string;
    appointment_date: string;
    appointment_time: string;
    service_name: string;
    appointment_title: string;
    status: 'pending' | 'completed' | 'cancelled';
    queue_status: 'not_started' | 'in_queue' | 'completed' | 'cancelled';
}

export interface AppointmentDetail {
    order_id: string;
    appointment_date: string;
    appointment_time: string;
    service_name: string;
    queue_status: string;
    status: string;
    estimated_wait_time: number;
    queue_position: number;
    appointment_title: string;
    expected_start_time: string;
}

export interface AppointmentCardProps {
    appointment: {
      order_id: string;
      appointment_date: string;
      appointment_time: string;
      service_name: string;
      appointment_title: string;
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