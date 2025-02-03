from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import qrcode
from django.shortcuts import get_object_or_404
from io import BytesIO
from .models import Queue, QRCode, User, Service, EmployeeDetails, AppointmentDetails
from rest_framework.decorators import api_view
from rest_framework.response import Response
import logging
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
import json
from .serializers import AppointmentDetailsSerializer
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

from django.http import JsonResponse

SERVICE_TYPES = {
    "General Checkup": 15,
    "Dentist": 30,
    "Surgery": 60,
    "Restaurant": 90,
}

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email', '').strip()
            password = data.get('password', '').strip()

            if not email or not password:
                return JsonResponse({'error': 'Email and password are required.'}, status=400)

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid email or password.'}, status=401)

            # Verify password
            if not check_password(password, user.password):
                return JsonResponse({'error': 'Invalid email or password.'}, status=401)

            return JsonResponse({
                'message': 'Login successful!',
                'user_id': user.id,
                'name': user.name,
                'email': user.email,
                'user_type': user.user_type
            }, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid request body.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method. Only POST is allowed.'}, status=405)

@api_view(['POST'])
def signup_view(request):
    print("Request received:", request.body)
    try:
        data = request.data
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone_number = data.get('phoneNumber')

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
@api_view(['POST'])
def create_queue(request):
    logger.info(f"Request method: {request.method}, Data: {request.data}")
    
    if request.method == 'POST':
        try:
            # Extract data from the request
            user_id = request.data.get('user_id')
            service_id = request.data.get('service_id')
            employee_id = request.data.get('employee_id')

            # Validate input data
            if not all([user_id, service_id]):
                return JsonResponse({"error": "user_id and service_id are required."}, status=400)

            # Fetch the required objects
            user = get_object_or_404(User, id=user_id)
            service = get_object_or_404(Service, id=service_id)
            employee = None
            if employee_id:
                employee = get_object_or_404(EmployeeDetails, id=employee_id)

            # Create the queue object
            sequence_number = Queue.objects.filter(service=service).count() + 1
            queue = Queue.objects.create(
                user=user,
                service=service,
                employee=employee,
                sequence_number=sequence_number
            )

            # Generate QR code hash
            qr_data = f"Queue ID: {queue.id}"
            qr_code = QRCode.objects.create(queue=queue, qr_hash=qr_data)

            return JsonResponse({
                "queue_id": queue.id,
                "user": user.name,
                "service": service.name,
                "sequence_number": sequence_number,
                "qr_hash": qr_code.qr_hash
            })

        except Exception as e:
            logger.error(f"Error in create_queue: {str(e)}")
            return JsonResponse({"error": "An error occurred while creating the queue.", "details": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method. Only POST is allowed."}, status=400)

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
    
@csrf_exempt
@api_view(['POST'])
def validate_qr(request):
    try:
        data = json.loads(request.body)
        qr_hash = data.get('qrHash')

        if not qr_hash:
            return JsonResponse({"error": "QR hash is required."}, status=400)

        qr_code = QRCode.objects.filter(qr_hash=qr_hash).first()
        if not qr_code:
            return JsonResponse({"error": "Invalid QR code."}, status=404)

        queue = qr_code.queue
        return JsonResponse({
            "id": queue.id,
            "service": queue.service.name,
            "status": "Active"
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def user_appointments(request, user_id):
    appointments = AppointmentDetails.objects.filter(user_id=user_id).order_by('-appointment_date')
    serializer = AppointmentDetailsSerializer(appointments, many=True)
    return Response(serializer.data)

# Get appointment details by order ID
@api_view(['GET'])
def appointment_detail(request, order_id):
    appointment = get_object_or_404(AppointmentDetails, order_id=order_id)

    # Retrieve appointments for the same service and date
    same_day_appointments = AppointmentDetails.objects.filter(
        appointment_date=appointment.appointment_date,
        service=appointment.service
    ).order_by('appointment_time')

    # Determine queue position
    position = list(same_day_appointments).index(appointment) + 1

    # Estimate wait time based on average durations
    average_duration = SERVICE_TYPES.get(appointment.service, 15)  # Default to 15 mins if not found
    estimated_waiting_time = (position - 1) * average_duration

    # Include queue data in the response
    serializer = AppointmentDetailsSerializer(appointment)
    data = serializer.data
    data['queue_position'] = position
    data['estimated_wait_time'] = estimated_waiting_time

    return Response(data)

@api_view(['POST'])
def get_or_create_appointment(request):
    try:
        order_id = request.data.get('order_id')
        user_id = request.data.get('user_id')

        if not order_id or not user_id:
            return Response({"error": "Order ID and User ID are required."}, status=400)

        # Check if appointment exists
        appointment = AppointmentDetails.objects.filter(order_id=order_id).first()
        if appointment:
            serializer = AppointmentDetailsSerializer(appointment)
            return Response(serializer.data)

        # Create new appointment if not exists
        default_service = Service.objects.get(name='Default Service')

        new_appointment = AppointmentDetails.objects.create(
            order_id=order_id,
            user_id=user_id,
            service=default_service,
            appointment_date='2025-01-01',  # Replace with actual date
            appointment_time='09:00:00',   # Replace with actual time
            duration_minutes=30,
            status='pending',
            queue_status='not_started',
            is_active=True
        )

        serializer = AppointmentDetailsSerializer(new_appointment)
        return Response(serializer.data, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


def simulate_appointment(order_id, user_id):
    service_name = random.choice(SERVICE_TYPES)
    
    service_instance, created = Service.objects.get_or_create(name=service_name, defaults={
        'description': f"{service_name} description",
        'is_active': True,
    })

    average_duration = 15 if service_name == "General Checkup" else 30
    appointment_date = datetime.now().replace(hour=9, minute=0, second=0) + timedelta(days=random.randint(0, 5))
    appointment_time = appointment_date + timedelta(minutes=random.randint(0, 180))  # Random time within first 3 hours

    # Create the appointment with the Service instance
    appointment = AppointmentDetails.objects.create(
        order_id=order_id,
        user_id=user_id,
        service=service_instance,
        appointment_date=appointment_date,
        appointment_time=appointment_time.time(),
        duration_minutes=average_duration,
        status="pending",
        queue_status="not_started",
        is_active=True
    )

    return appointment
