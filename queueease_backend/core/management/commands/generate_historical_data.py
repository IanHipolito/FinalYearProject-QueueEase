import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from core.models import Service, ServiceWaitTime
from django.utils import timezone

class Command(BaseCommand):
    help = 'Generate realistic historical wait time data for fast food and other service types'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=30, help='Number of days of historical data to generate')
        parser.add_argument('--samples-per-day', type=int, default=8, help='Number of samples per day')
        parser.add_argument('--clear', action='store_true', help='Clear existing wait time data before generating new data')
        parser.add_argument('--service-id', type=int, help='Generate data for a specific service ID only')

    def handle(self, *args, **options):
        days = options['days']
        samples_per_day = options['samples_per_day']
        clear_existing = options['clear']
        specific_service_id = options['service_id']
        
        # Query for services to update
        if specific_service_id:
            services = Service.objects.filter(id=specific_service_id, is_active=True)
            if not services.exists():
                self.stdout.write(self.style.ERROR(f'Service with ID {specific_service_id} not found or not active'))
                return
        else:
            services = Service.objects.filter(is_active=True)
        
        # Clear existing data if requested
        if clear_existing:
            if specific_service_id:
                deleted = ServiceWaitTime.objects.filter(service_id=specific_service_id).delete()[0]
            else:
                deleted = ServiceWaitTime.objects.all().delete()[0]
            self.stdout.write(self.style.SUCCESS(f'Deleted {deleted} existing wait time records'))
        
        total_generated = 0
        
        for service in services:
            # Determine appropriate wait time ranges based on service type and category
            base_range, peak_range = self.get_service_wait_ranges(service)
            
            self.stdout.write(f'Generating data for {service.name} (ID: {service.id})')
            self.stdout.write(f'  Service type: {service.service_type}, Category: {service.category}')
            self.stdout.write(f'  Base range: {base_range}, Peak range: {peak_range}')
            
            # Generate data for each day
            for day in range(days):
                date = timezone.now() - timedelta(days=day)
                
                # Generate samples throughout the day
                for sample in range(samples_per_day):
                    # Determine if this is a peak time (lunch, dinner, etc.)
                    hour = random.randint(9, 22)  # Between 9 AM and 10 PM
                    is_peak = (12 <= hour <= 14) or (17 <= hour <= 19)  # Lunch or dinner hours
                    is_weekend = date.weekday() >= 5  # Saturday or Sunday
                    
                    # Adjust time of the sample
                    sample_time = date.replace(
                        hour=hour,
                        minute=random.randint(0, 59),
                        second=random.randint(0, 59)
                    )
                    
                    # Select appropriate range based on time
                    if is_peak or is_weekend:
                        min_wait, max_wait = peak_range
                    else:
                        min_wait, max_wait = base_range
                    
                    # Add some noise: occasionally have a very busy period
                    if random.random() < 0.05:  # 5% chance of an unusual wait
                        wait_time = random.randint(max_wait, max_wait + 10)
                    else:
                        wait_time = random.randint(min_wait, max_wait)
                    
                    # Create the wait time record
                    ServiceWaitTime.objects.create(
                        service=service,
                        wait_time=wait_time,
                        date_recorded=sample_time
                    )
                    total_generated += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully generated {total_generated} historical wait time records'))

    def get_service_wait_ranges(self, service):
        """
        Determine realistic wait time ranges based on service type and category.
        Returns (base_range, peak_range) as tuples of (min, max) wait times in minutes.
        """
        # Default ranges
        base_range = (5, 15)
        peak_range = (10, 20)
        
        # Fast food specific ranges
        if service.service_type == 'immediate':
            if service.category in ['fast_food', 'restaurant', 'cafe', 'food_court']:
                name_lower = service.name.lower()
                
                # McDonald's and similar fast food
                if any(chain in name_lower for chain in ['mcdonald', 'burger king', 'kfc', 'subway']):
                    base_range = (3, 8)
                    peak_range = (5, 15)
                
                # Coffee shops
                elif any(chain in name_lower for chain in ['starbucks', 'costa', 'cafe', 'coffee']):
                    base_range = (2, 7)
                    peak_range = (4, 12)
                
                # Sit-down restaurants
                elif service.category == 'restaurant':
                    base_range = (7, 15)
                    peak_range = (12, 25)
                
                # Default fast food
                else:
                    base_range = (5, 10)
                    peak_range = (8, 18)
            
            # Other immediate services
            elif service.category in ['bank', 'post_office', 'customer_service']:
                base_range = (5, 15)
                peak_range = (15, 30)
            
            # Retail/shops
            elif service.category in ['shop', 'supermarket', 'retail']:
                base_range = (3, 8)
                peak_range = (5, 15)
            
            # All other immediate services
            else:
                base_range = (5, 12)
                peak_range = (8, 20)
        
        # Appointment-based services
        else:
            # Healthcare
            if service.category in ['healthcare', 'doctor', 'clinic', 'dentist', 'hospital']:
                base_range = (10, 20)
                peak_range = (15, 40)
            
            # All other appointment services
            else:
                base_range = (8, 15)
                peak_range = (12, 25)
        
        return base_range, peak_range