from .views.auth_views import (
    login_view, signup_view, admin_signup, save_fcm_token
)

from .views.queue_views import (
    create_queue, queue_detail, complete_queue, active_queue,
    get_qr_code, validate_qr, update_queue_position,
    leave_queue, queue_history, service_queues, user_analytics, transfer_queue
)

from .views.service_views import (
    api_overview, list_services, service_detail,
    available_appointment_times, list_services_with_status
)

from .views.appointment_views import (
    user_appointments, appointment_detail, get_or_create_appointment,
    delete_appointment, create_appointment, cancel_appointment,
    check_and_update_appointments, check_appointment_status
)

from .views.admin_views import (
    admin_dashboard_data, admin_customers, notification_settings,
    admin_create_customer, test_notification, admin_get_analytics,
    admin_company_info, admin_update_company_info, admin_change_password
)

from .views.feedback_views import (
    submit_feedback, get_feedback_categories, get_user_feedback_history,
    get_eligible_services
)
