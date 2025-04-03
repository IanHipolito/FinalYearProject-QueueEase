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
    user_appointments, appointment_detail, get_or_create_appointment,
    delete_appointment, create_appointment, check_and_update_appointments, 
    check_appointment_status,
    
    # Admin views
    admin_dashboard_data, admin_customers, admin_create_customer,
    test_notification, admin_get_analytics,
    
    # Feedback views
    submit_feedback, get_feedback_categories, get_user_feedback_history,
    get_eligible_services
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
    path('appointment/add-existing/', get_or_create_appointment, name='get_or_create_appointment'),
    path('appointment/delete/<str:order_id>/', delete_appointment, name='delete-appointment'),
    path('create-appointment/', create_appointment, name='create-appointment'),
    path('available-times/<int:service_id>/', available_appointment_times, name='available-times'),
    path('check-appointments/', check_and_update_appointments, name='check-appointments'),
    path('appointment/check-status/<str:order_id>/', check_appointment_status, name='check-appointment-status'),
    
    # Service endpoints
    path('list_services/', list_services, name='list_services'),
    path('service/<int:service_id>/', service_detail, name='service-detail'),
    path('list_services_with_status/', list_services_with_status, name='list_services_with_status'),
    
    # Admin endpoints
    # path('admin-services/<int:user_id>/', admin_services, name='admin-services'),
    path('admin/dashboard-data/', admin_dashboard_data, name='admin-dashboard-data'),
    path('admin/customers/', admin_customers, name='admin-customers'),
    path('admin/customers/create/', admin_create_customer, name='admin-create-customer'),
    path('test-notification/', test_notification, name='test-notification'),
    path('admin-get-analytics/', admin_get_analytics, name='admin-get-analytics'),
    
    # Feedback endpoints
    path('feedback/submit/', submit_feedback, name='submit_feedback'),
    path('feedback/categories/', get_feedback_categories, name='get_feedback_categories'),
    path('feedback/user/<int:user_id>/', get_user_feedback_history, name='get_user_feedback_history'),
    path('feedback/eligible-services/<int:user_id>/', get_eligible_services, name='get_eligible_services'),
]