from django.urls import path
from .views import api_overview, create_queue, get_qr_code, signup_view, login_view
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
]