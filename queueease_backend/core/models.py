from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
import pytz
from django.conf import settings

class User(models.Model):
    USER_TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('employee', 'Employee'),
        ('admin', 'Admin'),
    ]
    SIGNUP_TYPE_CHOICES = [
        ('regular', 'Regular'),
        ('guest', 'Guest'),
    ]

    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(unique=True)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    password = models.CharField(max_length=255, null=True, blank=True)
    user_type = models.CharField(max_length=50, choices=USER_TYPE_CHOICES)
    signup_type = models.CharField(max_length=50, choices=SIGNUP_TYPE_CHOICES, default='regular')
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(
                    (models.Q(signup_type='regular') & models.Q(name__isnull=False) &
                     models.Q(password__isnull=False) & models.Q(email__isnull=False) &
                     models.Q(mobile_number__isnull=False))
                    |
                    (models.Q(signup_type='guest') & models.Q(email__isnull=False) &
                     models.Q(mobile_number__isnull=True) & models.Q(name__isnull=True) &
                     models.Q(password__isnull=True))
                ),
                name="chk_signup_type"
            )
        ]

class Company(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField()

    def __str__(self):
        return self.name

class Service(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_valid_from = models.DateTimeField(null=True, blank=True)
    date_valid_to = models.DateTimeField(null=True, blank=True)
    date_deleted = models.DateTimeField(null=True, blank=True)
    requires_prep_time = models.BooleanField(default=True)
    minimal_prep_time = models.IntegerField(default=5)
    parallel_capacity = models.IntegerField(default=1)
    average_duration = models.IntegerField(default=15)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    details = models.JSONField(null=True, blank=True)

    SERVICE_TYPE_CHOICES = [
        ('immediate', 'Immediate Queuing'),
        ('appointment', 'Appointment Based'),
    ]
    service_type = models.CharField(
        max_length=20,
        choices=SERVICE_TYPE_CHOICES,
        default='immediate'
    )

    def __str__(self):
        return self.name

class ServiceCompany(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('service', 'company')

class ServiceQueue(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='service_queues')
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    current_member_count = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = "Service Queue"
        verbose_name_plural = "Service Queues"
    
    def __str__(self):
        return f"Queue for {self.service.name} ({self.current_member_count} members)"
    
class Queue(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('transferred', 'Transferred'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    service_queue = models.ForeignKey(ServiceQueue, on_delete=models.CASCADE, related_name='members', null=True)
    appointment = models.ForeignKey('AppointmentDetails', on_delete=models.SET_NULL, null=True, blank=True)
    sequence_number = models.IntegerField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_valid_from = models.DateTimeField(null=True, blank=True)
    date_valid_to = models.DateTimeField(null=True, blank=True)
    date_deleted = models.DateTimeField(null=True, blank=True)
    expected_ready_time = models.DateTimeField(null=True, blank=True)
    transferred_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='transferred_to')
    last_notification_time = models.DateTimeField(null=True, blank=True)
    last_notified_position = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['sequence_number']
        verbose_name = "Queue"
        verbose_name_plural = "Queues"
        indexes = [
            models.Index(fields=['user', 'service'], name='idx_queue_user_service'),
        ]

    def __str__(self):
        return f"Queue {self.id} - {self.user.name}"

class QRCode(models.Model):
    queue = models.OneToOneField(Queue, on_delete=models.CASCADE)
    qr_hash = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"QR Code for Queue {self.queue.id}"

class AppointmentDetails(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('checked_in', 'Checked In'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('missed', 'Missed'),
    ]

    order_id = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey('Service', on_delete=models.CASCADE)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    duration_minutes = models.IntegerField(default=30)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='scheduled')
    is_active = models.BooleanField(default=True)
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    expected_duration = models.IntegerField(default=30)
    delay_minutes = models.IntegerField(null=True, blank=True)
    delay_notified = models.BooleanField(default=False)
    last_reminder_sent = models.DateTimeField(null=True, blank=True)
    check_in_time = models.DateTimeField(null=True, blank=True)
    delay_reason = models.CharField(max_length=255, null=True, blank=True, help_text="Reason for the delay")
    delay_set_by = models.ForeignKey('User', on_delete=models.SET_NULL, 
                                null=True, blank=True, 
                                related_name='set_delays',
                                help_text="Staff member who set the delay")
    delay_set_time = models.DateTimeField(null=True, blank=True, help_text="When the delay was set")
    
    # Define properties to help with time calculations
    @property
    def is_past_appointment(self):
        current_date = timezone.now().date()
        current_time = timezone.now().time()
        
        if self.appointment_date < current_date:
            return True
        if self.appointment_date == current_date and self.appointment_time < current_time:
            return True
        return False
    
    @property
    def expected_start_datetime(self):
        # Combine date and time into a datetime
        base_datetime = datetime.combine(self.appointment_date, self.appointment_time)
        # Make aware with the server's timezone
        irish_tz = pytz.timezone(settings.TIME_ZONE)
        base_datetime = timezone.make_aware(base_datetime, irish_tz)
        
        # Add delay if any and normalize
        if self.delay_minutes:
            base_datetime = irish_tz.normalize(base_datetime + timedelta(minutes=self.delay_minutes))
        
        return base_datetime

    @property
    def time_until_appointment(self):
        now = timezone.now()
        
        if timezone.is_naive(now):
            irish_tz = pytz.timezone(settings.TIME_ZONE)
            now = timezone.make_aware(now, irish_tz)
        
        # Calculate time difference
        time_diff = (self.expected_start_datetime - now).total_seconds()
        return max(0, time_diff)
    
    @property
    def formatted_time_until(self):
        seconds = self.time_until_appointment
        
        days = int(seconds // (24 * 3600))
        seconds %= (24 * 3600)
        hours = int(seconds // 3600)
        seconds %= 3600
        minutes = int(seconds // 60)
        
        if days > 0:
            return f"{days}d {hours}h {minutes}m"
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"

    def __str__(self):
        return f"Appointment {self.order_id} - {self.user.name}"

class ServiceWaitTime(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    wait_time = models.IntegerField()
    date_recorded = models.DateTimeField()

    def __str__(self):
        return f"{self.service.name} - {self.wait_time} minutes"
    
class QueueSequence(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Queue Sequence for {self.user.name}"

class ServiceAdmin(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_services')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='admins')
    is_owner = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'service')
        verbose_name = 'Service Administrator'
        verbose_name_plural = 'Service Administrators'

    def __str__(self):
        return f"{self.user.name} - {self.service.name}"

class FCMToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fcm_tokens')
    token = models.TextField()
    device_info = models.JSONField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'token')
        
    def __str__(self):
        return f"FCM Token for {self.user.name}"
    
class Feedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='feedbacks')
    queue = models.ForeignKey(Queue, on_delete=models.CASCADE, related_name='feedbacks', null=True, blank=True)
    rating = models.IntegerField()
    comment = models.TextField(blank=True, null=True)
    categories = models.JSONField(default=list)
    sentiment = models.CharField(max_length=20, default='neutral')
    created_at = models.DateTimeField(auto_now_add=True)
    total_wait = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'service', 'queue']
        
    def __str__(self):
        return f"Feedback from {self.user.name} for {self.service.name}"
    
class NotificationSettings(models.Model):
    service = models.OneToOneField('Service', on_delete=models.CASCADE, related_name='notification_settings')
    is_enabled = models.BooleanField(default=True)
    frequency_minutes = models.IntegerField(default=5)
    message_template = models.TextField(default="Your order is in queue. Position: {queue_position}, remaining time: {remaining_time} minutes.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Notification Settings for {self.service.name}"