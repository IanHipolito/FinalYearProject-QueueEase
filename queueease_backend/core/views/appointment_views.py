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
from django.conf import settings
import pytz

from ..models import AppointmentDetails, User, Service, FCMToken
from ..serializers import AppointmentDetailsSerializer
from ..services.notifications import send_appointment_delay_notification


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

        # Only consider active pending appointments (exclude cancelled and completed)
        same_day_appointments = AppointmentDetails.objects.filter(
            appointment_date=appointment.appointment_date,
            service=appointment.service,
            status='pending',  # Only pending appointments
            is_active=True,    # Only active appointments
            queue_status__in=['not_started', 'in_queue']  # Exclude any with completed or cancelled queue status
        ).exclude(
            status='cancelled'  # Explicitly exclude cancelled appointments
        ).order_by('appointment_time')

        # Find the position of this appointment in the filtered list
        position = 0
        for idx, apt in enumerate(same_day_appointments):
            if apt.id == appointment.id:
                position = idx + 1
                break

        # If appointment is completed, cancelled, or not found in the pending list, it has no position
        if appointment.status in ['completed', 'cancelled'] or position == 0:
            if appointment.status == 'pending':
                # Only assign a fallback position if it's still pending
                position = 1
            else:
                position = None

        # Calculate wait time based on position and average duration
        average_duration = appointment.duration_minutes or 15
        
        if position and position > 0:
            if appointment.service.requires_prep_time:
                minimal_prep = appointment.service.minimal_prep_time
                estimated_waiting_time = max(minimal_prep, (position - 1) * average_duration)
            else:
                estimated_waiting_time = (position - 1) * average_duration
        else:
            estimated_waiting_time = 0

        serializer = AppointmentDetailsSerializer(appointment)
        data = serializer.data
        data['queue_position'] = position
        data['estimated_wait_time'] = estimated_waiting_time
        data['service_name'] = appointment.service.name
        data['appointment_title'] = f"{appointment.service.name} Appointment"

        try:
            # Create timezone-aware datetime for consistent handling
            appointment_start = datetime.combine(appointment.appointment_date, appointment.appointment_time)
            irish_tz = pytz.timezone(settings.TIME_ZONE)
            appointment_start = timezone.make_aware(appointment_start, timezone=irish_tz)
            expected_start_time = appointment_start + timedelta(minutes=estimated_waiting_time)

            # Apply any recorded delays
            if appointment.last_delay_minutes:
                expected_start_time += timedelta(minutes=appointment.last_delay_minutes)
                
            # Return ISO format WITHOUT timezone designator that would force UTC
            data['expected_start_time'] = expected_start_time.isoformat().replace('+00:00', '')
        except Exception as e:
            # Fallback if date handling fails
            logger.error(f"Date processing error: {str(e)}")
            current_time = timezone.now()
            data['expected_start_time'] = (current_time + timedelta(minutes=estimated_waiting_time)).isoformat().replace('+00:00', '')

        return Response(data)
    except Exception as e:
        logger.error(f"Error in appointment_detail: {str(e)}")
        return Response({"error": "An error occurred processing this appointment"}, status=500)
    
def generate_order_id(user_id):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
    return f"{user_id}-{timestamp}-{random_str}"

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

        try:
            # Parse the date string but ensure we're working with timezone-consistent date objects
            appointment_date_obj = datetime.strptime(appointment_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                "error": "Invalid date format",
                "received": appointment_date,
                "expected": "YYYY-MM-DD (e.g., 2023-12-31)"
            }, status=status.HTTP_400_BAD_REQUEST)

        order_id = generate_order_id(user_id)

        # Create a timezone-aware datetime from the appointment date and time
        appointment_datetime = datetime.combine(appointment_date_obj, time_obj)
        # Make it timezone aware using the TIME_ZONE from settings
        irish_tz = pytz.timezone(settings.TIME_ZONE)
        appointment_datetime = timezone.make_aware(appointment_datetime, timezone=irish_tz)
        # Extract date and time back for storage
        appointment_date_obj = appointment_datetime.date()
        time_obj = appointment_datetime.time()

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
    
@api_view(['POST'])
def cancel_appointment(request, order_id):
    try:
        appointment = get_object_or_404(AppointmentDetails, order_id=order_id)
        
        # Convert appointment datetime to timezone aware datetime
        appointment_datetime = datetime.combine(appointment.appointment_date, appointment.appointment_time)
        irish_tz = pytz.timezone(settings.TIME_ZONE)
        appointment_datetime = timezone.make_aware(appointment_datetime, irish_tz)
        
        # Check if the appointment is within 24 hours
        now = timezone.now()
        time_difference = appointment_datetime - now
        
        # If less than 24 hours, don't allow cancellation
        if time_difference.total_seconds() < 24 * 3600:
            return Response({
                "error": "Cannot cancel appointments within 24 hours of the scheduled time"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Ensure the appointment is still pending
        if appointment.status != 'pending':
            return Response({
                "error": f"Cannot cancel appointment with status: {appointment.status}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store the current position for updating subsequent appointments
        current_position = None
        same_day_appointments = AppointmentDetails.objects.filter(
            appointment_date=appointment.appointment_date,
            service=appointment.service,
            status='pending',
            is_active=True
        ).order_by('appointment_time')
        
        for idx, apt in enumerate(same_day_appointments):
            if apt.id == appointment.id:
                current_position = idx + 1
                break
        
        # Update appointment status
        appointment.status = 'cancelled'
        appointment.queue_status = 'cancelled'
        appointment.save()
        
        # Update positions for subsequent appointments
        if current_position:
            subsequent_appointments = AppointmentDetails.objects.filter(
                appointment_date=appointment.appointment_date,
                service=appointment.service,
                appointment_time__gt=appointment.appointment_time,
                status='pending',
                is_active=True
            ).order_by('appointment_time')
            
            logger.info(f"Updating positions for {subsequent_appointments.count()} appointments after cancellation")
        
        return Response({
            "message": "Appointment cancelled successfully",
            "order_id": order_id
        })
        
    except Exception as e:
        logger.error(f"Error cancelling appointment: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def start_appointment_service(request):
    try:
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({"error": "Order ID is required"}, status=400)
            
        appointment = get_object_or_404(AppointmentDetails, order_id=order_id)
        
        # Record actual start time in the server's configured timezone 
        now = timezone.now()
        appointment.actual_start_time = now
        appointment.queue_status = 'in_queue'
        
        # Calculate delay compared to scheduled time
        scheduled_time = datetime.combine(
            appointment.appointment_date,
            appointment.appointment_time
        )
        # Make it timezone aware using the Irish timezone
        irish_tz = pytz.timezone(settings.TIME_ZONE)
        scheduled_time = timezone.make_aware(scheduled_time, irish_tz)
        
        delay_minutes = 0
        if now > scheduled_time:
            delay_seconds = (now - scheduled_time).total_seconds()
            delay_minutes = int(delay_seconds / 60)
            
            # Record delay for tracking
            appointment.last_delay_minutes = delay_minutes
        
        appointment.save()
        
        # Trigger delay propagation if needed
        if delay_minutes > 0:
            propagate_appointment_delays(appointment)
            
        return Response({
            "success": True,
            "appointment": {
                "order_id": appointment.order_id,
                "actual_start_time": appointment.actual_start_time.isoformat().replace('+00:00', ''),
                "delay_minutes": delay_minutes
            }
        })
            
    except Exception as e:
        logger.error(f"Error starting appointment service: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
def complete_appointment_service(request):
    try:
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({"error": "Order ID is required"}, status=400)
            
        appointment = get_object_or_404(AppointmentDetails, order_id=order_id)
        
        # Verify appointment was started
        if not appointment.actual_start_time:
            return Response({"error": "Appointment hasn't been started yet"}, status=400)
            
        # Record actual end time
        now = timezone.now()
        appointment.actual_end_time = now
        appointment.status = 'completed'
        appointment.queue_status = 'completed'
        
        # Calculate if service took longer than expected
        actual_duration_seconds = (now - appointment.actual_start_time).total_seconds()
        actual_duration_minutes = int(actual_duration_seconds / 60)
        
        duration_delay = max(0, actual_duration_minutes - appointment.expected_duration)
        
        # Record delay for tracking
        if duration_delay > 0:
            appointment.last_delay_minutes = duration_delay
            
        appointment.save()
        
        # Update queue positions for subsequent appointments on the same day
        update_subsequent_appointments_positions(appointment)
        
        # Trigger delay propagation if service ran long
        if duration_delay > 0:
            propagate_appointment_delays(appointment)
            
        return Response({
            "success": True,
            "appointment": {
                "order_id": appointment.order_id,
                "actual_end_time": appointment.actual_end_time.isoformat().replace('+00:00', ''),
                "actual_duration_minutes": actual_duration_minutes,
                "duration_delay": duration_delay
            }
        })
            
    except Exception as e:
        logger.error(f"Error completing appointment service: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
    
def update_subsequent_appointments_positions(completed_appointment):
    """
    Update queue positions for all appointments that come after the completed one.
    This ensures that when an appointment is completed, subsequent appointments' 
    positions are updated correctly.
    """
    try:
        # Find all pending appointments for the same service and date with later times
        subsequent_appointments = AppointmentDetails.objects.filter(
            service=completed_appointment.service,
            appointment_date=completed_appointment.appointment_date,
            appointment_time__gt=completed_appointment.appointment_time,
            status='pending'
        ).order_by('appointment_time')
        
        logger.info(f"Found {subsequent_appointments.count()} subsequent appointments to update positions for")
        
        # Update their queue positions (decrement by 1)
        for next_appointment in subsequent_appointments:
            # If the appointment has a queue position, decrement it
            if hasattr(next_appointment, 'queue_position') and next_appointment.queue_position > 1:
                logger.info(f"Updating position for appointment {next_appointment.order_id} from {next_appointment.queue_position} to {next_appointment.queue_position - 1}")
                next_appointment.queue_position -= 1
                next_appointment.save(update_fields=['queue_position'])
                
    except Exception as e:
        logger.error(f"Error updating subsequent appointment positions: {str(e)}")
        logger.error(traceback.format_exc())

def propagate_appointment_delays(appointment):
    """
    Update expected start times for all subsequent appointments on the same day.
    Trigger notifications for affected appointments.
    """
    try:
        # Get all subsequent appointments for the day
        subsequent_appointments = AppointmentDetails.objects.filter(
            service=appointment.service,
            appointment_date=appointment.appointment_date,
            appointment_time__gt=appointment.appointment_time,
            status='pending'
        ).order_by('appointment_time')
        
        if not subsequent_appointments:
            return
            
        delay_minutes = appointment.last_delay_minutes or 0
        if delay_minutes <= 0:
            return
            
        for next_appointment in subsequent_appointments:
            # Update the expected start time based on delay
            scheduled_time = datetime.combine(
                next_appointment.appointment_date,
                next_appointment.appointment_time
            )
            irish_tz = pytz.timezone(settings.TIME_ZONE)
            scheduled_time = timezone.make_aware(scheduled_time, irish_tz)
            
            # If this appointment has an expected start time already, update it
            new_expected_time = scheduled_time + timedelta(minutes=delay_minutes)
            
            # Send notification if delay is significant (5+ minutes) and hasn't been notified
            if delay_minutes >= 5 and not next_appointment.delay_notified:
                # Update appointment with delay info before sending notification
                next_appointment.delay_notified = True
                next_appointment.last_delay_minutes = delay_minutes
                next_appointment.save()
                
                # Send notification about the delay
                try:
                    fcm_token = FCMToken.objects.filter(
                        user=next_appointment.user,
                        is_active=True
                    ).latest('updated_at')
                    
                    send_appointment_delay_notification(
                        token=fcm_token.token,
                        appointment_id=next_appointment.order_id,
                        service_name=next_appointment.service.name,
                        delay_minutes=delay_minutes,
                        new_time=new_expected_time
                    )
                except FCMToken.DoesNotExist:
                    logger.warning(f"No FCM token found for user {next_appointment.user.id}")
                except Exception as e:
                    logger.error(f"Error sending delay notification: {str(e)}")
            
    except Exception as e:
        logger.error(f"Error propagating appointment delays: {str(e)}")
        logger.error(traceback.format_exc())