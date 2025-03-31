from django.core.management.base import BaseCommand
from core.models import ServiceWaitTime

class Command(BaseCommand):
    help = 'Delete all historical wait time data'

    def handle(self, *args, **kwargs):
        count = ServiceWaitTime.objects.count()
        ServiceWaitTime.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {count} historical wait time records')
        )