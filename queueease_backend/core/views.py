from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import qrcode
from django.shortcuts import get_object_or_404
from io import BytesIO
from .models import Queue, QRCode, User, Service, Feedback, AppointmentDetails, ServiceWaitTime, QueueSequence, QueueSequenceItem, ServiceAdmin, FCMToken
from rest_framework.decorators import api_view
from rest_framework.response import Response
import logging
from django.contrib.auth.hashers import make_password
from rest_framework import status
from django.db import models
from django.contrib.auth.hashers import check_password
import json
from .serializers import AppointmentDetailsSerializer
from datetime import datetime, timedelta
import random
from .serializers import ServiceSerializer
import numpy as np
from .services.notifications import send_push_notification, send_queue_update_notification, send_appointment_reminder
from .utils.sentiment_analyzer import SentimentAnalyzer
from .utils.keyword_extractor import KeywordExtractor
from django.utils import timezone
from collections import defaultdict

logger = logging.getLogger(__name__)

from django.http import JsonResponse

# SERVICE_OPTIONS = {
#     "General Checkup": 15,
#     "Dentist": 30,
#     "Surgery": 60,
#     "Restaurant": 90,
#     "McDonald's": 5,
#     "Burger King": 7,
# }

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

            # Check if user is an admin
            is_admin = user.user_type == 'admin'
            
            # Get services this admin manages (empty list if not admin)
            managed_services = []
            if is_admin:
                service_admins = ServiceAdmin.objects.filter(user=user).select_related('service')
                managed_services = [{
                    'id': sa.service.id,
                    'name': sa.service.name,
                    'is_owner': sa.is_owner,
                    'description': sa.service.description
                } for sa in service_admins]

            return JsonResponse({
                'message': 'Login successful!',
                'user_id': user.id,
                'name': user.name,
                'email': user.email,
                'user_type': user.user_type,
                'is_admin': is_admin,
                'managed_services': managed_services
            }, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

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
    minimal_prep = service.minimal_prep_time or 5
    wave_number = (position - 1) // parallel_capacity
    base_wait = wave_number * default_avg_duration

    if service.requires_prep_time and wave_number == 0:
        base_wait = max(base_wait, minimal_prep)

    if historical_data:
        avg_historical_wait = np.mean(historical_data)
    else:
        avg_historical_wait = base_wait

    is_fast_food = (
        service.category and service.category.lower() == 'fast food' or
        service.name in ["McDonald's", "Burger King"]
    )
    
    if is_fast_food:
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

@api_view(['POST'])
def check_and_complete_queue(request, queue_id):
    try:
        queue_item = get_object_or_404(Queue, id=queue_id)
        
        if queue_item.status != 'pending':
            return Response({
                "message": "Queue is already processed",
                "status": queue_item.status
            })
        
        # Check if the expected_ready_time has passed
        if queue_item.expected_ready_time and queue_item.expected_ready_time <= timezone.now():
            queue_item.status = 'completed'
            queue_item.save()
            
            # Record wait time for analytics
            if queue_item.date_created:
                wait_time = int((queue_item.expected_ready_time - queue_item.date_created).total_seconds() / 60)
                ServiceWaitTime.objects.create(service=queue_item.service, wait_time=wait_time)
            
            return Response({
                "message": "Queue automatically marked as completed", 
                "status": "completed"
            })
            
        return Response({
            "message": "Queue is still pending",
            "status": "pending",
            "remaining_time": int((queue_item.expected_ready_time - timezone.now()).total_seconds())
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# @api_view(['GET'])
# def queue_detail(request, queue_id):
#     queue_item = get_object_or_404(Queue, id=queue_id)

#     total_wait = 0
#     if queue_item.expected_ready_time:
#         total_wait = int((queue_item.expected_ready_time - queue_item.date_created).total_seconds())

#     if queue_item.status != 'pending':
#         return Response({
#             "queue_id": queue_item.id,
#             "service_name": queue_item.service.name,
#             "current_position": None,
#             "status": queue_item.status,
#             "expected_ready_time": queue_item.expected_ready_time.isoformat() if queue_item.expected_ready_time else None,
#             "total_wait": total_wait,
#             "time_created": queue_item.date_created.isoformat()
#         })

#     pending_queues = Queue.objects.filter(
#         service=queue_item.service,
#         status='pending',
#         is_active=True
#     ).order_by('date_created')

#     new_position = pending_queues.filter(date_created__lt=queue_item.date_created).count() + 1

#     data = {
#         "queue_id": queue_item.id,
#         "service_name": queue_item.service.name,
#         "current_position": new_position,
#         "status": queue_item.status,
#         "expected_ready_time": queue_item.expected_ready_time.isoformat() if queue_item.expected_ready_time else None,
#         "total_wait": total_wait,
#         "time_created": queue_item.date_created.isoformat()
#     }
#     return Response(data)

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

    # Auto-complete check: If pending and expected time has passed, mark as completed
    if queue_item.status == 'pending' and queue_item.expected_ready_time and queue_item.expected_ready_time <= timezone.now():
        queue_item.status = 'completed'
        queue_item.save()
        
        # Record wait time for analytics
        wait_time = int((queue_item.expected_ready_time - queue_item.date_created).total_seconds() / 60)
        ServiceWaitTime.objects.create(service=queue_item.service, wait_time=wait_time)

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
    data = serializer.data
    
    enhanced_data = []
    for item, appointment in zip(data, appointments):
        item['service_name'] = appointment.service.name
        item['category'] = appointment.service.category
        item['appointment_title'] = f"{appointment.service.name} Appointment" 
        enhanced_data.append(item)
    
    return Response(enhanced_data)

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

# def simulate_appointment(user_id):
#     """Simulate realistic appointment data for demonstration purposes."""
#     service_name = random.choice(list(SERVICE_OPTIONS.keys()))
#     service, _ = Service.objects.get_or_create(name=service_name, defaults={"description": f"{service_name} description"})
    
#     appointment_date = datetime.now() + timedelta(days=random.randint(1, 30))
#     appointment_time = appointment_date.replace(hour=random.randint(8, 17), minute=random.choice([0, 15, 30, 45]))
#     duration_minutes = SERVICE_OPTIONS[service_name]
#     order_id = generate_order_id(user_id)

#     appointment = AppointmentDetails.objects.create(
#         order_id=order_id,
#         user_id=user_id,
#         service=service,
#         appointment_date=appointment_date.date(),
#         appointment_time=appointment_time.time(),
#         duration_minutes=duration_minutes,
#         status="pending",
#         queue_status="not_started",
#         is_active=True
#     )

#     return appointment

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
        
        average_duration = queue.service.average_duration or 15
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
    """Update queue position and notify user"""
    try:
        queue = Queue.objects.get(id=queue_id)
        
        # Calculate current position
        position = Queue.objects.filter(
            service=queue.service,
            status='pending',
            is_active=True,
            date_created__lt=queue.date_created
        ).count() + 1
        
        # Only notify if position changed significantly (e.g., every 2 positions)
        if hasattr(queue, '_prev_position') and abs(queue._prev_position - position) < 2:
            return Response({"success": True, "notification": "skipped"})
            
        # Store current position for next comparison
        queue._prev_position = position
        
        # Get user's FCM token
        try:
            fcm_token = FCMToken.objects.filter(user=queue.user, is_active=True).latest('updated_at')
            token = fcm_token.token
            
            # Calculate estimated wait time
            wait_time = 5  # Default
            if queue.expected_ready_time:
                import datetime
                now = datetime.datetime.now(queue.expected_ready_time.tzinfo)
                wait_time = max(0, int((queue.expected_ready_time - now).total_seconds() / 60))
            
            # Send notification
            send_queue_update_notification(
                token=token,
                queue_id=queue_id,
                position=position,
                wait_time=wait_time,
                service_name=queue.service.name
            )
            
            return Response({
                "success": True,
                "position": position,
                "notification": "sent"
            })
            
        except FCMToken.DoesNotExist:
            return Response({
                "success": True,
                "position": position,
                "notification": "no token found"
            })
            
    except Queue.DoesNotExist:
        return Response({"error": "Queue not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

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
        if (first_item):
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

@api_view(['POST'])
def admin_signup(request):
    try:
        data = request.data
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone_number = data.get('phoneNumber')
        service_id = data.get('serviceId')
        
        if not all([name, email, password, phone_number, service_id]):
            return Response({'error': 'All fields are required.'}, status=400)
            
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered.'}, status=400)
            
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found.'}, status=404)
            
        user = User.objects.create(
            name=name,
            email=email,
            mobile_number=phone_number,
            password=make_password(password),
            user_type='admin'
        )
        
        ServiceAdmin.objects.create(
            user=user,
            service=service,
            is_owner=True
        )
        
        return Response({
            'message': 'Admin account created successfully.',
            'user_id': user.id
        }, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
def admin_services(request, user_id):
    """Get all services an admin can manage"""
    try:
        user = User.objects.get(id=user_id, user_type='admin')
        service_admins = ServiceAdmin.objects.filter(user=user)
        
        services = []
        for sa in service_admins:
            service_data = {
                'id': sa.service.id,
                'name': sa.service.name,
                'description': sa.service.description,
                'category': sa.service.category,
                'is_owner': sa.is_owner,
                'queue_length': Queue.objects.filter(
                    service=sa.service, 
                    status='pending',
                    is_active=True
                ).count()
            }
            services.append(service_data)
            
        return Response(services)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
def admin_dashboard_data(request):
    """Get dashboard data for a specific service"""
    try:
        service_id = request.query_params.get('service_id')
        if not service_id:
            return Response({'error': 'Service ID is required'}, status=400)
            
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=404)
            
        customer_count = Queue.objects.filter(
            service=service, 
            status='pending', 
            is_active=True
        ).count()
        
        queue_count = QueueSequence.objects.filter(
            items__service=service, 
            is_active=True
        ).distinct().count()
        
        latest_orders = []
        
        if service.service_type == 'immediate':
            latest_queue_entries = Queue.objects.filter(
                service=service
            ).order_by('-date_created')[:5]
            
            for queue in latest_queue_entries:
                latest_orders.append({
                    'id': queue.id,
                    'service_name': service.name,
                    'status': queue.status,
                    'date': queue.date_created.strftime('%Y-%m-%d'),
                    'customer_name': queue.user.name if hasattr(queue, 'user') else 'Customer',
                    'time': queue.date_created.strftime('%H:%M')
                })
            
            order_count = Queue.objects.filter(service=service).count()
            
        else:
            latest_appointments = AppointmentDetails.objects.filter(
                service=service
            ).order_by('-appointment_date', '-appointment_time')[:5]
            
            for appt in latest_appointments:
                latest_orders.append({
                    'id': appt.order_id,
                    'service_name': service.name,
                    'status': appt.status,
                    'date': appt.appointment_date.strftime('%Y-%m-%d'),
                    'customer_name': appt.user.name if hasattr(appt, 'user') else 'Customer',
                    'time': appt.appointment_time.strftime('%H:%M') if appt.appointment_time else None
                })
            
            order_count = AppointmentDetails.objects.filter(service=service).count()
        
        today = datetime.now().date()
        last_week_start = today - timedelta(days=7)
        previous_week_start = last_week_start - timedelta(days=7)
        
        current_week_count = Queue.objects.filter(
            service=service,
            date_created__gte=last_week_start,
            date_created__lt=today
        ).count()
        
        previous_week_count = Queue.objects.filter(
            service=service,
            date_created__gte=previous_week_start,
            date_created__lt=last_week_start
        ).count()
        
        growth = 0
        if previous_week_count > 0:
            growth_percentage = ((current_week_count - previous_week_count) / previous_week_count) * 100
            growth = round(growth_percentage, 2)
        
        customer_stats = []
        
        for i in range(5):
            day = today - timedelta(days=i)
            day_count = Queue.objects.filter(
                service=service,
                date_created__date=day
            ).count()
            
            scaled_count = min(80, max(10, day_count * 10)) if day_count else 20
            customer_stats.append(scaled_count)
        
        customer_stats.reverse()
        
        return Response({
            'customer_count': customer_count,
            'queue_count': queue_count or 1,
            'order_count': order_count,
            'growth': growth,
            'latest_orders': latest_orders,
            'customer_stats': customer_stats,
            'service_type': service.service_type
        })
    except Exception as e:
        import traceback
        print(f"Dashboard data error: {str(e)}")
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
def list_services_with_status(request):
    """List all services with information about whether they already have an admin"""
    try:
        services = Service.objects.all()
        services_with_admins = ServiceAdmin.objects.values_list('service', flat=True).distinct()
        
        result = []
        for service in services:
            service_data = {
                'id': service.id,
                'name': service.name,
                'description': service.description,
                'category': service.category,
                'location': service.location if hasattr(service, 'location') else None,
                'business_hours': service.business_hours if hasattr(service, 'business_hours') else None,
                'has_admin': service.id in services_with_admins
            }
            result.append(service_data)
            
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
def queue_history(request, user_id):
    try:
        from .models import Queue, User, Service
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": f"User with ID {user_id} not found"}, status=404)
        
        queue_items = Queue.objects.filter(user_id=user_id).order_by('-date_created')
        
        if not queue_items.exists():
            return Response([])
        
        serialized_data = []
        for queue in queue_items:
            try:
                queue_data = {
                    "id": queue.id,
                    "service_name": queue.service.name if hasattr(queue, 'service') and queue.service else "Unknown Service",
                    "category": queue.service.category if hasattr(queue, 'service') and queue.service else "uncategorized",
                    "date_created": queue.date_created.isoformat() if hasattr(queue, 'date_created') else "",
                    "status": queue.status if hasattr(queue, 'status') else "unknown",
                    "waiting_time": queue.waiting_time if hasattr(queue, 'waiting_time') else 0,
                    "position": queue.position if hasattr(queue, 'position') else None
                }
                serialized_data.append(queue_data)
            except Exception as e:
                print(f"Error serializing queue {queue.id}: {str(e)}")
                continue
        
        return Response(serialized_data)
        
    except Exception as e:
        import traceback
        print(f"Error in queue_history: {str(e)}")
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def admin_customers(request):
    try:
        service_id = request.query_params.get('service_id')
        if not service_id:
            return Response({'error': 'Service ID is required'}, status=400)
            
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=404)
            
        user_ids = Queue.objects.filter(service=service).values_list('user', flat=True).distinct()
        users = User.objects.filter(id__in=user_ids)
        
        customers_data = []
        for user in users:
            order_count = Queue.objects.filter(user=user, service=service).count()
            
            last_visit = Queue.objects.filter(
                user=user, 
                service=service
            ).order_by('-date_created').first()
            
            is_active = False
            if last_visit:
                from django.utils import timezone
                thirty_days_ago = timezone.now() - timedelta(days=30)
                is_active = last_visit.date_created > thirty_days_ago
            
            customers_data.append({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone': user.mobile_number,
                'is_active': is_active,
                'order_count': order_count,
                'last_visit': last_visit.date_created.isoformat() if last_visit else None
            })
            
        return Response(customers_data)
    except Exception as e:
        import traceback
        print(f"Error in admin_customers: {str(e)}")
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def admin_create_customer(request):
    try:
        data = request.data
        service_id = data.get('service_id')
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        
        if not all([service_id, name, email]):
            return Response({'error': 'Service ID, name, and email are required'}, status=400)
            
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=404)
            
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=400)
            
        user = User.objects.create(
            name=name,
            email=email,
            mobile_number=phone,
            user_type='customer',
            signup_type='regular'
        )
        
        Queue.objects.create(
            user=user,
            service=service,
            sequence_number=0,
            status='completed'
        )
        
        return Response({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': user.mobile_number,
            'is_active': True
        }, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
def save_fcm_token(request):
    """Save a FCM token for a user"""
    try:
        user_id = request.data.get('user_id')
        fcm_token = request.data.get('fcm_token')
        
        if not user_id or not fcm_token:
            return Response({"error": "User ID and FCM token are required"}, status=400)
        
        user = User.objects.get(id=user_id)
        
        # Save or update the token
        FCMToken.objects.update_or_create(
            user=user,
            token=fcm_token,
            defaults={'is_active': True}
        )
        
        return Response({"success": True, "message": "FCM token saved successfully"})
    
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    except Exception as e:
        logger.error(f"Error saving FCM token: {str(e)}")
        return Response({"error": str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
def test_notification(request):
    """Test sending a notification to a user"""
    try:
        user_id = request.data.get('user_id')
        title = request.data.get('title', 'QueueEase Notification')
        body = request.data.get('body', 'This is a test notification')
        notification_type = request.data.get('notification_type', 'custom')
        data = request.data.get('data', {})
        
        if not user_id:
            return Response({"error": "User ID is required"}, status=400)
        
        # Get FCM token for the user
        try:
            token_obj = FCMToken.objects.filter(user_id=user_id, is_active=True).latest('updated_at')
            token = token_obj.token
        except FCMToken.DoesNotExist:
            return Response({
                "error": "FCM token not found for this user"
            }, status=400)
        
        # Send different types of notifications based on the type
        if notification_type == 'queue_update':
            queue_id = data.get('queue_id', '1')
            position = 3  # Example position
            wait_time = 15  # Example wait time in minutes
            service_name = "Test Service"
            
            result = send_queue_update_notification(
                token=token,
                queue_id=queue_id,
                position=position,
                wait_time=wait_time,
                service_name=service_name
            )
        else:
            # Generic notification
            result = send_push_notification(
                token=token,
                title=title,
                body=body,
                data=data
            )
        
        if result.get('success'):
            return Response({
                "success": True,
                "message": "Notification sent successfully",
                "details": result
            })
        else:
            return Response({
                "success": False,
                "error": "Failed to send notification",
                "details": result
            }, status=500)
    
    except Exception as e:
        logger.error(f"Error sending test notification: {str(e)}")
        return Response({"error": str(e)}, status=500)
    
def process_queues(service_id):
    """Process queues for a service and send appropriate notifications"""
    queues = Queue.objects.filter(
        service_id=service_id,
        status='pending',
        is_active=True
    ).order_by('date_created')
    
    # Update positions and notify users
    for index, queue in enumerate(queues):
        position = index + 1
        
        # Decide when to notify
        should_notify = False
        
        # Always notify for position 1-3
        if position <= 3:
            should_notify = True
        # Notify every 5 positions for higher numbers
        elif position % 5 == 0:
            should_notify = True
        # Notify on significant wait time changes
        elif queue.expected_ready_time and hasattr(queue, '_last_notified_wait_time'):
            import datetime
            now = datetime.datetime.now(queue.expected_ready_time.tzinfo)
            current_wait = max(0, int((queue.expected_ready_time - now).total_seconds() / 60))
            last_wait = getattr(queue, '_last_notified_wait_time', 0)
            
            # Notify if wait time changed by more than 10 minutes
            if abs(current_wait - last_wait) >= 10:
                should_notify = True
                queue._last_notified_wait_time = current_wait
        
        if should_notify:
            # Get user's token
            try:
                fcm_token = FCMToken.objects.filter(user=queue.user, is_active=True).latest('updated_at')
                
                # Calculate wait time
                wait_time = 5  # Default
                if queue.expected_ready_time:
                    import datetime
                    now = datetime.datetime.now(queue.expected_ready_time.tzinfo)
                    wait_time = max(0, int((queue.expected_ready_time - now).total_seconds() / 60))
                
                send_queue_update_notification(
                    token=fcm_token.token,
                    queue_id=queue.id,
                    position=position,
                    wait_time=wait_time,
                    service_name=queue.service.name
                )
                
            except FCMToken.DoesNotExist:
                pass

def send_appointment_reminders():
    from datetime import datetime, timedelta
    now = datetime.now()
    
    one_hour_from_now = now + timedelta(hours=1)
    
    upcoming_appointments = AppointmentDetails.objects.filter(
        appointment_date=now.date(),
        status='pending',
        is_active=True
    )
    
    for appointment in upcoming_appointments:
        appointment_datetime = datetime.combine(
            appointment.appointment_date,
            appointment.appointment_time
        )
        
        time_delta = appointment_datetime - now
        minutes_until = max(0, int(time_delta.total_seconds() / 60))
        should_notify = minutes_until in [60, 30, 10]
        
        if should_notify:
            try:
                fcm_token = FCMToken.objects.filter(
                    user=appointment.user, 
                    is_active=True
                ).latest('updated_at')
                
                send_appointment_reminder(
                    token=fcm_token.token,
                    appointment_id=appointment.order_id,
                    service_name=appointment.service.name,
                    time_until=minutes_until
                )
                
            except FCMToken.DoesNotExist:
                pass

@api_view(['POST'])
def submit_feedback(request):
    try:
        data = request.data
        required_fields = ['service_id', 'rating', 'user_id', 'categories']
        
        for field in required_fields:
            if field not in data:
                return Response({'error': f'Missing required field: {field}'}, status=400)
        
        service = get_object_or_404(Service, id=data['service_id'])
        user = get_object_or_404(User, id=data['user_id'])
        order_id = data.get('order_id')
        queue = None
        if order_id:
            queue = Queue.objects.filter(id=order_id).first()
        
        existing_feedback = Feedback.objects.filter(
            user=user,
            service=service,
            queue=queue
        ).exists()
        
        if existing_feedback:
            return Response({'error': 'You have already submitted feedback for this service'}, status=400)
        
        comment = data.get('comment', '')
        sentiment_result = SentimentAnalyzer.analyze(comment)
        
        feedback = Feedback.objects.create(
            user=user,
            service=service,
            queue=queue,
            rating=data['rating'],
            comment=comment,
            categories=data.get('categories', []),
            sentiment=sentiment_result['sentiment']
        )
        
        return Response({
            'id': feedback.id,
            'message': 'Feedback submitted successfully',
            'sentiment': sentiment_result['sentiment']
        }, status=201)
    
    except Exception as e:
        print(f"Error in submit_feedback: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_feedback_categories(request):
    categories = [
        {"id": "wait_time", "name": "Wait Time"},
        {"id": "staff", "name": "Staff Service"},
        {"id": "cleanliness", "name": "Cleanliness"},
        {"id": "communication", "name": "Communication"},
        {"id": "app_experience", "name": "App Experience"},
        {"id": "value", "name": "Value for Money"},
        {"id": "product_quality", "name": "Product Quality"},
        {"id": "atmosphere", "name": "Atmosphere"}
    ]
    return Response(categories)

@api_view(['GET'])
def get_user_feedback_history(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
        feedbacks = Feedback.objects.filter(user=user).order_by('-created_at')
        
        result = []
        for fb in feedbacks:
            order_details = "General Service"
            if fb.queue:
                order_details = f"Queue #{fb.queue.id}"
            
            result.append({
                "id": fb.id,
                "service_name": fb.service.name,
                "order_details": order_details,
                "rating": fb.rating,
                "date": fb.created_at.isoformat(),
                "comment": fb.comment,
                "categories": fb.categories,
                "sentiment": fb.sentiment
            })
        
        return Response(result)
    
    except Exception as e:
        print(f"Error in get_user_feedback_history: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_eligible_services(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
        
        queues = Queue.objects.filter(user=user).order_by('-date_created')
        
        result = []
        for queue in queues:
            has_feedback = Feedback.objects.filter(
                user=user,
                service=queue.service,
                queue=queue
            ).exists()
            
            result.append({
                "id": queue.service.id,
                "name": queue.service.name,
                "order_id": queue.id,
                "order_details": f"Queue #{queue.id}",
                "date": queue.date_created.isoformat(),
                "has_feedback": has_feedback
            })
        
        return Response(result)
    
    except Exception as e:
        print(f"Error in get_eligible_services: {str(e)}")
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
def admin_get_analytics(request):
    try:
        service_id = request.GET.get('service_id')
        period = request.GET.get('period', 'month')
        
        if not service_id:
            return Response({'error': 'service_id is required'}, status=400)
            
        service = get_object_or_404(Service, id=service_id)
        
        today = timezone.now()
        if period == 'week':
            start_date = today - timezone.timedelta(days=7)
        elif period == 'month':
            start_date = today - timezone.timedelta(days=30)
        else:
            start_date = today - timezone.timedelta(days=365)
            
        feedbacks = Feedback.objects.filter(
            service=service,
            created_at__gte=start_date
        ).order_by('-created_at')
        
        total_feedbacks = feedbacks.count()
        if total_feedbacks > 0:
            positive_feedbacks = feedbacks.filter(sentiment='positive').count()
            satisfaction_rate = int((positive_feedbacks / total_feedbacks) * 100)
        else:
            satisfaction_rate = 0
            
        category_distribution = {}
        for feedback in feedbacks:
            for category in feedback.categories:
                if category not in category_distribution:
                    category_distribution[category] = {
                        'satisfied': 0,
                        'neutral': 0,
                        'dissatisfied': 0,
                        'total': 0
                    }
                
                if feedback.rating >= 4:
                    category_distribution[category]['satisfied'] += 1
                elif feedback.rating <= 2:
                    category_distribution[category]['dissatisfied'] += 1
                else:
                    category_distribution[category]['neutral'] += 1
                    
                category_distribution[category]['total'] += 1
                
        feedback_distribution = []
        for category, counts in category_distribution.items():
            total = counts['total']
            if total > 0:
                feedback_distribution.append({
                    'id': len(feedback_distribution) + 1,
                    'category': category,
                    'satisfied': int((counts['satisfied'] / total) * 100),
                    'neutral': int((counts['neutral'] / total) * 100),
                    'dissatisfied': int((counts['dissatisfied'] / total) * 100),
                    'total': total
                })
                
        comments = []
        comment_texts = []
        comment_sentiments = {}
        
        for feedback in feedbacks[:10]:
            user = feedback.user
            queue_name = f"Queue #{feedback.queue.id}" if feedback.queue else "General"
            
            comment_data = {
                'id': feedback.id,
                'name': user.name,
                'date': feedback.created_at.strftime("%b %d, %Y"),
                'queue': queue_name,
                'rating': feedback.rating,
                'comment': feedback.comment,
                'sentiment': feedback.sentiment
            }
            comments.append(comment_data)
            
            if feedback.comment:
                comment_texts.append(feedback.comment)
                comment_sentiments[feedback.comment] = feedback.sentiment
            
        keyword_extractor = KeywordExtractor()
        keywords = keyword_extractor.extract_keywords(comment_texts, comment_sentiments)
            
        avg_wait_time = 0
        historical_data = ServiceWaitTime.objects.filter(
            service=service,
            date_recorded__gte=start_date
        )
        
        if historical_data.exists():
            avg_wait_time = int(historical_data.aggregate(
                avg_time=models.Avg('wait_time')
            )['avg_time'] or 0)
        else:
            queues = Queue.objects.filter(service=service, status='completed')
            if queues.exists():
                total_wait_time = 0
                count = 0
                for queue in queues:
                    if hasattr(queue, 'total_wait') and queue.total_wait:
                        wait_minutes = queue.total_wait / 60 if queue.total_wait > 1000 else queue.total_wait
                        total_wait_time += wait_minutes
                        count += 1
                    elif hasattr(queue, 'expected_ready_time') and queue.expected_ready_time and hasattr(queue, 'date_created'):
                        wait_minutes = (queue.expected_ready_time - queue.date_created).total_seconds() / 60
                        total_wait_time += wait_minutes
                        count += 1
                
                if count > 0:
                    avg_wait_time = int(total_wait_time / count)
                
        return Response({
            'feedback_distribution': feedback_distribution,
            'customer_comments': comments,
            'total_reports': total_feedbacks,
            'satisfaction_rate': satisfaction_rate,
            'average_wait_time': avg_wait_time,
            'satisfaction_trend': calculate_satisfaction_trend(feedbacks, period),
            'wait_time_trend': calculate_wait_time_trend(service, period),
            'feedback_keywords': keywords
        })
        
    except Exception as e:
        print(f"Error in admin_get_analytics: {str(e)}")
        return Response({'error': str(e)}, status=500)

def calculate_satisfaction_trend(feedbacks, period):
    if not feedbacks:
        return [0] * 12

    now = timezone.now()
    data_points = 12
    
    if period == 'week':
        data_points = 7
        interval_duration = timedelta(days=1)
        start_date = now - timedelta(days=7)
    elif period == 'month':
        interval_duration = timedelta(days=2.5)
        start_date = now - timedelta(days=30)
    else:
        interval_duration = timedelta(days=30.5)
        start_date = now - timedelta(days=366)
    
    time_buckets = []
    bucket_labels = []
    
    for i in range(data_points):
        bucket_start = start_date + (i * interval_duration)
        bucket_end = start_date + ((i + 1) * interval_duration)
        time_buckets.append((bucket_start, bucket_end))
        
        if period == 'week':
            bucket_labels.append(bucket_start.strftime('%a'))
        elif period == 'month':
            day = bucket_start.day
            if day == 1 or i == 0:
                bucket_labels.append(bucket_start.strftime('%d %b'))
            else:
                bucket_labels.append(str(day))
        else:
            bucket_labels.append(bucket_start.strftime('%b'))
    
    bucket_totals = [0] * data_points
    bucket_positives = [0] * data_points
    
    for feedback in feedbacks:
        feedback_time = feedback.created_at
        
        for i, (bucket_start, bucket_end) in enumerate(time_buckets):
            if bucket_start <= feedback_time < bucket_end:
                bucket_totals[i] += 1
                if feedback.sentiment == 'positive':
                    bucket_positives[i] += 1
                break
    
    trend = []
    for total, positive in zip(bucket_totals, bucket_positives):
        if total > 0:
            satisfaction = int((positive / total) * 100)
            trend.append(satisfaction)
        else:
            trend.append(trend[-1] if trend else 0)
    
    return trend

def calculate_wait_time_trend(service, period):
    now = timezone.now()
    data_points = 12
    
    if period == 'week':
        data_points = 7
        interval_duration = timedelta(days=1)
        start_date = now - timedelta(days=7)
    elif period == 'month':
        interval_duration = timedelta(days=2.5)
        start_date = now - timedelta(days=30)
    else:
        interval_duration = timedelta(days=30.5)
        start_date = now - timedelta(days=366)
    
    time_buckets = []
    
    for i in range(data_points):
        bucket_start = start_date + (i * interval_duration)
        bucket_end = start_date + ((i + 1) * interval_duration)
        time_buckets.append((bucket_start, bucket_end))
    
    bucket_wait_times = [[] for _ in range(data_points)]
    
    historical_data = ServiceWaitTime.objects.filter(
        service=service,
        date_recorded__gte=start_date
    )
    
    for record in historical_data:
        if not record.date_recorded:
            continue
        
        for i, (bucket_start, bucket_end) in enumerate(time_buckets):
            if bucket_start <= record.date_recorded < bucket_end:
                bucket_wait_times[i].append(record.wait_time)
                break
    
    trend = []
    for wait_times in bucket_wait_times:
        if wait_times:
            if len(wait_times) >= 3:
                wait_times_array = np.array(wait_times)
                lower_bound = np.percentile(wait_times_array, 5)
                upper_bound = np.percentile(wait_times_array, 95)
                filtered_times = wait_times_array[(wait_times_array >= lower_bound) & (wait_times_array <= upper_bound)]
                avg_wait = int(np.mean(filtered_times))
            else:
                avg_wait = int(np.mean(wait_times))
            
            trend.append(avg_wait)
        else:
            trend.append(trend[-1] if trend else 0)
    
    return trend

@api_view(['GET'])
def check_feedback_eligibility(request):
    try:
        user_id = request.GET.get('user_id')
        service_id = request.GET.get('service_id')
        order_id = request.GET.get('order_id')
        
        if not all([user_id, service_id]):
            return Response({'error': 'User ID and Service ID are required'}, status=400)
        
        queue = None
        if order_id:
            queue = Queue.objects.filter(id=order_id).first()
            
        existing_feedback = Feedback.objects.filter(
            user_id=user_id,
            service_id=service_id,
            queue=queue
        ).exists()
        
        return Response({
            'eligible': not existing_feedback,
            'reason': 'Feedback already submitted' if existing_feedback else None
        })
        
    except Exception as e:
        print(f"Error in check_feedback_eligibility: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def leave_queue(request, queue_id):
    try:
        queue = get_object_or_404(Queue, id=queue_id)
        
        # Check if queue is already completed or inactive
        if queue.status != 'pending' or not queue.is_active:
            return Response({"error": "This queue has already been completed or is inactive"}, status=400)
        
        # Check if it's within the time window (3 minutes)
        time_window = timedelta(minutes=3)
        if timezone.now() - queue.date_created > time_window:
            return Response(
                {"error": "You can only leave a queue within the first 3 minutes of joining"}, 
                status=400
            )
        
        # Mark the queue as inactive and update status
        queue.is_active = False
        queue.status = 'cancelled'
        queue.save()
        
        return Response({"message": "Successfully left the queue"})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)