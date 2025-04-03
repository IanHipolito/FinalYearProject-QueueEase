from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import random
import logging
import traceback
from django.utils import timezone

from ..models import AppointmentDetails, User, Service
from ..serializers import AppointmentDetailsSerializer

logger = logging.getLogger(__name__)

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
    try:
        appointment = get_object_or_404(AppointmentDetails, order_id=order_id)

        # Check if the appointment date has passed and update status if needed
        current_date = timezone.now().date()
        if appointment.status == 'pending' and appointment.appointment_date < current_date:
            # Update the appointment status to completed
            appointment.status = 'completed'
            appointment.save()

        same_day_appointments = AppointmentDetails.objects.filter(
            appointment_date=appointment.appointment_date,
            service=appointment.service
        ).order_by('appointment_time')

        position = list(same_day_appointments).index(appointment) + 1

        average_duration = appointment.duration_minutes or 15

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

        try:
            naive_appointment_start = datetime.combine(appointment.appointment_date, appointment.appointment_time)
            naive_expected_start = naive_appointment_start + timedelta(minutes=estimated_waiting_time)
            # Make timezone aware without assuming specific timezone
            expected_start_time = timezone.make_aware(naive_expected_start)
            data['expected_start_time'] = expected_start_time.isoformat()
        except Exception as e:
            # Fallback if date handling fails
            logger.error(f"Date processing error: {str(e)}")
            current_time = timezone.now()
            data['expected_start_time'] = (current_time + timedelta(minutes=estimated_waiting_time)).isoformat()

        return Response(data)
    except Exception as e:
        logger.error(f"Error in appointment_detail: {str(e)}")
        return Response({"error": "An error occurred processing this appointment"}, status=500)

@api_view(['POST', 'GET'])
def get_or_create_appointment(request):
    try:
        if request.method == 'POST':
            order_id = request.data.get('order_id')
            user_id = request.data.get('user_id')
        else:
            order_id = request.query_params.get('order_id')
            user_id = request.query_params.get('user_id')

        if not order_id or not user_id:
            return Response({"error": "Order ID and User ID are required."}, status=400)

        appointment = AppointmentDetails.objects.filter(order_id=order_id).first()
        if appointment:
            serializer = AppointmentDetailsSerializer(appointment)
            return Response(serializer.data)

        # Only create a new appointment on POST
        if request.method == 'POST':
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
        else:
            return Response({"error": "Appointment not found"}, status=404)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
def generate_order_id(user_id):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
    return f"{user_id}-{timestamp}-{random_str}"

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
        
        appointment_date_obj = datetime.strptime(appointment_date, '%Y-%m-%d').date()
        order_id = generate_order_id(user_id)
        
        appointment = AppointmentDetails.objects.create(
            order_id=order_id,
            user=user,
            service=service,
            appointment_date=appointment_date_obj,
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
        print(f"Error creating appointment: {str(e)}")
        print(traceback.format_exc())
        
        return Response({
            "error": "Failed to create appointment",
            "detail": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def check_and_update_appointments(request):
    try:
        current_date = timezone.now().date()
        
        # Find all pending appointments with dates in the past
        outdated_appointments = AppointmentDetails.objects.filter(
            status='pending',
            appointment_date__lt=current_date
        )
        
        # Update all these appointments to completed
        count = outdated_appointments.count()
        outdated_appointments.update(status='completed')
        
        return Response({
            "message": f"Updated {count} appointments to completed status",
            "count": count
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['GET'])
def check_appointment_status(request, order_id):
    try:
        appointment = get_object_or_404(AppointmentDetails, order_id=order_id)
        
        # Check if the appointment date has passed
        current_date = timezone.now().date()
        current_time = timezone.now().time()
        
        if appointment.status == 'pending':
            if appointment.appointment_date < current_date:
                # Past day
                appointment.status = 'completed'
                appointment.save()
            elif appointment.appointment_date == current_date and appointment.appointment_time < current_time:
                # Same day but time has passed
                appointment.status = 'completed'
                appointment.save()
        
        return Response({
            "success": True,
            "status": appointment.status
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)