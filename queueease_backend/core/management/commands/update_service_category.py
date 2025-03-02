from django.core.management.base import BaseCommand
from core.models import Service

class Command(BaseCommand):
    help = 'Update category field for existing services based on details.amenity'

    def handle(self, *args, **kwargs):
        services = Service.objects.all()
        updated = 0
        for service in services:
            if not service.category and service.details and 'amenity' in service.details:
                service.category = service.details.get('amenity')
                service.save()
                updated += 1
        self.stdout.write(self.style.SUCCESS(f'Updated category for {updated} services'))
