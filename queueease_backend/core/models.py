from django.db import models

class User(models.Model):
    USER_TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('employee', 'Employee'),
    ]
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    mobile_number = models.CharField(max_length=15)
    password = models.CharField(max_length=255)
    user_type = models.CharField(max_length=50, choices=USER_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)

class Service(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)

class Queue(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='employee_queue'
    )
    sequence_number = models.IntegerField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)

class Meta:
    ordering = ['sequence_number']
    verbose_name = "Queue"
    verbose_name_plural = "Queues"
    
    def __str__(self):
        return f"Queue {self.id}: {self.user.name} - {self.service.name} (Status: {self.status})"

class QRCode(models.Model):
    queue = models.OneToOneField(Queue, on_delete=models.CASCADE)
    qr_hash = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
