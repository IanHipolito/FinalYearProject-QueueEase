from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.db import models
from django.db.models import F
from django.utils import timezone
import qrcode
from io import BytesIO
import json
import logging
import traceback
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import timedelta
from django.db import transaction
import numpy as np

from ..models import (
    Queue, QRCode, User, Service, Feedback, ServiceWaitTime, 
    QueueSequence, QueueSequenceItem, ServiceAdmin, FCMToken, ServiceQueue, AppointmentDetails
)
from ..services.notifications import send_queue_update_notification, send_push_notification

logger = logging.getLogger(__name__)

def compute_expected_ready_time(service, position, historical_data=None):
    try:
        # Ensure position is an integer
        position = int(position)
        
        # Get service parameters
        parallel_capacity = service.parallel_capacity or 8
        default_avg_duration = service.average_duration or 15
        minimal_prep = service.minimal_prep_time or 5
        
        print(f"Service: {service.name}, Position: {position}, Type: {service.service_type}")
        print(f"Parameters: min_prep={minimal_prep}, parallel_capacity={parallel_capacity}, avg_duration={default_avg_duration}")
        
        # Process historical data first if available
        historical_avg = None
        if historical_data and len(historical_data) > 0:
            print(f"Historical data available: {len(historical_data)} records")
            try:
                # Convert to numpy array for more efficient calculations
                historical_array = np.array(historical_data)
                
                # Remove outliers if we have enough data
                if len(historical_array) >= 5:
                    lower_bound = np.percentile(historical_array, 15)
                    upper_bound = np.percentile(historical_array, 85)
                    filtered_data = historical_array[(historical_array >= lower_bound) & 
                                                (historical_array <= upper_bound)]
                    print(f"Filtered data: {len(filtered_data)} records (removed {len(historical_array) - len(filtered_data)} outliers)")
                    print(f"Bounds: {lower_bound} to {upper_bound}")
                    
                    if len(filtered_data) > 0:
                        historical_avg = np.mean(filtered_data)
                    else:
                        historical_avg = np.mean(historical_array)
                else:
                    historical_avg = np.mean(historical_array)
                
                print(f"Historical average wait time: {historical_avg:.2f} minutes")
            except Exception as e:
                print(f"Error processing historical data: {str(e)}")
                historical_avg = None
        
        if service.service_type == 'immediate':
            # Calculate wait time based on position
            if position == 1:
                # First position is always minimal prep time
                position_wait = minimal_prep
                print(f"Position 1: Using minimal prep time: {position_wait}")
            else:
                # For positions beyond 1, use a diminishing returns model for wait time growth
                # Formula: base + (position-1)^0.6 * factor
                base_time = minimal_prep
                time_factor = 2.5  # Additional time per position, with diminishing returns
                position_factor = (position - 1) ** 0.6  # Sublinear growth
                
                position_wait = base_time + (position_factor * time_factor)
                print(f"Position {position}: Base={base_time}, Factor={position_factor:.2f}, Additional={position_factor * time_factor:.2f}")
                
                # Apply a reasonable cap for higher positions
                max_wait = 20  # Maximum wait time for any position in immediate service
                position_wait = min(position_wait, max_wait)
            
            # Apply historical influence for improved accuracy, but with very limited impact
            final_wait = position_wait
            if historical_avg is not None:
                # Use a small weight that increases slightly with position but stays minimal
                # First position gets almost no historical influence
                if position == 1:
                    historical_weight = 0.05  # 5% influence for position 1
                else:
                    # Gradual increase in weight for higher positions, but never exceeding 15%
                    historical_weight = min(0.15, 0.05 + (position * 0.02))
                
                # Blend calculated time with historical data
                weighted_historical = historical_avg * historical_weight
                weighted_position = position_wait * (1 - historical_weight)
                final_wait = weighted_position + weighted_historical
                
                print(f"Historical weight: {historical_weight:.2f}, Adding {weighted_historical:.2f} minutes of historical influence")
                print(f"Final wait after historical adjustment: {final_wait:.2f} minutes")
            
            # Apply sensible cap and rounding
            final_wait = min(final_wait, 25)  # Hard cap at 25 minutes
            final_wait = round(final_wait)  # Round to nearest minute
            
            now = timezone.now()
            expected_time = now + timedelta(minutes=final_wait)
            print(f"Final wait time: {final_wait} minutes, expected time: {expected_time}")
            return expected_time
        
        # APPOINTMENT-BASED SERVICE HANDLING
        else:
            # Calculate wave number and base wait time
            wave_number = (position - 1) // parallel_capacity
            base_wait = wave_number * default_avg_duration

            # Apply minimal prep time for first wave
            if service.requires_prep_time and wave_number == 0:
                base_wait = max(base_wait, minimal_prep)
            
            print(f"Appointment service base wait: {base_wait} minutes (wave {wave_number})")
            
            # For appointment services, historical data can have more influence
            final_wait = base_wait
            if historical_avg is not None:
                # Higher weight for appointment services, but still capped
                historical_weight = min(0.3, 0.1 + (wave_number * 0.1))
                
                weighted_historical = historical_avg * historical_weight
                weighted_base = base_wait * (1 - historical_weight)
                final_wait = weighted_base + weighted_historical
                
                print(f"Historical weight: {historical_weight:.2f}, Adding {weighted_historical:.2f} minutes of historical influence")
                print(f"Final wait after historical adjustment: {final_wait:.2f} minutes")
            
            # Round to nearest minute
            final_wait = round(final_wait)
            
            now = timezone.now()
            expected_time = now + timedelta(minutes=final_wait)
            print(f"Final wait time: {final_wait} minutes, expected time: {expected_time}")
            return expected_time
            
    except Exception as e:
        print(f"Error calculating wait time: {str(e)}")
        traceback.print_exc()
        # Fallback to a reasonable default if there's an error
        now = timezone.now()
        return now + timedelta(minutes=10)
    
def fetch_historical_data(service_id):
    now = timezone.now()
    current_hour = now.hour
    is_weekend = now.weekday() >= 5  # Weekend is Saturday (5) or Sunday (6)
    
    # For time, consider a 2-hour window around current time
    time_window_start = (current_hour - 1) % 24
    time_window_end = (current_hour + 1) % 24
    
    # Query for time-specific data from the last 14 days
    two_weeks_ago = now - timedelta(days=14)
    
    if time_window_start < time_window_end:
        # Normal case, e.g., 10-12
        time_specific_data = ServiceWaitTime.objects.filter(
            service_id=service_id,
            date_recorded__gte=two_weeks_ago,
            date_recorded__hour__gte=time_window_start,
            date_recorded__hour__lte=time_window_end
        )
    else:
        # Wrapped case, e.g., 23-1
        time_specific_data = ServiceWaitTime.objects.filter(
            service_id=service_id,
            date_recorded__gte=two_weeks_ago
        ).filter(
            models.Q(date_recorded__hour__gte=time_window_start) | 
            models.Q(date_recorded__hour__lte=time_window_end)
        )
    
    # If on weekend, prioritize weekend data; if weekday, prioritize weekday data
    if is_weekend:
        weekend_data = time_specific_data.filter(
            date_recorded__week_day__in=[1, 7]
        )
        if weekend_data.exists() and weekend_data.count() >= 5:
            selected_data = weekend_data
        else:
            selected_data = time_specific_data
    else:
        weekday_data = time_specific_data.filter(
            date_recorded__week_day__in=[2, 3, 4, 5, 6]
        )
        if weekday_data.exists() and weekday_data.count() >= 5:
            selected_data = weekday_data
        else:
            selected_data = time_specific_data
    
    if selected_data.count() < 5:
        selected_data = ServiceWaitTime.objects.filter(
            service_id=service_id
        ).order_by('-date_recorded')[:30]
    
    # Extract wait times and return as list
    wait_times = list(selected_data.values_list('wait_time', flat=True))
    
    print(f"Historical data query for service {service_id}:")
    print(f"Current time: {now.strftime('%A %H:%M')}")
    print(f"Retrieved {len(wait_times)} relevant historical records")
    
    if wait_times:
        print(f"Min: {min(wait_times)}, Max: {max(wait_times)}, Avg: {sum(wait_times)/len(wait_times):.2f}")
    
    return wait_times

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

        # Check if there's an active queue for this service
        service_queue = ServiceQueue.objects.filter(
            service=service,
            is_active=True
        ).first()
        
        # If no active queue exists, create one
        if not service_queue:
            service_queue = ServiceQueue.objects.create(
                service=service,
                current_member_count=0
            )
        
        # Get pending queues for this service
        pending_queues = Queue.objects.filter(
            service_queue=service_queue,
            status='pending',
            is_active=True
        ).order_by('date_created')

        # Calculate position (number of people ahead + 1)
        position = pending_queues.count() + 1
        
        # Increment the member count on the service queue
        service_queue.current_member_count += 1
        service_queue.save()
        
        # Get historical wait time data for this service
        historical_data = fetch_historical_data(service.id)
        
        # Create queue entry
        queue_item = Queue.objects.create(
            user=user,
            service=service,
            service_queue=service_queue,
            sequence_number=position,
            status='pending'
        )
        
        # Calculate expected ready time based on position and service type
        queue_item.expected_ready_time = compute_expected_ready_time(service, position, historical_data)
        queue_item.save()
        
        # Create QR code for this queue
        qr_data = f"Queue ID: {queue_item.id}"
        qr_code = QRCode.objects.create(queue=queue_item, qr_hash=qr_data)

        # Calculate wait time in minutes for response
        now = timezone.now()
        wait_minutes = 0
        if queue_item.expected_ready_time:
            wait_seconds = max(0, (queue_item.expected_ready_time - now).total_seconds())
            wait_minutes = int(wait_seconds / 60)

        return Response({
            "message": "Queue created",
            "queue_id": queue_item.id,
            "position": position,
            "expected_ready_time": queue_item.expected_ready_time.isoformat() if queue_item.expected_ready_time else None,
            "estimated_wait_minutes": wait_minutes,
            "qr_hash": qr_code.qr_hash
        })
        
    except Exception as e:
        logger.error(f"Error in create_queue: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
    
@api_view(['GET'])
def queue_detail(request, queue_id):
    queue_item = get_object_or_404(Queue, id=queue_id)

    total_wait = 0
    if queue_item.expected_ready_time:
        total_wait = int((queue_item.expected_ready_time - queue_item.date_created).total_seconds())

    # Check for transferred queues
    if queue_item.status == 'transferred':
        new_queue = Queue.objects.filter(transferred_from=queue_item).first()
        if new_queue:
            return Response({
                "queue_id": new_queue.id,
                "original_queue_id": queue_item.id,
                "service_name": new_queue.service.name,
                "status": new_queue.status,
                "is_transferred": True,
                "current_position": None,
                "expected_ready_time": new_queue.expected_ready_time.isoformat() if new_queue.expected_ready_time else None,
                "total_wait": total_wait,
                "time_created": queue_item.date_created.isoformat()
            })
    
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

    # Get all pending queues for this service and order by date created
    pending_queues = Queue.objects.filter(
        service=queue_item.service,
        status='pending',
        is_active=True
    ).order_by('date_created')

    # Find the position of our queue item
    position = 0
    for i, queue in enumerate(pending_queues):
        if queue.id == queue_item.id:
            position = i + 1
            break
    
    # If position is still 0, fallback to the filter method
    if position == 0:
        position = pending_queues.filter(date_created__lt=queue_item.date_created).count() + 1

    # If this is an immediate service and position is 1, we might need to update the expected ready time
    if queue_item.service.service_type == 'immediate' and position == 1:
        current_time = timezone.now()
        time_in_queue = (current_time - queue_item.date_created).total_seconds() / 60
        
        # If they've been waiting longer than expected but less than the minimal prep time,
        # update their expected ready time
        minimal_prep = queue_item.service.minimal_prep_time or 5
        if time_in_queue < minimal_prep:
            # Update expected ready time to use minimal prep time from now
            queue_item.expected_ready_time = current_time + timezone.timedelta(minutes=minimal_prep - time_in_queue)
            queue_item.save()
            # Update total wait
            total_wait = int((queue_item.expected_ready_time - queue_item.date_created).total_seconds())

    data = {
        "queue_id": queue_item.id,
        "service_name": queue_item.service.name,
        "current_position": position,
        "status": queue_item.status,
        "expected_ready_time": queue_item.expected_ready_time.isoformat() if queue_item.expected_ready_time else None,
        "total_wait": total_wait,
        "time_created": queue_item.date_created.isoformat()
    }
    return Response(data)

@api_view(['POST'])
def complete_queue(request, queue_id):
    try:
        queue_item = get_object_or_404(Queue, id=queue_id)
        service_queue = queue_item.service_queue
        
        if queue_item.status != 'pending':
            return Response({"error": "This queue has already been completed"}, status=400)
        
        # Mark the queue as completed
        queue_item.status = 'completed'
        queue_item.save()
        
        # Record wait time for analytics
        wait_time = int((queue_item.expected_ready_time - queue_item.date_created).total_seconds() / 60)
        ServiceWaitTime.objects.create(service=queue_item.service, wait_time=wait_time)
        
        # Send completion notification
        try:
            fcm_token = FCMToken.objects.filter(
                user=queue_item.user, 
                is_active=True
            ).latest('updated_at')
            
            send_push_notification(
                token=fcm_token.token,
                title=f"Your order is ready!",
                body=f"Your order at {queue_item.service.name} is now ready for collection.",
                data={
                    "type": "queue_completed",
                    "queue_id": str(queue_item.id),
                    "url": f"/success/{queue_item.id}"
                }
            )
        except FCMToken.DoesNotExist:
            pass
        
        # Update other queues that may change position
        if service_queue:
            affected_queues = Queue.objects.filter(
                service_queue=service_queue,
                sequence_number__gt=queue_item.sequence_number,
                status='pending',
                is_active=True
            )
            
            # Update their sequence numbers
            for affected_queue in affected_queues:
                affected_queue.sequence_number = F('sequence_number') - 1
                affected_queue.save(update_fields=['sequence_number'])
            
            update_service_queue_status(service_queue.id)
        
        return Response({"status": "completed", "notification_sent": True})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
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
    
@api_view(['POST'])
def update_queue_position(request, queue_id):
    """Update queue position and notify user or toggle active status"""
    try:
        queue = Queue.objects.get(id=queue_id)
        is_active = request.data.get('is_active')
        
        # If is_active status is being toggled
        if is_active is not None:
            is_active = bool(is_active)
            
            # Update queue status
            queue.is_active = is_active
            
            # If setting to inactive and this is a service queue, update status
            service_queue = queue.service_queue if hasattr(queue, 'service_queue') else None
            if not is_active and service_queue:
                # If queue has no customers, mark it as inactive
                if service_queue.current_member_count == 0:
                    queue.status = 'inactive'
                    
                    # Update the service queue
                    update_service_queue_status(service_queue.id)
            
            # If setting to active, update status
            if is_active:
                queue.status = 'pending'
            else:
                queue.status = 'inactive'
                
            queue.save()
            
            return Response({
                "success": True,
                "is_active": is_active,
                "status": queue.status
            })
            
        # Original behavior for position updates
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
                now = timezone.timezone.now(queue.expected_ready_time.tzinfo)
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
    
def update_service_queue_status(service_queue_id):
    try:
        service_queue = ServiceQueue.objects.get(id=service_queue_id)
        
        # Count active members
        active_members = Queue.objects.filter(
            service_queue=service_queue,
            status='pending',
            is_active=True
        ).count()
        
        # Update member count
        service_queue.current_member_count = active_members
        
        # If no active members, set queue to inactive
        if active_members == 0:
            service_queue.is_active = False
        
        service_queue.save()
        
    except ServiceQueue.DoesNotExist:
        pass

@api_view(['POST'])
def leave_queue(request, queue_id):
    try:
        queue = get_object_or_404(Queue, id=queue_id)
        service_queue = queue.service_queue
        
        # Check if queue is already completed or inactive
        if queue.status != 'pending' or not queue.is_active:
            return Response({"error": "This queue has already been completed or is inactive"}, status=400)
        
        # Check if it's within the time window (1 minute)
        time_window = timedelta(minutes=1)
        if timezone.now() - queue.date_created > time_window:
            return Response(
                {"error": "You can only leave a queue within the first 1 minute of joining"}, 
                status=400
            )
        
        # Mark the queue member as inactive and update status
        queue.is_active = False
        queue.status = 'cancelled'
        queue.save()
        
        # Update positions for members behind this one
        if service_queue:
            Queue.objects.filter(
                service_queue=service_queue,
                sequence_number__gt=queue.sequence_number,
                status='pending',
                is_active=True
            ).update(sequence_number=F('sequence_number')-1)
            
            # Update service queue status
            update_service_queue_status(service_queue.id)
        
        return Response({"message": "Successfully left the queue"})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

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
    
@api_view(['GET'])
def queue_history(request, user_id):
    try:
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
                    "waiting_time": int((queue.expected_ready_time - queue.date_created).total_seconds()) if queue.expected_ready_time and queue.date_created else None,
                    "position": queue.position if hasattr(queue, 'position') else None,
                    "service_type": queue.service.service_type if hasattr(queue, 'service') and queue.service else "immediate",
                    "transferred_from": queue.transferred_from.id if hasattr(queue, 'transferred_from') and queue.transferred_from else None,
                    "transferred_to": Queue.objects.filter(transferred_from=queue).first().id if Queue.objects.filter(transferred_from=queue).exists() else None
                }
                
                if hasattr(queue, 'service') and queue.service and queue.service.service_type == 'appointment':
                    appointment = AppointmentDetails.objects.filter(service=queue.service, user=user).order_by('-appointment_date').first()
                    if appointment:
                        queue_data.update({
                            "appointment_date": appointment.appointment_date.isoformat() if appointment.appointment_date else None,
                            "appointment_time": appointment.appointment_time.strftime('%H:%M') if appointment.appointment_time else None,
                            "order_id": appointment.order_id
                        })
                
                serialized_data.append(queue_data)
            except Exception as e:
                print(f"Error serializing queue {queue.id}: {str(e)}")
                print(traceback.format_exc())
                continue
        
        return Response(serialized_data)
        
    except Exception as e:
        print(f"Error in queue_history: {str(e)}")
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
    
@api_view(['GET'])
def service_queues(request, service_id):
    try:
        service = get_object_or_404(Service, id=service_id)
        
        # Get all active service queues for this service
        service_queues = ServiceQueue.objects.filter(service=service, is_active=True)
        
        queue_data = []
        for sq in service_queues:
            queue_data.append({
                'id': sq.id,
                'name': service.name,
                'department': service.category or 'General',
                'description': service.description,
                'is_active': sq.is_active,
                'current_customers': sq.current_member_count,
                'max_capacity': 50  # Default
            })
        
        # If no active service queues but there are individual queue members,
        if not service_queues.exists():
            # Count customers with pending status for this service
            current_customers = Queue.objects.filter(
                service=service, 
                status='pending',
                is_active=True,
                service_queue__isnull=True
            ).count()
            
            if current_customers > 0:
                queue_data.append({
                    'id': f"legacy_{service.id}",
                    'name': service.name,
                    'department': service.category or 'General',
                    'description': service.description,
                    'is_active': True,
                    'current_customers': current_customers,
                    'max_capacity': 50
                })
        
        return Response(queue_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
def user_analytics(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
        time_range = request.GET.get('time_range', 'month')
        
        # Determine date range based on the time_range
        now = timezone.now()
        if time_range == 'week':
            start_date = now - timedelta(days=7)
        elif time_range == 'month':
            start_date = now - timedelta(days=30)
        elif time_range == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)  # Default to month
        
        # Get queue history for the user within the date range
        queue_history = Queue.objects.filter(
            user=user,
            date_created__gte=start_date
        ).order_by('-date_created')
        
        # Calculate statistics
        total_queues = queue_history.count()
        completed_queues = queue_history.filter(status='completed').count()
        cancelled_queues = queue_history.filter(status='cancelled').count()
        
        # Calculate average wait time
        wait_times = []
        completed_with_wait = queue_history.filter(
            status='completed'
        )
        
        for queue in completed_with_wait:
            if queue.date_created and queue.expected_ready_time:
                wait_seconds = (queue.expected_ready_time - queue.date_created).total_seconds()
                wait_minutes = int(wait_seconds / 60)
                wait_times.append(wait_minutes)
        
        avg_wait_time = sum(wait_times) / len(wait_times) if wait_times else 0
        
        # Calculate wait time by day and hour
        wait_by_day = {}
        wait_by_hour = {}
        
        for queue in completed_with_wait:
            if not (queue.date_created and queue.expected_ready_time):
                continue
                
            day_of_week = queue.date_created.strftime('%A')
            hour_of_day = queue.date_created.hour
            wait_seconds = (queue.expected_ready_time - queue.date_created).total_seconds()
            wait_minutes = int(wait_seconds / 60)
            
            # For day
            if day_of_week not in wait_by_day:
                wait_by_day[day_of_week] = {'total': 0, 'count': 0}
            wait_by_day[day_of_week]['total'] += wait_minutes
            wait_by_day[day_of_week]['count'] += 1
            
            # For hour
            if hour_of_day not in wait_by_hour:
                wait_by_hour[hour_of_day] = {'total': 0, 'count': 0}
            wait_by_hour[hour_of_day]['total'] += wait_minutes
            wait_by_hour[hour_of_day]['count'] += 1
        
        # Format day stats
        day_stats = []
        for day, stats in wait_by_day.items():
            avg = stats['total'] / stats['count'] if stats['count'] > 0 else 0
            day_stats.append({
                'day': day,
                'avgWait': round(avg),
                'count': stats['count']
            })
        
        # Format hour stats
        hour_stats = []
        for hour, stats in wait_by_hour.items():
            avg = stats['total'] / stats['count'] if stats['count'] > 0 else 0
            hour_stats.append({
                'hour': hour,
                'avgWait': round(avg),
                'count': stats['count']
            })
        
        # Get most visited services
        service_visits = {}
        for queue in queue_history:
            service_name = queue.service.name
            if service_name not in service_visits:
                service_visits[service_name] = 0
            service_visits[service_name] += 1
        
        # Sort and take top 5
        most_visited = sorted(
            [{'name': name, 'count': count} for name, count in service_visits.items()],
            key=lambda x: x['count'],
            reverse=True
        )[:5]
        
        # Return the analytics data
        return Response({
            'totalQueues': total_queues,
            'completedQueues': completed_queues,
            'canceledQueues': cancelled_queues,
            'averageWaitTime': round(avg_wait_time),
            'mostVisitedServices': most_visited,
            'waitTimeByDay': day_stats,
            'waitTimeByHour': hour_stats
        })
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['POST'])
def transfer_queue(request):
    try:
        # Validate input parameters
        original_queue_id = request.data.get('original_queue_id')
        target_service_id = request.data.get('target_service_id')
        user_id = request.data.get('user_id')
        
        if not all([original_queue_id, target_service_id, user_id]):
            return Response({"error": "Missing required parameters"}, status=400)
        
        # Get objects with proper error handling
        try:
            original_queue = Queue.objects.get(id=original_queue_id)
        except Queue.DoesNotExist:
            return Response({"error": f"Original queue with ID {original_queue_id} not found"}, status=404)
            
        try:
            target_service = Service.objects.get(id=target_service_id)
        except Service.DoesNotExist:
            return Response({"error": f"Target service with ID {target_service_id} not found"}, status=404)
        
        # Authorization check
        if original_queue.user.id != user_id:
            return Response({"error": "Not authorized to transfer this queue"}, status=403)
        
        # Business rules validation
        time_window = timedelta(minutes=2)
        if timezone.now() - original_queue.date_created > time_window:
            return Response(
                {"error": "You can only transfer a queue within the first 2 minutes of joining"}, 
                status=400
            )
        
        if original_queue.service.service_type != 'immediate' or target_service.service_type != 'immediate':
            return Response({"error": "Can only transfer between immediate-type services"}, status=400)
        
        if original_queue.service.name != target_service.name:
            return Response({"error": "Can only transfer between the same service types"}, status=400)
        
        if original_queue.service.id == target_service.id:
            return Response({"error": "Cannot transfer to the same service location"}, status=400)
        
        # Use transaction to ensure data consistency
        with transaction.atomic():
            # Mark original queue as transferred
            original_queue.status = 'transferred'
            original_queue.save()
            
            # Find or create service queue for target service
            service_queue, created = ServiceQueue.objects.get_or_create(
                service=target_service,
                is_active=True,
                defaults={'current_member_count': 0}
            )
            
            # Increment member count
            service_queue.current_member_count += 1
            service_queue.save()
            
            # Calculate position
            position = Queue.objects.filter(
                service=target_service,
                status='pending',
                is_active=True
            ).count() + 1
            
            # Get historical wait time data for accurate estimation
            historical_data = fetch_historical_data(target_service.id)
            
            # Create new queue with reference to original
            new_queue = Queue.objects.create(
                user=original_queue.user,
                service=target_service,
                service_queue=service_queue,
                sequence_number=position,
                status='pending',
                transferred_from=original_queue
            )
            
            # Calculate expected ready time
            new_queue.expected_ready_time = compute_expected_ready_time(
                target_service, position, historical_data
            )
            new_queue.save()
            
            # Update QR code to point to new queue
            try:
                qr_code = QRCode.objects.get(queue=original_queue)
                qr_code.queue = new_queue
                qr_code.save()
            except QRCode.DoesNotExist:
                # Create new QR code if the original one doesn't exist
                qr_data = f"Queue ID: {new_queue.id}"
                QRCode.objects.create(queue=new_queue, qr_hash=qr_data)
        
        # Calculate wait minutes for response
        wait_minutes = 0
        if new_queue.expected_ready_time:
            now = timezone.now()
            wait_seconds = max(0, (new_queue.expected_ready_time - now).total_seconds())
            wait_minutes = int(wait_seconds / 60)
        
        return Response({
            "message": "Queue transferred successfully",
            "queue_id": new_queue.id,
            "service_name": target_service.name,
            "position": position,
            "expected_ready_time": new_queue.expected_ready_time.isoformat() if new_queue.expected_ready_time else None,
            "estimated_wait_minutes": wait_minutes,
        })
        
    except Exception as e:
        logger.error(f"Error in transfer_queue: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=500)