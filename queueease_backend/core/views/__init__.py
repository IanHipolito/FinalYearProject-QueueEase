from .auth_views import (
    login_view, signup_view, admin_signup, save_fcm_token
)

from .queue_views import (
    create_queue, queue_detail, complete_queue, active_queue,
    get_qr_code, validate_qr, update_queue_position,
    leave_queue, queue_history, service_queues,
    user_analytics, transfer_queue
)

from .service_views import (
    api_overview, list_services, service_detail,
    available_appointment_times, list_services_with_status
)

from .appointment_views import (
    user_appointments, appointment_detail,
    delete_appointment, create_appointment, cancel_appointment, 
    start_appointment_service, complete_appointment_service, 
    check_in_appointment, set_appointment_delay
)

from .admin_views import (
    admin_dashboard_data, admin_customers, notification_settings,
    admin_get_analytics, admin_todays_appointments,
    admin_company_info, admin_update_company_info, admin_change_password
)

from .feedback_views import (
    submit_feedback, get_feedback_categories, get_user_feedback_history,
    get_eligible_services
)
