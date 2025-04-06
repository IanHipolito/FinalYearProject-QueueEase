import time
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Queue, FCMToken, NotificationSettings
from core.services.notifications import send_queue_update_notification, send_push_notification, send_queue_almost_ready_notification

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
                    
                    # Process completion notifications
                    self.process_completion_notifications()
                    
                    # Sleep for a reasonable interval (e.g., 60 seconds)
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