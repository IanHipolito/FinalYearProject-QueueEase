from django.urls import path
from .views import (api_overview, create_queue, get_qr_code, signup_view, login_view, validate_qr, 
                   user_appointments, appointment_detail, get_or_create_appointment, generate_demo_appointments, 
                   delete_appointment, list_services, queue_status, queue_detail, complete_queue, active_queue,
                   service_detail, available_appointment_times, create_appointment, admin_signup, admin_services,
                   admin_dashboard_data, list_services_with_status, queue_history, admin_customers, admin_create_customer,
                   save_fcm_token, test_notification, update_queue_position, submit_feedback, get_feedback_categories,
                   get_user_feedback_history, get_eligible_services, check_feedback_eligibility, admin_get_analytics)	
from django.http import JsonResponse

def test_view(request):
    return JsonResponse({"message": "This is a test view!"})


urlpatterns = [
    path('test/', test_view, name='test_view'),
    path('', api_overview, name='api-overview'),
    path('create-queue/', create_queue, name='create-queue'),
    path('queue-detail/<int:queue_id>/', queue_detail, name='queue_detail'),
    path('queue-complete/<int:queue_id>/', complete_queue, name='complete_queue'),
    path('active-queue/<int:user_id>/', active_queue, name='active-queue'),
    path('get-qr-code/<int:queue_id>/', get_qr_code, name='get-qr-code'),
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
    path('validate-qr/', validate_qr, name='validate-qr'),
    path('appointments/<int:user_id>/', user_appointments, name='user-appointments'),
    path('appointment/<str:order_id>/', appointment_detail, name='appointment-detail'),
    path('appointment/add-existing/', get_or_create_appointment, name='get_or_create_appointment'),
    path('generate-demo/', generate_demo_appointments, name='generate-demo'),
    path('appointment/delete/<str:order_id>/', delete_appointment, name='delete-appointment'),
    path('list_services/', list_services, name='list_services'),
    path('queue-status/<int:queue_id>/', queue_status, name='queue-status'),
    path('service/<int:service_id>/', service_detail, name='service-detail'),
    path('available-times/<int:service_id>/', available_appointment_times, name='available-times'),
    path('create-appointment/', create_appointment, name='create-appointment'),
    path('admin-signup/', admin_signup, name='admin-signup'),
    path('admin-services/<int:user_id>/', admin_services, name='admin-services'),
    path('admin/dashboard-data/', admin_dashboard_data, name='admin-dashboard-data'),
    path('list_services_with_status/', list_services_with_status, name='list_services_with_status'),
    path('user-queues/<int:user_id>/', queue_history, name='user-queues'),
    path('admin/customers/', admin_customers, name='admin-customers'),
    path('admin/customers/create/', admin_create_customer, name='admin-create-customer'),
    path('save-fcm-token/', save_fcm_token, name='save-fcm-token'),
    path('test-notification/', test_notification, name='test-notification'),
    path('update-queue-position/<int:queue_id>/', update_queue_position, name='update-queue-position'),
    path('feedback/submit/', submit_feedback, name='submit_feedback'),
    path('feedback/categories/', get_feedback_categories, name='get_feedback_categories'),
    path('feedback/user/<int:user_id>/', get_user_feedback_history, name='get_user_feedback_history'),
    path('feedback/eligible-services/<int:user_id>/', get_eligible_services, name='get_eligible_services'),
    path('feedback/check-eligibility/', check_feedback_eligibility, name='check_feedback_eligibility'),
    path('admin-get-analytics/', admin_get_analytics, name='admin-get-analytics'),
]