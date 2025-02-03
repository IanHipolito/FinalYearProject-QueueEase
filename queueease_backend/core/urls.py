from django.urls import path
from .views import api_overview, create_queue, get_qr_code, signup_view, login_view, validate_qr, user_appointments, appointment_detail, get_or_create_appointment
from django.http import JsonResponse

def test_view(request):
    return JsonResponse({"message": "This is a test view!"})


urlpatterns = [
    path('test/', test_view, name='test_view'),
    path('', api_overview, name='api-overview'),
    path('create-queue/', create_queue, name='create-queue'),
    path('get-qr-code/<int:queue_id>/', get_qr_code, name='get-qr-code'),
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
    path('validate-qr/', validate_qr, name='validate-qr'),
    path('appointments/<int:user_id>/', user_appointments, name='user-appointments'),
    path('appointment/<str:order_id>/', appointment_detail, name='appointment-detail'),
    path('appointment/', get_or_create_appointment, name='get_or_create_appointment'),
]