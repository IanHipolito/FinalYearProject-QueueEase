from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import qrcode
from django.shortcuts import get_object_or_404
from io import BytesIO
from .models import Queue, QRCode, User, Service, EmployeeDetails, AppointmentDetails, ServiceWaitTime, QueueSequence, QueueSequenceItem
from rest_framework.decorators import api_view
from rest_framework.response import Response
import logging
from django.contrib.auth.hashers import make_password
from rest_framework import status
from django.db import models
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
import json
from .serializers import AppointmentDetailsSerializer
from datetime import datetime, timedelta
import random
from .serializers import ServiceSerializer
import numpy as np
from .services.notifications import send_push_notification

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

def compute_expected_ready_time(service, position, historical_data=None):
    parallel_capacity = service.parallel_capacity or 1
    default_avg_duration = service.average_duration or 15
    minimal_prep = service.minimal_prep_time or 3
    wave_number = (position - 1) // parallel_capacity
    base_wait = wave_number * default_avg_duration

    if service.requires_prep_time and wave_number == 0:
        base_wait = max(base_wait, minimal_prep)

    if historical_data:
        avg_historical_wait = np.mean(historical_data)
    else:
        avg_historical_wait = base_wait

    fast_food_services = ["McDonald's", "Burger King"]
    if service.name in fast_food_services:
        estimated_wait = min(avg_historical_wait, base_wait)
        if position > 1:
            estimated_wait = avg_historical_wait
    else:
        estimated_wait = base_wait
        if historical_data:
            estimated_wait = (estimated_wait + avg_historical_wait) / 2

    now = datetime.now()
    return now + timedelta(minutes=estimated_wait)

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

        historical_data = fetch_historical_data(service.id)
        
        queue_item = Queue.objects.create(
            user=user,
            service=service,
            sequence_number=position,
            status='pending'
        )

        queue_item.expected_ready_time = compute_expected_ready_time(service, position, historical_data)
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

def fetch_historical_data(service_id):
    historical_data = ServiceWaitTime.objects.filter(service_id=service_id).values_list('wait_time', flat=True)
    return list(historical_data)

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
    queue_item = get_object_or_404(Queue, id=queue_id)
    queue_item.status = 'completed'
    queue_item.save()

    wait_time = int((queue_item.expected_ready_time - queue_item.date_created).total_seconds() / 60)
    ServiceWaitTime.objects.create(service=queue_item.service, wait_time=wait_time)

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

# @api_view(['GET'])
# def list_services(request):
#     services = Service.objects.filter(is_active=True)
#     data = [{"id": s.id, "name": s.name, "description": s.description} for s in services]
#     return Response(data)

# @api_view(['GET'])
# def list_services(request):
#     services = Service.objects.all()
#     serializer = ServiceSerializer(services, many=True)
#     return Response(serializer.data)

@api_view(['GET'])
def list_services(request):
    try:
        services = Service.objects.filter(is_active=True)
        
        service_data = []
        for service in services:
            try:
                queue_count = Queue.objects.filter(
                    service=service,
                    status='pending',
                    is_active=True
                ).count()
                
                avg_wait_time = ServiceWaitTime.objects.filter(
                    service=service
                ).order_by('-date_recorded')[:5].aggregate(
                    avg_time=models.Avg('wait_time')
                )['avg_time'] or 10
                
                service_dict = {
                    'id': service.id,
                    'name': service.name,
                    'description': service.description,
                    'category': service.category,
                    'service_type': service.service_type,
                    'queue_length': queue_count,
                    'wait_time': avg_wait_time,
                    'latitude': getattr(service, 'latitude'),
                    'longitude': getattr(service, 'longitude')
                }
                service_data.append(service_dict)
            except Exception as service_error:
                print(f"Error processing service {service.name}: {str(service_error)}")
                continue
        
        return Response(service_data)
    except Exception as e:
        print(f"Error in list_services: {str(e)}")
        return Response(
            {"error": "An unexpected error occurred"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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

@api_view(['POST'])
def update_queue_position(request, queue_id):
    queue_item = Queue.objects.get(id=queue_id)
    new_position = queue_item.sequence_number
    estimated_wait = ...

    fcm_token = queue_item.user.fcm_token
    if fcm_token:
        title = "Queue Update"
        body = f"Your position is now {new_position}. Estimated wait time: {estimated_wait} minutes."
        send_push_notification(fcm_token, title, body)
    
    return Response({"message": "Queue updated and notification sent."})

@api_view(['POST'])
def create_queue_sequence(request):
    try:
        user_id = request.data.get('user_id')
        service_ids = request.data.get('service_ids', [])
        user = get_object_or_404(User, id=user_id)
        sequence = QueueSequence.objects.create(user=user)
        
        for position, service_id in enumerate(service_ids, 1):
            service = get_object_or_404(Service, id=service_id)
            QueueSequenceItem.objects.create(
                queue_sequence=sequence,
                service=service,
                position=position
            )
        
        first_item = sequence.items.first()
        if first_item:
            queue = create_queue_for_service(user, first_item.service)
            first_item.queue = queue
            first_item.save()
            
        return Response({
            "message": "Queue sequence created",
            "sequence_id": sequence.id,
            "first_queue_id": first_item.queue.id if first_item else None
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def process_next_queue_in_sequence(request, sequence_id):
    sequence = get_object_or_404(QueueSequence, id=sequence_id)
    
    current_item = sequence.items.filter(completed=False).first()
    if current_item:
        current_item.completed = True
        current_item.save()
    
    next_item = sequence.items.filter(completed=False).first()
    if next_item:
        queue = create_queue_for_service(sequence.user, next_item.service)
        next_item.queue = queue
        next_item.save()
        return Response({
            "message": "Next queue created",
            "queue_id": queue.id
        })
    else:
        sequence.is_active = False
        sequence.save()
        return Response({
            "message": "All queues in sequence completed"
        })

def create_queue_for_service(user, service):
    pending_queues = Queue.objects.filter(
        service=service,
        status='pending',
        is_active=True
    ).order_by('date_created')
    
    position = pending_queues.count() + 1
    historical_data = fetch_historical_data(service.id)
    
    queue_item = Queue.objects.create(
        user=user,
        service=service,
        sequence_number=position,
        status='pending'
    )
    
    queue_item.expected_ready_time = compute_expected_ready_time(service, position, historical_data)
    queue_item.save()
    
    qr_data = f"Queue ID: {queue_item.id}"
    QRCode.objects.create(queue=queue_item, qr_hash=qr_data)
    
    return queue_item

@api_view(['GET'])
def service_detail(request, service_id):
    """
    Fetch details for a specific service
    """
    try:
        service = get_object_or_404(Service, pk=service_id)
        serializer = ServiceSerializer(service)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def available_appointment_times(request, service_id):
    """
    Get available appointment times for a specific service on a specific date
    """
    try:
        service = get_object_or_404(Service, pk=service_id)
        date_str = request.GET.get('date')
        
        if not date_str:
            return Response({"error": "Date parameter is required"}, status=400)
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
        
        existing_appointments = AppointmentDetails.objects.filter(
            service=service,
            appointment_date=date,
            status='pending'
        ).values_list('appointment_time', flat=True)
        
        start_time = datetime.combine(date, datetime.min.time()).replace(hour=9, minute=0)
        end_time = datetime.combine(date, datetime.min.time()).replace(hour=17, minute=0)
        duration = service.average_duration if service.average_duration else 30
        
        available_times = []
        current_time = start_time
        
        while current_time < end_time:
            time_str = current_time.strftime('%H:%M')
            
            if time_str not in [t.strftime('%H:%M') for t in existing_appointments]:
                available_times.append(time_str)
            
            current_time += timedelta(minutes=duration)
        
        return Response({"available_times": available_times})
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def create_appointment(request):
    if request.method != 'POST':
        return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    try:
        data = request.data
        user_id = data.get('user_id')
        service_id = data.get('service_id')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        
        if not all([user_id, service_id, appointment_date, appointment_time]):
            return Response({
                "error": "Missing required fields",
                "required": ["user_id", "service_id", "appointment_date", "appointment_time"],
                "received": data
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": f"User with ID {user_id} not found"}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({"error": f"Service with ID {service_id} not found"}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            if ':' in appointment_time:
                time_obj = datetime.strptime(appointment_time, '%H:%M').time()
            else:
                time_obj = datetime.strptime(appointment_time, '%H%M').time()
        except ValueError:
            return Response({
                "error": "Invalid time format",
                "received": appointment_time,
                "expected": "HH:MM (e.g., 14:30)"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order_id = generate_order_id(user_id)
        
        appointment = AppointmentDetails.objects.create(
            order_id=order_id,
            user=user,
            service=service,
            appointment_date=appointment_date,
            appointment_time=time_obj,
            duration_minutes=service.average_duration or 30,
            status='pending',
            queue_status='not_started',
            is_active=True
        )
        
        return Response({
            "message": "Appointment created successfully",
            "order_id": str(order_id)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        print(f"Error creating appointment: {str(e)}")
        print(traceback.format_exc())
        
        return Response({
            "error": "Failed to create appointment",
            "detail": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)