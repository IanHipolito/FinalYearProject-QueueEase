from django.core.management.base import BaseCommand
from core.models import Service

class Command(BaseCommand):
    help = 'Updates minimal_prep_time for all immediate services to 8 minutes'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Preview changes without saving')

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        # Get all immediate services
        services = Service.objects.filter(
            service_type='immediate',
            is_active=True
        )
        
        count = services.count()
        self.stdout.write(f"Found {count} active immediate services")
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN: No changes will be saved'))
            
            # Show before and after values
            for service in services:
                self.stdout.write(f"{service.name}: {service.minimal_prep_time} → 8")
                
            self.stdout.write(self.style.SUCCESS(f"DRY RUN: Would update {count} services"))
            return
            
        # Update all services at once
        updated = services.update(minimal_prep_time=8)
        
        self.stdout.write(self.style.SUCCESS(
            f"Successfully updated minimal_prep_time to 8 minutes for {updated} immediate services"
        ))