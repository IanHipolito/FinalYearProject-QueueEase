export interface Appointment {
    order_id: string;
    appointment_date: string;
    appointment_time: string;
    service_name: string;
    appointment_title: string;
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