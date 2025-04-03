from .auth_views import (
    login_view, signup_view, admin_signup, save_fcm_token
)

from .queue_views import (
    create_queue, queue_detail, complete_queue, active_queue,
    get_qr_code, validate_qr, update_queue_position,
    check_and_complete_queue, leave_queue, queue_history, service_queues,
    user_analytics, transfer_queue
)

from .service_views import (
    api_overview, list_services, service_detail,
    available_appointment_times, list_services_with_status
)

from .appointment_views import (
    user_appointments, appointment_detail, get_or_create_appointment,
    delete_appointment, create_appointment, check_and_update_appointments, 
    check_appointment_status
)

from .admin_views import (
    admin_dashboard_data, admin_customers,
    admin_create_customer, test_notification, admin_get_analytics
)

from .feedback_views import (
    submit_feedback, get_feedback_categories, get_user_feedback_history,
    get_eligible_services
)