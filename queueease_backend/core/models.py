from django.db import models
from django.contrib.auth.models import User

class User(models.Model):
    USER_TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('employee', 'Employee'),
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

class Department(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, related_name="departments")
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Specialization(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class EmployeeDetails(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    specialization = models.ForeignKey(Specialization, on_delete=models.SET_NULL, null=True)
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name} - {self.company.name if self.company else 'No Company'}"

class Service(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_valid_from = models.DateTimeField(null=True, blank=True)
    date_valid_to = models.DateTimeField(null=True, blank=True)
    date_deleted = models.DateTimeField(null=True, blank=True)
    requires_prep_time = models.BooleanField(default=True)
    minimal_prep_time = models.IntegerField(default=3)
    parallel_capacity = models.IntegerField(default=1)
    average_duration = models.IntegerField(default=15)

    def __str__(self):
        return self.name

class ServiceCompany(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('service', 'company')

class Queue(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    employee = models.ForeignKey(EmployeeDetails, on_delete=models.CASCADE, null=True, blank=True) # Allow null for self-service
    appointment = models.ForeignKey('AppointmentDetails', on_delete=models.SET_NULL, null=True, blank=True)
    sequence_number = models.IntegerField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_valid_from = models.DateTimeField(null=True, blank=True)
    date_valid_to = models.DateTimeField(null=True, blank=True)
    date_deleted = models.DateTimeField(null=True, blank=True)
    expected_ready_time = models.DateTimeField(null=True, blank=True)

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
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    QUEUE_STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_queue', 'In Queue'),
        ('completed', 'Completed'),
    ]

    order_id = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey('Service', on_delete=models.CASCADE)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    duration_minutes = models.IntegerField(default=30)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    queue_status = models.CharField(max_length=50, choices=QUEUE_STATUS_CHOICES, default='not_started')
    is_active = models.BooleanField(default=True)  # Track whether the appointment is active

    def __str__(self):
        return f"Appointment {self.order_id} - {self.user.username}"