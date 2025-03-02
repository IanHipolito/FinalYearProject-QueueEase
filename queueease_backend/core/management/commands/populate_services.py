import os
from django.core.management.base import BaseCommand
from core.models import Service
from core.utils import parse_geojson, categorize_services

class Command(BaseCommand):
    help = 'Populate services from GeoJSON file'

    def handle(self, *args, **kwargs):
        # Go up five levels to reach the project root:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        filepath = os.path.join(base_dir, 'queueease-frontend', 'src', 'data', 'Other_Services.geojson')
        print(f"Using file path: {filepath}")  # For verification
        services = parse_geojson(filepath)
        categorized_services = categorize_services(services)
        
        for category, services in categorized_services.items():
            for service in services:
                existing_service = Service.objects.filter(name=service['name'], latitude=service['latitude'], longitude=service['longitude']).first()
                if existing_service:
                    existing_service.description = service['details'].get('description', '')
                    existing_service.category = service['category']
                    existing_service.details = service['details']
                    existing_service.save()
                else:
                    Service.objects.create(
                        name=service['name'],
                        description=service['details'].get('description', ''),
                        category=service['category'],
                        is_active=True,
                        latitude=service['latitude'],
                        longitude=service['longitude'],
                        details=service['details']
                    )
        self.stdout.write(self.style.SUCCESS('Successfully populated services'))