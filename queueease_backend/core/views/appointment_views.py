from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import logging
import traceback
from django.utils import timezone
from django.conf import settings
import pytz
from django.db import transaction
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
        
        # Define Irish timezone explicitly
        irish_tz = pytz.timezone('Europe/Dublin')
        
        # Get the current time localized to Irish time
        now = timezone.localtime(timezone.now(), irish_tz)
        
        # Check if there are any prior appointments on the same day that are running late and could affect this appointment
        estimated_delay = appointment.delay_minutes or 0
        
        # Update the delay_minutes in the database if calculated a greater delay
        if estimated_delay > (appointment.delay_minutes or 0):
            logger.info(f"Updating appointment {order_id} with new estimated delay of {estimated_delay} minutes")
            appointment.delay_minutes = estimated_delay
            appointment.save(update_fields=['delay_minutes'])
        
        # Combine the appointment date and time with the delay for time calculations
        appointment_naive = datetime.combine(appointment.appointment_date, appointment.appointment_time)
        appointment_datetime = irish_tz.localize(appointment_naive)
        
        # Add the estimated delay
        if estimated_delay > 0:
            appointment_datetime += timedelta(minutes=estimated_delay)
        
        # Calculate seconds until the appointment based on Irish time
        seconds_until = max(0, int((appointment_datetime - now).total_seconds()))
        
        # Format the time difference
        days = seconds_until // 86400
        remaining = seconds_until % 86400
        hours = remaining // 3600
        remaining %= 3600
        minutes = remaining // 60
        if days > 0:
            time_until_formatted = f"{days}d {hours}h {minutes}m"
        elif hours > 0:
            time_until_formatted = f"{hours}h {minutes}m"
        else:
            time_until_formatted = f"{minutes}m"
        
        # Prepare the response data
        data = {
            "order_id": appointment.order_id,
            "appointment_date": appointment.appointment_date.strftime('%Y-%m-%d'),
            "appointment_time": appointment.appointment_time.strftime('%H:%M'),
            "service_name": appointment.service.name,
            "status": appointment.status,
            "appointment_title": f"{appointment.service.name} Appointment",
            "expected_start_time": appointment_datetime.isoformat(),
            "server_current_time": now.isoformat(),
            "seconds_until_appointment": seconds_until,
            "time_until_formatted": time_until_formatted,
            "queue_position": getattr(appointment, 'queue_position', 0),
            "actual_start_time": appointment.actual_start_time.isoformat() if appointment.actual_start_time else None,
            "actual_end_time": appointment.actual_end_time.isoformat() if appointment.actual_end_time else None,
            "delay_minutes": estimated_delay if estimated_delay > 0 else None,
            "check_in_time": appointment.check_in_time.isoformat() if appointment.check_in_time else None,
        }
        
        return Response(data)
        
    except Exception as e:
        logger.error(f"Error in appointment detail: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": "An error occurred processing this appointment"}, status=500)
    
def generate_order_id(user_id):
    from random import choices
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
    return f"{user_id}-{timestamp}-{random_str}"

@api_view(['DELETE'])
def delete_appointment(request, order_id):
    appointment = get_object_or_404(AppointmentDetails, order_id=order_id)
    appointment.delete()
    return Response({"message": "Appointment deleted successfully."}, status=200)

@api_view(['POST'])
def create_appointment(request):
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
            }, status=400)
        
        # Look up the user and service objects
        user = get_object_or_404(User, id=user_id)
        service = get_object_or_404(Service, id=service_id)
        
        # Parse the time and date strings.
        try:
            time_obj = datetime.strptime(appointment_time, '%H:%M').time()
        except ValueError:
            return Response({
                "error": "Invalid time format",
                "received": appointment_time,
                "expected": "HH:MM (e.g., 14:30)"
            }, status=400)

        try:
            appointment_date_obj = datetime.strptime(appointment_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                "error": "Invalid date format",
                "received": appointment_date,
                "expected": "YYYY-MM-DD (e.g., 2023-12-31)"
            }, status=400)

        # Enforce Irish timezone.
        irish_tz = pytz.timezone('Europe/Dublin')
        # Convert current server time (UTC) to Irish time.
        today = timezone.localtime(timezone.now(), irish_tz).date()
        if appointment_date_obj < today:
            return Response({"error": "Cannot book appointments for past dates"}, status=400)
        
        if appointment_date_obj == today:
            now_time = timezone.localtime(timezone.now(), irish_tz).time()
            if time_obj < now_time:
                return Response({"error": "Cannot book appointments for times that have already passed"}, status=400)

        order_id = generate_order_id(user_id)
        
        # Combine date and time and localize to Irish time.
        appointment_naive = datetime.combine(appointment_date_obj, time_obj)
        appointment_datetime = irish_tz.localize(appointment_naive)
        # Optionally, reassign the localized date/time for storage
        appointment_date_obj = appointment_datetime.date()
        time_obj = appointment_datetime.time()

        # Create the appointment
        appointment = AppointmentDetails.objects.create(
            order_id=order_id,
            user=user,
            service=service,
            appointment_date=appointment_date_obj,
            appointment_time=time_obj,
            duration_minutes=service.average_duration or 30,
            status='scheduled',
            is_active=True,
            expected_duration=service.average_duration or 30
        )
        
        return Response({
            "message": "Appointment created successfully",
            "order_id": str(order_id),
            "appointment_date": appointment.appointment_date.strftime('%Y-%m-%d'),
            "appointment_time": appointment.appointment_time.strftime('%H:%M'),
            "service_name": service.name
        }, status=201)
        
    except Exception as e:
        return Response({
            "error": "Failed to create appointment",
            "detail": str(e)
        }, status=500)
    
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
        
        # Ensure the appointment is still scheduled
        if appointment.status != 'scheduled':
            return Response({
                "error": f"Cannot cancel appointment with status: {appointment.status}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update appointment status
        appointment.status = 'cancelled'
        appointment.queue_status = 'cancelled'
        appointment.save()

        # Update positions for subsequent appointments
        subsequent_appointments = AppointmentDetails.objects.filter(
            appointment_date=appointment.appointment_date,
            service=appointment.service,
            appointment_time__gt=appointment.appointment_time,
            status='scheduled',
            is_active=True
        ).order_by('appointment_time')

        # Recalculate positions
        for idx, apt in enumerate(subsequent_appointments):
            apt.queue_position = idx + 1
            apt.save(update_fields=['queue_position'])
        
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
        
        # Only allow starting appointments that are scheduled or checked in
        if appointment.status not in ['scheduled', 'checked_in']:
            return Response({"error": f"Cannot start appointment with status: {appointment.status}"}, status=400)
            
        # Record actual start time
        now = timezone.now()
        appointment.actual_start_time = now
        appointment.status = 'in_progress'
        
        irish_tz = pytz.timezone(settings.TIME_ZONE)
        scheduled_datetime = datetime.combine(appointment.appointment_date, appointment.appointment_time)
        
        # Make it timezone-aware
        if timezone.is_naive(scheduled_datetime):
            scheduled_datetime = timezone.make_aware(scheduled_datetime, irish_tz)
        
        logger.info(f"Appointment {order_id} scheduled for: {scheduled_datetime}, starting at: {now}")
        
        appointment.save()
        propagate_appointment_delays(appointment)
            
        return Response({
            "success": True,
            "appointment": {
                "order_id": appointment.order_id,
                "status": appointment.status,
                "actual_start_time": appointment.actual_start_time.isoformat() if appointment.actual_start_time else None,
                "delay_minutes": appointment.delay_minutes
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
        
        # Verify appointment is in progress
        if appointment.status != 'in_progress':
            return Response({"error": f"Cannot complete appointment with status: {appointment.status}"}, status=400)
            
        # Record actual end time
        now = timezone.now()
        appointment.actual_end_time = now
        appointment.status = 'completed'
    
        appointment.save()
        
        propagate_appointment_delays(appointment)
            
        return Response({
            "success": True,
            "appointment": {
                "order_id": appointment.order_id,
                "status": appointment.status,
                "actual_end_time": appointment.actual_end_time.isoformat() if appointment.actual_end_time else None,
            }
        })
            
    except Exception as e:
        logger.error(f"Error completing appointment service: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)

def propagate_appointment_delays(appointment):
    try:
        logger.info(f"Propagating manual delay of {appointment.delay_minutes} minutes from appointment {appointment.order_id}")
        
        # Skip if there's no delay to propagate
        if not appointment.delay_minutes or appointment.delay_minutes <= 0:
            logger.info(f"No delay to propagate from appointment {appointment.order_id}")
            return
            
        # Get all subsequent appointments for the same day
        subsequent_appointments = AppointmentDetails.objects.filter(
            service=appointment.service,
            appointment_date=appointment.appointment_date,
            appointment_time__gt=appointment.appointment_time,
            status__in=['scheduled', 'checked_in']
        ).order_by('appointment_time')
        
        now = timezone.now()
        
        if not subsequent_appointments:
            logger.info(f"No subsequent appointments found for {appointment.order_id}")
            return
            
        logger.info(f"Found {subsequent_appointments.count()} subsequent appointments to propagate delays to")
        
        # Process each subsequent appointment
        for next_appointment in subsequent_appointments:
            try:
                existing_delay = next_appointment.delay_minutes or 0
                
                # Only update if delay is greater than the existing one
                if appointment.delay_minutes > existing_delay:
                    logger.info(f"Updating appointment {next_appointment.order_id} delay from {existing_delay} to {appointment.delay_minutes} minutes")
                    
                    with transaction.atomic():
                        next_appointment.delay_minutes = appointment.delay_minutes
                        next_appointment.delay_reason = "Earlier appointment delay"
                        next_appointment.delay_set_time = now
                        next_appointment.save()
                    
                    # Sending notifications to affected users
                    if not next_appointment.delay_notified:
                        fcm_tokens = FCMToken.objects.filter(
                            user=next_appointment.user,
                            is_active=True
                        )
                        
                        if fcm_tokens.exists():
                            fcm_token = fcm_tokens.latest('updated_at')
                            
                            # Calculate new expected time
                            scheduled_start = datetime.combine(next_appointment.appointment_date, next_appointment.appointment_time)
                            if timezone.is_naive(scheduled_start):
                                scheduled_start = timezone.make_aware(scheduled_start)
                                
                            new_start_time = scheduled_start + timedelta(minutes=appointment.delay_minutes)
                            formatted_time = new_start_time.strftime('%I:%M %p')
                            
                            # Send notification
                            send_appointment_delay_notification(
                                token=fcm_token.token,
                                appointment_id=next_appointment.order_id,
                                service_name=next_appointment.service.name,
                                delay_minutes=appointment.delay_minutes,
                                new_time=new_start_time
                            )
                            
                            next_appointment.delay_notified = True
                            next_appointment.save(update_fields=['delay_notified'])
                            logger.info(f"Sent delay notification to user for appointment {next_appointment.order_id}")
            except Exception as e:
                logger.error(f"Error processing subsequent appointment {next_appointment.order_id}: {str(e)}")
                continue
    except Exception as e:
        logger.error(f"Error propagating appointment delays: {str(e)}")
        logger.error(traceback.format_exc())

@api_view(['POST'])
def set_appointment_delay(request):
    try:
        order_id = request.data.get('order_id')
        delay_minutes = request.data.get('delay_minutes')
        delay_reason = request.data.get('reason', '')
        propagate = request.data.get('propagate', True)
        
        if not order_id:
            return Response({"error": "Order ID is required"}, status=400)
            
        try:
            delay_minutes = int(delay_minutes)
            if delay_minutes < 0:
                return Response({"error": "Delay minutes must be a positive integer"}, status=400)
        except (ValueError, TypeError):
            return Response({"error": "Invalid delay minutes value"}, status=400)
        
        # Get the appointment
        appointment = get_object_or_404(AppointmentDetails, order_id=order_id)
        
        # Update the delay
        previous_delay = appointment.delay_minutes or 0
        appointment.delay_minutes = delay_minutes
        
        # Track when and why delay was set
        now = timezone.now()
        appointment.delay_set_time = now
        if delay_reason:
            appointment.delay_reason = delay_reason
            
        # If admin user is authenticated record who set the delay
        if request.user.is_authenticated and hasattr(request.user, 'is_staff') and request.user.is_staff:
            appointment.delay_set_by = request.user
            
        appointment.save()
        
        logger.info(f"Manually set delay for appointment {order_id} from {previous_delay} to {delay_minutes} minutes")
        
        # Only send notification if the delay has increased
        if delay_minutes > previous_delay:
            # Get user's FCM token if available
            fcm_tokens = FCMToken.objects.filter(
                user=appointment.user,
                is_active=True
            )
            
            if fcm_tokens.exists():
                # Send notification to the user about the delay
                fcm_token = fcm_tokens.latest('updated_at')
                
                # Calculate the new expected start time
                scheduled_start = datetime.combine(appointment.appointment_date, appointment.appointment_time)
                if timezone.is_naive(scheduled_start):
                    scheduled_start = timezone.make_aware(scheduled_start)
                    
                new_start_time = scheduled_start + timedelta(minutes=delay_minutes)
                
                # Send the notification
                send_appointment_delay_notification(
                    token=fcm_token.token,
                    appointment_id=appointment.order_id,
                    service_name=appointment.service.name,
                    delay_minutes=delay_minutes,
                    new_time=new_start_time
                )
                
                # Mark as notified
                appointment.delay_notified = True
                appointment.save(update_fields=['delay_notified'])
                
                logger.info(f"Sent delay notification to user for appointment {order_id}")
            else:
                logger.info(f"No FCM token found for user, couldn't send delay notification")
        
        # Propagate delay to subsequent appointments if requested
        if propagate:
            propagate_appointment_delays(appointment)
        
        return Response({
            "success": True,
            "message": f"Set {delay_minutes} minute delay for appointment {order_id}",
            "appointment": {
                "order_id": appointment.order_id,
                "delay_minutes": appointment.delay_minutes,
                "status": appointment.status
            }
        })
        
    except Exception as e:
        logger.error(f"Error setting appointment delay: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def check_in_appointment(request):
    try:
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({"error": "Order ID is required"}, status=400)
            
        appointment = get_object_or_404(AppointmentDetails, order_id=order_id)
        
        # Only allow check-in on the appointment day
        current_date = timezone.now().date()
        if appointment.appointment_date != current_date:
            return Response({"error": "Can only check in on the appointment day"}, status=400)
            
        # Only allow check-in for scheduled appointments
        if appointment.status != 'scheduled':
            return Response({"error": f"Cannot check in appointment with status: {appointment.status}"}, status=400)
        
        # Record check-in time
        now = timezone.now()
        appointment.check_in_time = now
        appointment.status = 'checked_in'
        
        # Save the appointment changes
        appointment.save()
        
        return Response({
            "success": True,
            "appointment": {
                "order_id": appointment.order_id,
                "status": appointment.status,
                "check_in_time": appointment.check_in_time.isoformat() if appointment.check_in_time else None,
                "delay_minutes": appointment.delay_minutes
            }
        })
            
    except Exception as e:
        logger.error(f"Error checking in appointment: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
