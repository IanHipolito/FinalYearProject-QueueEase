from django.core.management.base import BaseCommand
from core.models import Queue, AppointmentDetails, FCMToken
from core.services.notifications import send_queue_update_notification, send_appointment_reminder
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Send queued notifications for appointments and queue updates'

    def handle(self, *args, **options):
        self.send_queue_notifications()
        self.send_appointment_reminders()
        self.stdout.write(self.style.SUCCESS('Successfully sent scheduled notifications'))
    
    def send_queue_notifications(self):
        """Process all active queues and send notifications"""
        # Get all active queues
        queues = Queue.objects.filter(
            status='pending',
            is_active=True
        ).order_by('service', 'date_created')
        
        # Group by service
        service_queues = {}
        for queue in queues:
            if queue.service_id not in service_queues:
                service_queues[queue.service_id] = []
            service_queues[queue.service_id].append(queue)
        
        # Process each service's queues
        notifications_sent = 0
        for service_id, service_queue_list in service_queues.items():
            for index, queue in enumerate(service_queue_list):
                position = index + 1
                
                # Determine if we should notify based on position
                should_notify = position <= 3 or position % 5 == 0
                
                if should_notify:
                    try:
                        # Get user token
                        fcm_tokens = FCMToken.objects.filter(
                            user=queue.user, 
                            is_active=True
                        )
                        
                        if not fcm_tokens.exists():
                            continue
                            
                        # Get wait time
                        wait_time = 0
                        if queue.expected_ready_time:
                            now = datetime.now(queue.expected_ready_time.tzinfo)
                            wait_seconds = max(0, (queue.expected_ready_time - now).total_seconds())
                            wait_time = int(wait_seconds / 60)
                        
                        # Send notification to each token
                        for token_obj in fcm_tokens:
                            result = send_queue_update_notification(
                                token=token_obj.token,
                                queue_id=queue.id,
                                position=position,
                                wait_time=wait_time,
                                service_name=queue.service.name
                            )
                            
                            if result.get('success'):
                                notifications_sent += 1
                    
                    except Exception as e:
                        logger.error(f"Error sending queue notification: {str(e)}")
        
        self.stdout.write(f"Sent {notifications_sent} queue notifications")
    
    def send_appointment_reminders(self):
        """Send reminders for upcoming appointments"""
        now = datetime.now()
        today = now.date()
        
        # Find today's appointments
        appointments = AppointmentDetails.objects.filter(
            appointment_date=today,
            status='pending',
            is_active=True
        )
        
        notifications_sent = 0
        for appointment in appointments:
            # Convert time to datetime for comparison
            appt_time = datetime.combine(
                appointment.appointment_date,
                appointment.appointment_time
            )
            
            # Calculate minutes until appointment
            delta = appt_time - now
            minutes_until = max(0, int(delta.total_seconds() / 60))
            
            # Send at strategic times
            should_notify = minutes_until in [60, 30, 15, 5]
            
            if should_notify:
                try:
                    # Get user tokens
                    fcm_tokens = FCMToken.objects.filter(
                        user=appointment.user, 
                        is_active=True
                    )
                    
                    if not fcm_tokens.exists():
                        continue
                    
                    # Send to each token
                    for token_obj in fcm_tokens:
                        result = send_appointment_reminder(
                            token=token_obj.token,
                            appointment_id=appointment.order_id,
                            service_name=appointment.service.name,
                            time_until=minutes_until
                        )
                        
                        if result.get('success'):
                            notifications_sent += 1
                
                except Exception as e:
                    logger.error(f"Error sending appointment reminder: {str(e)}")
        
        self.stdout.write(f"Sent {notifications_sent} appointment reminders")