from django.core.management.base import BaseCommand
from core.models import Service

class Command(BaseCommand):
    help = 'Updates service types based on categories and names'

    def handle(self, *args, **options):
        appointment_categories = [
            'healthcare', 'doctors', 'clinic', 'dentist', 'hospital',
            'doctor', 'medical', 'dental', 'orthodontist', 'medical_centre',
            'gp', 'surgery', 'orthodontics', 'medical_center',
            'optician', 'optometrist', 'physiotherapy', 'mental_health',
            'counselling', 'psychologist', 'psychiatrist', 'therapy',
            'education', 'tutoring', 'salon', 'spa', 'consultation', 
            'legal', 'banking_services', 'government', 'veterinary',
            'passport', 'immigration', 'driving_license', 'tax'
        ]
        
        category_services = Service.objects.filter(
            category__in=appointment_categories
        )
        count1 = category_services.update(service_type='appointment')
        self.stdout.write(self.style.SUCCESS(f'Updated {count1} services based on categories'))
        
        appointment_keywords = [
            'Medical Clinic', 'Dental', 'Health Centre', 'Surgery',
            'Doctor', 'Dentist', 'Medical Centre', 'Orthodontic',
            'Health Insurance', 'Fresh Breath Clinic', 'IVF',
            'Blood Transfusion', 'Optician', 'Live and Smile',
            'Glenview Dental', 'Castleknock Dental',
            'Mental Health', 'Therapy', 'Counselling', 'Psychology',
            'Psychiatry', 'Everyman Centre', 'Holistic', 
            'Passport Office', 'Tax', 'Legal Advice', 
            'Mortgage Consultation', 'Tutoring',
            'Personal Training', 'Health Service Executive',
            'HSE', 'Primary Care',
            'Millbrook Lawns Health Centre', 'Northbrook Clinic',
            'Grange Clinic', 'Slievemore Clinic', 'Carne Dental Surgery', 
            'Ballyfermot Health Centre', 'The Belfield Clinic',
            'Priority Medical', 'Glenville Dental', 'Dublin Dental Care',
            'Dublin Dental Rooms', 'Sims IVF'
        ]
        
        count2 = 0
        for keyword in appointment_keywords:
            keyword_services = Service.objects.filter(
                name__icontains=keyword,
                service_type='immediate'  # Only update those not already set
            )
            count_keyword = keyword_services.update(service_type='appointment')
            if count_keyword > 0:
                self.stdout.write(f'Updated {count_keyword} services containing "{keyword}"')
                count2 += count_keyword
        
        self.stdout.write(self.style.SUCCESS(f'Updated {count2} services based on names'))
        
        immediate_categories = [
            'fast_food', 'restaurant', 'cafe', 'coffee_shop', 'pub', 'bar',
            'food_court', 'ice_cream', 'bakery', 'supermarket', 'shop',
            'retail', 'post_office', 'bank_counter', 'customer_service',
            'ticket_counter', 'convenience', 'pharmacy_counter'
        ]
        
        immediate_keywords = [
            'McDonald', 'Burger King', 'KFC', 'Subway', 'Pizza', 'Starbucks',
            'Costa', 'Cafe', 'Coffee', 'Restaurant', 'Pub', 'Takeaway',
            'Fast Food', 'Bar', 'Burrito', 'Diner', 'Chipper', 'Food Court',
            'Post Office', 'Ticket Counter', 'Customer Service'
        ]
        
        count3 = 0
        for category in immediate_categories:
            category_fix = Service.objects.filter(
                category__iexact=category,
                service_type='appointment'
            )
            count_fix = category_fix.update(service_type='immediate')
            if count_fix > 0:
                self.stdout.write(f'Fixed {count_fix} {category} services to immediate')
                count3 += count_fix
        
        for keyword in immediate_keywords:
            name_fix = Service.objects.filter(
                name__icontains=keyword,
                service_type='appointment'
            )
            count_fix = name_fix.update(service_type='immediate')
            if count_fix > 0:
                self.stdout.write(f'Fixed {count_fix} services with "{keyword}" in name to immediate')
                count3 += count_fix
        
        self.stdout.write(self.style.SUCCESS(f'Fixed {count3} immediate services that were miscategorized'))
        appointment_services = Service.objects.filter(service_type='appointment')
        immediate_services = Service.objects.filter(service_type='immediate')
        
        self.stdout.write('\nSummary:')
        self.stdout.write(f'- Services marked as appointment-based: {appointment_services.count()}')
        self.stdout.write(f'- Services marked as immediate queuing: {immediate_services.count()}')
        self.stdout.write(f'- Total services processed: {appointment_services.count() + immediate_services.count()}')
        
        if appointment_services.exists():
            self.stdout.write('\nSample appointment-based services:')
            for service in appointment_services.order_by('?')[:10]:
                self.stdout.write(f'- {service.name} (Category: {service.category or "None"})')
        
        if immediate_services.exists():
            self.stdout.write('\nSample immediate-queuing services:')
            for service in immediate_services.order_by('?')[:10]:
                self.stdout.write(f'- {service.name} (Category: {service.category or "None"})')