import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction
from core.models import User, Service, Queue, QRCode
from core.views import compute_expected_ready_time

class Command(BaseCommand):
    help = 'Populate queues with sample users for immediate services'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=50, help='Number of users to create')
        parser.add_argument('--queues_per_service', type=int, default=5, help='Average number of users per service queue')
        parser.add_argument('--password', type=str, default='queueease123', help='Common password for all sample users')

    def handle(self, *args, **options):
        user_count = options['users']
        queues_per_service = options['queues_per_service']
        password = options['password']
        
        self.stdout.write(f'Creating {user_count} sample users...')
        
        # Get all active immediate services
        services = Service.objects.filter(
            is_active=True, 
            service_type='immediate'
        )
        
        if not services.exists():
            self.stdout.write(self.style.ERROR('No active immediate services found'))
            return
            
        service_count = services.count()
        self.stdout.write(f'Found {service_count} immediate services to populate')
        
        # Create common password hash
        hashed_password = make_password(password)
        
        with transaction.atomic():
            # Create sample users
            sample_users = []
            for i in range(user_count):
                username = f"user{i+1}_{random.randint(1000, 9999)}"
                email = f"{username}@example.com"
                
                user = User(
                    name=f"Sample User {i+1}",
                    email=email,
                    mobile_number=f"+353{random.randint(8100000, 8999999)}",
                    password=hashed_password,
                    user_type='customer',
                    signup_type='regular',
                    is_active=True
                )
                sample_users.append(user)
            
            # Bulk create users
            User.objects.bulk_create(sample_users)
            self.stdout.write(self.style.SUCCESS(f'Created {len(sample_users)} sample users'))
            
            # Distribute users across services
            created_queues = 0
            
            for service in services:
                # Determine how many users for this service (random variation around average)
                user_count_for_service = max(1, int(queues_per_service * random.uniform(0.7, 1.3)))
                
                # Get random subset of users for this service
                service_users = random.sample(sample_users, min(user_count_for_service, len(sample_users)))
                
                self.stdout.write(f'Adding {len(service_users)} users to queue for {service.name}')
                
                # Add users to queue
                for position, user in enumerate(service_users, 1):
                    # Create queue entry
                    queue_item = Queue(
                        user=user,
                        service=service,
                        sequence_number=position,
                        status='pending'
                    )
                    
                    # Compute expected ready time
                    queue_item.expected_ready_time = datetime.now() + timedelta(
                        minutes=position * (service.average_duration or 15) / (service.parallel_capacity or 1)
                    )
                    queue_item.save()
                    
                    # Create QR code
                    qr_data = f"Queue ID: {queue_item.id}"
                    QRCode.objects.create(queue=queue_item, qr_hash=qr_data)
                    
                    created_queues += 1
                    
            self.stdout.write(self.style.SUCCESS(f'Successfully created {created_queues} queue entries'))
            self.stdout.write(f'All users have password: {password}')