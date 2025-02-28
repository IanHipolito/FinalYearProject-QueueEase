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

SERVICE_OPTIONS = {
    "General Checkup": 15,
    "Dentist": 30,
    "Surgery": 60,
    "Restaurant": 90,
    "McDonald's": 5,
    "Burger King": 7,
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

def compute_expected_ready_time(service, position):
    parallel_capacity = service.parallel_capacity or 1
    avg_duration = service.average_duration or 15
    minimal_prep = service.minimal_prep_time or 3

    wave_number = (position - 1) // parallel_capacity
    base_wait = wave_number * avg_duration

    if service.requires_prep_time and wave_number == 0:
        base_wait = max(base_wait, minimal_prep)

    now = datetime.now()
    return now + timedelta(minutes=base_wait)

@csrf_exempt
@api_view(['POST'])
def create_queue(request):
    try:
        user_id = request.data.get('user_id')
        service_id = request.data.get('service_id')
        if not all([user_id, service_id]):
            return Response({"error": "user_id and service_id are required."}, status=400)

        user = get_object_or_404(User, id=user_id)
        service = get_object_or_404(Service, id=service_id)

        pending_queues = Queue.objects.filter(
            service=service,
            status='pending',
            is_active=True
        ).order_by('date_created')

        position = pending_queues.count() + 1
        queue_item = Queue.objects.create(
            user=user,
            service=service,
            sequence_number=position,
            status='pending'
        )

        queue_item.expected_ready_time = compute_expected_ready_time(service, position)
        queue_item.save()
        qr_data = f"Queue ID: {queue_item.id}"
        qr_code = QRCode.objects.create(queue=queue_item, qr_hash=qr_data)

        return Response({
            "message": "Queue created",
            "queue_id": queue_item.id,
            "position": position,
            "expected_ready_time": queue_item.expected_ready_time.isoformat() if queue_item.expected_ready_time else None,
            "qr_hash": qr_code.qr_hash
        })
    except Exception as e:
        logger.error(f"Error in create_queue: {str(e)}")
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def queue_detail(request, queue_id):
    """
    Return up-to-date information for a queue item, including:
      - current_position (recalculated)
      - expected_ready_time
      - total_wait (in seconds) computed from date_created to expected_ready_time.
    """
    queue_item = get_object_or_404(Queue, id=queue_id)

    total_wait = 0
    if queue_item.expected_ready_time:
        total_wait = int((queue_item.expected_ready_time - queue_item.date_created).total_seconds())

    if queue_item.status != 'pending':
        return Response({
            "queue_id": queue_item.id,
            "service_name": queue_item.service.name,
            "current_position": None,
            "status": queue_item.status,
            "expected_ready_time": queue_item.expected_ready_time.isoformat() if queue_item.expected_ready_time else None,
            "total_wait": total_wait,
            "time_created": queue_item.date_created.isoformat()
        })

    pending_queues = Queue.objects.filter(
        service=queue_item.service,
        status='pending',
        is_active=True
    ).order_by('date_created')

    new_position = pending_queues.filter(date_created__lt=queue_item.date_created).count() + 1

    data = {
        "queue_id": queue_item.id,
        "service_name": queue_item.service.name,
        "current_position": new_position,
        "status": queue_item.status,
        "expected_ready_time": queue_item.expected_ready_time.isoformat() if queue_item.expected_ready_time else None,
        "total_wait": total_wait,
        "time_created": queue_item.date_created.isoformat()
    }
    return Response(data)

@api_view(['POST'])
def complete_queue(request, queue_id):
    """
    Mark a queue item as completed (e.g., staff says order is done).
    This can help us test the 'completed' flow on the frontend.
    """
    queue_item = get_object_or_404(Queue, id=queue_id)
    queue_item.status = 'completed'
    queue_item.save()
    return Response({"message": "Order marked as completed."})


@api_view(['GET'])
def active_queue(request, user_id):
    queue_item = Queue.objects.filter(user_id=user_id, status='pending', is_active=True).order_by('date_created').first()
    if not queue_item:
        return Response({"message": "No active queue found"}, status=404)
    
    data = {
        "queue_id": queue_item.id,
        "service_name": queue_item.service.name,
        "current_position": Queue.objects.filter(
            service=queue_item.service,
            status='pending',
            is_active=True,
            date_created__lt=queue_item.date_created
        ).count() + 1,
    }
    return Response(data)

# @csrf_exempt
# @api_view(['POST'])
# def create_queue(request):
#     if request.method == 'POST':
#         try:
#             # Extract data from the request
#             user_id = request.data.get('user_id')
#             service_id = request.data.get('service_id')
#             employee_id = request.data.get('employee_id')  # optional

#             if not all([user_id, service_id]):
#                 return JsonResponse({"error": "user_id and service_id are required."}, status=400)

#             user = get_object_or_404(User, id=user_id)
#             service = get_object_or_404(Service, id=service_id)
#             employee = None
#             if employee_id:
#                 employee = get_object_or_404(EmployeeDetails, id=employee_id)
            
#             # Check for an existing active queue for this service on the current day
#             existing_queue = Queue.objects.filter(
#                 service=service,
#                 status='pending',
#                 is_active=True,
#                 date_created__date=datetime.now().date()
#             ).first()
#             if existing_queue:
#                 qr_code = QRCode.objects.filter(queue=existing_queue).first()
#                 return JsonResponse({
#                     "queue_id": existing_queue.id,
#                     "user": user.name,
#                     "service": service.name,
#                     "sequence_number": existing_queue.sequence_number,
#                     "qr_hash": qr_code.qr_hash if qr_code else None,
#                     "message": "Existing queue entry used."
#                 })

#             # Create a new queue entry if none exists
#             sequence_number = Queue.objects.filter(service=service, status='pending', is_active=True).count() + 1
#             queue = Queue.objects.create(
#                 user=user,
#                 service=service,
#                 employee=employee,
#                 sequence_number=sequence_number
#             )

#             qr_data = f"Queue ID: {queue.id}"
#             qr_code = QRCode.objects.create(queue=queue, qr_hash=qr_data)

#             return JsonResponse({
#                 "queue_id": queue.id,
#                 "user": user.name,
#                 "service": service.name,
#                 "sequence_number": sequence_number,
#                 "qr_hash": qr_code.qr_hash,
#                 "message": "New queue entry created."
#             })

#         except Exception as e:
#             logger.error(f"Error in create_queue: {str(e)}")
#             return JsonResponse({"error": "An error occurred while creating the queue.", "details": str(e)}, status=500)

#     return JsonResponse({"error": "Invalid request method. Only POST is allowed."}, status=400)



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

@api_view(['GET'])
def appointment_detail(request, order_id):
    appointment = get_object_or_404(AppointmentDetails, order_id=order_id)

    same_day_appointments = AppointmentDetails.objects.filter(
        appointment_date=appointment.appointment_date,
        service=appointment.service
    ).order_by('appointment_time')

    position = list(same_day_appointments).index(appointment) + 1

    average_duration = appointment.duration_minutes or 15  # Default duration

    if appointment.service.requires_prep_time:
        minimal_prep = appointment.service.minimal_prep_time
        estimated_waiting_time = max(minimal_prep, (position - 1) * average_duration)
    else:
        estimated_waiting_time = (position - 1) * average_duration

    serializer = AppointmentDetailsSerializer(appointment)
    data = serializer.data
    data['queue_position'] = position
    data['estimated_wait_time'] = estimated_waiting_time
    data['service_name'] = appointment.service.name
    data['appointment_title'] = f"{appointment.service.name} Appointment"

    appointment_start = datetime.combine(appointment.appointment_date, appointment.appointment_time)
    expected_start_time = appointment_start + timedelta(minutes=estimated_waiting_time)
    data['expected_start_time'] = expected_start_time.isoformat()

    return Response(data)

@api_view(['POST'])
def get_or_create_appointment(request):
    try:
        order_id = request.data.get('order_id')
        user_id = request.data.get('user_id')

        if not order_id or not user_id:
            return Response({"error": "Order ID and User ID are required."}, status=400)

        appointment = AppointmentDetails.objects.filter(order_id=order_id).first()
        if appointment:
            serializer = AppointmentDetailsSerializer(appointment)
            return Response(serializer.data)

        default_service = Service.objects.get(name='Default Service')

        new_appointment = AppointmentDetails.objects.create(
            order_id=order_id,
            user_id=user_id,
            service=default_service,
            appointment_date='2025-01-01',
            appointment_time='09:00:00',
            duration_minutes=30,
            status='pending',
            queue_status='not_started',
            is_active=True
        )

        serializer = AppointmentDetailsSerializer(new_appointment)
        return Response(serializer.data, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


def generate_order_id(user_id):
    """Generate a unique order ID using user ID and timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
    return f"{user_id}-{timestamp}-{random_str}"

def simulate_appointment(user_id):
    """Simulate realistic appointment data for demonstration purposes."""
    service_name = random.choice(list(SERVICE_OPTIONS.keys()))
    service, _ = Service.objects.get_or_create(name=service_name, defaults={"description": f"{service_name} description"})
    
    appointment_date = datetime.now() + timedelta(days=random.randint(1, 30))
    appointment_time = appointment_date.replace(hour=random.randint(8, 17), minute=random.choice([0, 15, 30, 45]))
    duration_minutes = SERVICE_OPTIONS[service_name]
    order_id = generate_order_id(user_id)

    appointment = AppointmentDetails.objects.create(
        order_id=order_id,
        user_id=user_id,
        service=service,
        appointment_date=appointment_date.date(),
        appointment_time=appointment_time.time(),
        duration_minutes=duration_minutes,
        status="pending",
        queue_status="not_started",
        is_active=True
    )

    return appointment

@api_view(['POST'])
def generate_demo_appointments(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({"error": "User ID is required."}, status=400)

    demo_appointments = []
    for i in range(5):
        order_id = generate_order_id(user_id)
        service, _ = Service.objects.get_or_create(name="General Checkup", defaults={"description": "General Checkup", "is_active": True})
        appointment_date = datetime.now().date() + timedelta(days=1)
        appointment_time = (datetime.now().replace(hour=8, minute=0, second=0, microsecond=0) + timedelta(minutes=15 * i)).time()
        appointment = AppointmentDetails.objects.create(
            order_id=order_id,
            user_id=user_id,
            service=service,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            duration_minutes=15,
            status='pending',
            queue_status='not_started',
            is_active=True
        )
        demo_appointments.append(appointment)
    return Response({"message": "Demo appointments generated successfully."})

@api_view(['DELETE'])
def delete_appointment(request, order_id):
    appointment = get_object_or_404(AppointmentDetails, order_id=order_id)
    appointment.delete()
    return Response({"message": "Appointment deleted successfully."}, status=200)

@api_view(['GET'])
def list_services(request):
    services = Service.objects.filter(is_active=True)
    data = [{"id": s.id, "name": s.name, "description": s.description} for s in services]
    return Response(data)

@api_view(['GET'])
def queue_status(request, queue_id):
    try:
        queue = get_object_or_404(Queue, id=queue_id)
        
        pending_queues = Queue.objects.filter(
            service=queue.service,
            status='pending',
            is_active=True
        ).order_by('sequence_number')
        
        if queue.status != 'pending' or queue not in pending_queues:
            current_position = None
        else:
            current_position = list(pending_queues).index(queue) + 1
        
        average_duration = SERVICE_OPTIONS.get(queue.service.name, 15)
        estimated_wait = (current_position - 1) * average_duration if current_position else 0
        
        data = {
            "currentPosition": current_position,
            "estimatedWait": estimated_wait,
            "serviceName": queue.service.name,
            "queueNumber": queue.sequence_number,
            "status": queue.status,
        }
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
