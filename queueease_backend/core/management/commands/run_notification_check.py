import time
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, datetime
from django.conf import settings
import pytz
from core.models import Queue, FCMToken, NotificationSettings, AppointmentDetails
from core.services.notifications import send_queue_update_notification, send_push_notification, send_queue_almost_ready_notification, send_appointment_delay_notification, send_appointment_reminder

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Runs a continuous loop checking for notifications to send'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting notification checker...'))
        
        try:
            while True:
                try:
                    # Process queue notifications
                    self.process_queue_notifications()
                    
                    # Process appointment notifications
                    self.process_appointment_notifications()
                    
                    # Process completion notifications
                    self.process_completion_notifications()

                    # Process appointment reminders
                    self.process_appointment_reminders()
                    
                    # Sleep for a reasonable interval
                    self.stdout.write('Sleeping for 60 seconds...')
                    time.sleep(60)
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error in notification cycle: {str(e)}'))
                    # Continue the loop even if there's an error
                    time.sleep(60)
                
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Notification checker stopped.'))

    def process_queue_notifications(self):
        now = timezone.now()
        self.stdout.write(f'[{now}] Checking for queue notifications...')
        
        # Get all active queues
        active_queues = Queue.objects.filter(status='pending', is_active=True)
        
        self.stdout.write(f'Found {active_queues.count()} active queues')
        
        sent_count = 0
        for queue in active_queues:
            try:
                # Calculate current position
                current_position = Queue.objects.filter(
                    service=queue.service,
                    status='pending',
                    is_active=True,
                    date_created__lt=queue.date_created
                ).count() + 1
                
                # Get notification settings
                settings, _ = NotificationSettings.objects.get_or_create(
                    service=queue.service,
                    defaults={'frequency_minutes': 5, 'is_enabled': True}
                )
                
                if not settings.is_enabled:
                    continue
                    
                # Check when the last notification was sent
                last_notification = queue.last_notification_time
                send_notification = False
                special_two_min_notification = False
                position_changed = False
                
                # Check if position has changed since last notification
                if queue.last_notified_position is not None and queue.last_notified_position != current_position:
                    position_changed = True
                    self.stdout.write(f'Position changed for queue {queue.id}: {queue.last_notified_position} -> {current_position}')
                
                # Calculate current wait time
                wait_time = 0
                if queue.expected_ready_time:
                    wait_seconds = max(0, (queue.expected_ready_time - now).total_seconds())
                    wait_time = int(wait_seconds / 60)
                    
                    # Special case: If there are around 2 minutes left (between 1.5 and 2.5 minutes)
                    if 1.5 <= wait_time <= 2.5:
                        if not last_notification or (now - last_notification) >= timedelta(minutes=1):
                            send_notification = True
                            special_two_min_notification = True
                
                # Check if position changed AND either no previous notification OR enough time has passed
                if position_changed and (not last_notification or (now - last_notification) >= timedelta(minutes=1)):
                    send_notification = True
                    self.stdout.write(f'Sending notification due to position change: {queue.last_notified_position} -> {current_position}')
                
                # Regular frequency-based notification
                if not send_notification and (not last_notification or (now - last_notification) >= timedelta(minutes=settings.frequency_minutes)):
                    send_notification = True
                    self.stdout.write(f'Sending notification based on frequency ({settings.frequency_minutes} min)')
                
                if send_notification:
                    try:
                        fcm_token = FCMToken.objects.filter(
                            user=queue.user, 
                            is_active=True
                        ).latest('updated_at')
                        
                        # Send notification
                        result = None
                        # Special message for 2-minute warning
                        if special_two_min_notification:
                            result = send_queue_almost_ready_notification(
                                token=fcm_token.token,
                                queue_id=queue.id,
                                service_name=queue.service.name
                            )
                        else:
                            result = send_queue_update_notification(
                                token=fcm_token.token,
                                queue_id=queue.id,
                                position=current_position,
                                wait_time=wait_time,
                                service_name=queue.service.name
                            )
                        
                        if result and result.get('success'):
                            # Update last notification time and position
                            queue.last_notification_time = now
                            queue.last_notified_position = current_position
                            queue.save(update_fields=['last_notification_time', 'last_notified_position'])
                            sent_count += 1
                        
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error sending notification: {str(e)}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing queue {queue.id}: {str(e)}'))
                    
        self.stdout.write(self.style.SUCCESS(f'Sent {sent_count} notifications'))

    def process_completion_notifications(self):
        now = timezone.now()
        
        # Find queues that are pending but expected time has passed
        pending_ready_queues = Queue.objects.filter(
            status='pending',
            is_active=True,
            expected_ready_time__lte=now
        )
        
        completed = 0
        self.stdout.write(f'Found {pending_ready_queues.count()} queues ready for completion')
        
        for queue in pending_ready_queues:
            try:
                # Mark as completed
                queue.status = 'completed'
                queue.save()
                
                # Send completion notification
                try:
                    fcm_token = FCMToken.objects.filter(
                        user=queue.user, 
                        is_active=True
                    ).latest('updated_at')
                    
                    result = send_push_notification(
                        token=fcm_token.token,
                        title=f"Your order is ready!",
                        body=f"Your order at {queue.service.name} is now ready for collection.",
                        data={
                            "type": "queue_completed",
                            "queue_id": str(queue.id),
                            "url": f"/success/{queue.id}"
                        }
                    )
                    
                    if result.get('success'):
                        completed += 1
                        self.stdout.write(f'Completed queue {queue.id} and sent notification')
                    else:
                        self.stdout.write(self.style.ERROR(f'Failed to send completion notification: {result.get("error", "Unknown error")}'))
                    
                except FCMToken.DoesNotExist:
                    self.stdout.write(f'No FCM token for user {queue.user.id}')
                    continue
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error sending completion notification: {str(e)}'))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing completion for queue {queue.id}: {str(e)}'))
                
        if completed > 0:
            self.stdout.write(self.style.SUCCESS(f'Completed {completed} queues and sent notifications'))

    def process_appointment_reminders(self):
        self.stdout.write('Checking for appointment reminders...')
        
        # Get current time
        now = timezone.now()
        
        # Define reminder intervals in minutes with enhanced messages
        reminder_intervals = [
            {
                'minutes': 15, 
                'message': 'Your appointment is starting in 15 minutes. Please arrive at the venue now.'
            },
            {
                'minutes': 60, 
                'message': 'Your appointment is in 1 hour. Please plan to arrive 15 minutes early.'
            },
            {
                'minutes': 180, 
                'message': 'Your appointment is in 3 hours. Please remember to bring any required documents.'
            },
            {
                'minutes': 1440, 
                'message': 'Reminder: Your appointment is tomorrow. We look forward to seeing you!'
            }
        ]
        
        # Track how many notifications were sent
        notifications_sent = 0
        
        # Get upcoming appointments that are scheduled or checked in
        upcoming_appointments = AppointmentDetails.objects.filter(
            appointment_date__gte=now.date(),
            status__in=['scheduled', 'checked_in']
        ).select_related('user', 'service')
        
        for appointment in upcoming_appointments:
            try:
                # Combine appointment date and time into a datetime object
                appointment_start = appointment.expected_start_datetime
                
                # Calculate time difference in minutes
                time_difference = (appointment_start - now).total_seconds() / 60
                
                # Check if this appointment matches any of our reminder intervals
                for interval in reminder_intervals:
                    interval_minutes = interval['minutes']
                    # Allow a 5-minute window to avoid missing notifications due to timing
                    if interval_minutes - 5 <= time_difference <= interval_minutes + 5:
                        # Check if a notification was recently sent for this appointment
                        if (appointment.last_reminder_sent and 
                            (now - appointment.last_reminder_sent).total_seconds() < 3600):
                            # Skip if a reminder was sent in the last hour
                            continue
                            
                        # Try to get user's FCM token
                        try:
                            fcm_token = FCMToken.objects.filter(
                                user=appointment.user,
                                is_active=True
                            ).latest('updated_at')
                            
                            # Send the appointment reminder
                            send_appointment_reminder(
                                token=fcm_token.token,
                                appointment_id=appointment.order_id,
                                service_name=appointment.service.name,
                                time_until=interval['message']
                            )
                            
                            # Update the last reminder time
                            appointment.last_reminder_sent = now
                            appointment.save(update_fields=['last_reminder_sent'])
                            
                            notifications_sent += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'Sent {interval_minutes}-minute reminder for appointment {appointment.order_id}'
                                )
                            )
                            
                        except FCMToken.DoesNotExist:
                            self.stdout.write(
                                self.style.WARNING(
                                    f'No FCM token found for user {appointment.user.id}'
                                )
                            )
                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(
                                    f'Error sending reminder: {str(e)}'
                                )
                            )

                        break
                        
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error processing appointment reminder {appointment.order_id}: {str(e)}'
                    )
                )
        
        self.stdout.write(f'Sent {notifications_sent} appointment reminders')

    def process_appointment_notifications(self):
        self.stdout.write('Checking for appointment notifications...')
        
        # Get current time
        now = timezone.now()
        
        # Find appointments that have been delayed but not notified
        delayed_appointments = AppointmentDetails.objects.filter(
            appointment_date__gte=now.date(),
            status__in=['scheduled', 'checked_in'],
            delay_minutes__gt=0,
            delay_notified=False
        ).select_related('user', 'service')
        
        self.stdout.write(f'Found {delayed_appointments.count()} delayed appointments to notify')
        
        notifications_sent = 0
        for appointment in delayed_appointments:
            try:
                # Try to get user's FCM token
                fcm_tokens = FCMToken.objects.filter(
                    user=appointment.user,
                    is_active=True
                )
                
                if fcm_tokens.exists():
                    fcm_token = fcm_tokens.latest('updated_at')
                    
                    # Calculate the new expected start time
                    irish_tz = pytz.timezone(settings.TIME_ZONE)
                    scheduled_datetime = datetime.combine(
                        appointment.appointment_date,
                        appointment.appointment_time
                    )
                    if timezone.is_naive(scheduled_datetime):
                        scheduled_datetime = timezone.make_aware(scheduled_datetime, irish_tz)
                    
                    new_expected_time = scheduled_datetime + timedelta(minutes=appointment.delay_minutes)
                    
                    # Send the delay notification
                    result = send_appointment_delay_notification(
                        token=fcm_token.token,
                        appointment_id=appointment.order_id,
                        service_name=appointment.service.name,
                        delay_minutes=appointment.delay_minutes,
                        new_time=new_expected_time
                    )
                    
                    if result and result.get('success'):
                        # Mark as notified
                        appointment.delay_notified = True
                        appointment.save(update_fields=['delay_notified'])
                        
                        notifications_sent += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Sent delay notification ({appointment.delay_minutes} min) for appointment {appointment.order_id}'
                            )
                        )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'No FCM token found for user {appointment.user.id}'
                        )
                    )
                        
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error processing appointment delay {appointment.order_id}: {str(e)}'
                    )
                )
        
        self.stdout.write(f'Sent {notifications_sent} appointment delay notifications')
