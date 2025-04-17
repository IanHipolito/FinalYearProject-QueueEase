from django.urls import path
from .views import (
    # Auth views
    login_view, signup_view, admin_signup, save_fcm_token,
    
    # Queue views
    create_queue, queue_detail, complete_queue, active_queue, get_qr_code, 
    validate_qr, update_queue_position, leave_queue, queue_history, 
    service_queues, user_analytics, transfer_queue,
    
    # Service views
    api_overview, list_services, service_detail, available_appointment_times, 
    list_services_with_status,
    
    # Appointment views
    user_appointments, appointment_detail, check_in_appointment,
    delete_appointment, create_appointment, cancel_appointment, start_appointment_service,
    complete_appointment_service, set_appointment_delay,
    
    # Admin views
    admin_dashboard_data, admin_customers,
    admin_get_analytics, notification_settings, admin_todays_appointments,
    admin_company_info, admin_update_company_info, admin_change_password,
    
    # Feedback views
    submit_feedback, get_feedback_categories, get_user_feedback_history,
    get_eligible_services,
)
from django.http import JsonResponse


def test_view(request):
    return JsonResponse({"message": "This is a test view!"})


urlpatterns = [
    path('test/', test_view, name='test_view'),
    path('', api_overview, name='api-overview'),
    
    # Queue endpoints
    path('create-queue/', create_queue, name='create-queue'),
    path('queue-detail/<int:queue_id>/', queue_detail, name='queue_detail'),
    path('queue-complete/<int:queue_id>/', complete_queue, name='complete_queue'),
    path('active-queue/<int:user_id>/', active_queue, name='active-queue'),
    path('get-qr-code/<int:queue_id>/', get_qr_code, name='get-qr-code'),
    path('validate-qr/', validate_qr, name='validate-qr'),
    path('update-queue-position/<int:queue_id>/', update_queue_position, name='update-queue-position'),
    path('leave-queue/<int:queue_id>/', leave_queue, name='leave_queue'),
    path('user-queues/<int:user_id>/', queue_history, name='user-queues'),
    path('service_queues/<int:service_id>/', service_queues, name='service_queues'),
    path('user-analytics/<int:user_id>/', user_analytics, name='user-analytics'),
    path('transfer-queue/', transfer_queue, name='transfer-queue'),
    
    # Authentication endpoints
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
    path('admin-signup/', admin_signup, name='admin-signup'),
    path('save-fcm-token/', save_fcm_token, name='save-fcm-token'),
    
    # Appointment endpoints
    path('appointments/<int:user_id>/', user_appointments, name='user-appointments'),
    path('appointment/<str:order_id>/', appointment_detail, name='appointment-detail'),
    path('appointment/delete/<str:order_id>/', delete_appointment, name='delete-appointment'),
    path('create-appointment/', create_appointment, name='create-appointment'),
    path('available-times/<int:service_id>/', available_appointment_times, name='available-times'),
    path('appointment/cancel/<str:order_id>/', cancel_appointment, name='cancel-appointment'),
    path('start-appointment/', start_appointment_service, name='start-appointment-service'),
    path('complete-appointment/', complete_appointment_service, name='complete-appointment-service'),
    path('check-in-appointment/', check_in_appointment, name='check-in-appointment'),

    # Service endpoints
    path('list_services/', list_services, name='list_services'),
    path('service/<int:service_id>/', service_detail, name='service-detail'),
    path('list_services_with_status/', list_services_with_status, name='list_services_with_status'),
    
    # Admin endpoints
    path('admin/dashboard-data/', admin_dashboard_data, name='admin-dashboard-data'),
    path('admin/customers/', admin_customers, name='admin-customers'),
    path('admin-get-analytics/', admin_get_analytics, name='admin-get-analytics'),
    path('admin/notification-settings/', notification_settings, name='notification-settings'),
    path('admin/company-info/<int:user_id>/', admin_company_info, name='admin-company-info'),
    path('admin/update-company-info/', admin_update_company_info, name='admin-update-company-info'),
    path('admin/change-password/', admin_change_password, name='admin-change-password'),
    path('admin/todays-appointments/', admin_todays_appointments, name='admin-todays-appointments'),
    path('admin/set-appointment-delay/', set_appointment_delay, name='set-appointment-delay'),
    
    # Feedback endpoints
    path('feedback/submit/', submit_feedback, name='submit_feedback'),
    path('feedback/categories/', get_feedback_categories, name='get_feedback_categories'),
    path('feedback/user/<int:user_id>/', get_user_feedback_history, name='get_user_feedback_history'),
    path('feedback/eligible-services/<int:user_id>/', get_eligible_services, name='get_eligible_services'),
]