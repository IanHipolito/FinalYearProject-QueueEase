from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import qrcode
from django.shortcuts import get_object_or_404
from io import BytesIO
from .models import Queue, QRCode, User, Service
from rest_framework.decorators import api_view
from rest_framework.response import Response
import logging
from django.contrib.auth.hashers import make_password

logger = logging.getLogger(__name__)

@api_view(['POST'])
def signup_view(request):
    print("Request received:", request.body)
    try:
        data = request.data
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone_number = data.get('phone_number')

        if not all([name, email, password, phone_number]):
            return JsonResponse({'error': 'All fields are required.'}, status=400)

        if User.objects.filter(name=name).exists():
            return JsonResponse({'error': 'Username already exists.'}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists.'}, status=400)

        if User.objects.filter(mobile_number=phone_number).exists():
            return JsonResponse({'error': 'Phone number already exists.'}, status=400)

        user = User.objects.create(
            name=name,
            email=email,
            mobile_number=phone_number,
            password=make_password(password)
        )

        return JsonResponse({'message': 'User created successfully.', 'user_id': user.id})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def api_overview(request):
    return Response({"message": "Welcome to the API!"})

@csrf_exempt
def create_queue(request):
    logger.info(f"Request received: {request.method} {request.body}")
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        service_id = request.POST.get('service_id')
        employee_id = request.POST.get('employee_id')

        user = get_object_or_404(User, id=user_id)
        service = get_object_or_404(Service, id=service_id)
        employee = get_object_or_404(User, id=employee_id)

        queue = Queue.objects.create(
            user_id=user_id,
            service_id=service_id,
            employee_id=employee_id,
            sequence_number=Queue.objects.filter(service_id=service_id).count() + 1
        )

        # Testing 
        qr_data = f"Queue ID: {queue.id}"
        qr_code = QRCode.objects.create(queue=queue, qr_hash=qr_data)

        return JsonResponse({"queue_id": queue.id, "qr_hash": qr_data})

    return JsonResponse({"error": "Invalid request"}, status=400)

def get_qr_code(request, queue_id):
    try:
        qr_code = QRCode.objects.get(queue_id=queue_id)
        qr = qrcode.QRCode(box_size=10, border=4)
        qr.add_data(qr_code.qr_hash)
        img = qr.make_image(fill="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return HttpResponse(buffer, content_type="image/png")
    except QRCode.DoesNotExist:
        return JsonResponse({"error": "QR code not found"}, status=404)
