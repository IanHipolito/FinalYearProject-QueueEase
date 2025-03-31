from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import User, Queue, QRCode

class Command(BaseCommand):
    help = 'Remove sample users and their queues created by populate_queues command'

    def add_arguments(self, parser):
        parser.add_argument('--confirm', action='store_true', help='Confirm deletion without prompting')
        parser.add_argument('--keep-users', type=int, default=0, help='Number of sample users to keep (starting from lowest ID)')

    def handle(self, *args, **options):
        # Find sample users by their naming pattern
        sample_users = User.objects.filter(name__startswith='Sample User')
        total_users = sample_users.count()
        
        if total_users == 0:
            self.stdout.write(self.style.WARNING('No sample users found to delete.'))
            return
            
        keep_users = options['keep_users']
        users_to_delete = total_users - keep_users
        
        # Get confirmation
        if not options['confirm']:
            self.stdout.write(f'Found {total_users} sample users.')
            if keep_users > 0:
                self.stdout.write(f'Will keep {keep_users} users and delete {users_to_delete}.')
            
            confirm = input(f'Are you sure you want to delete these users and all their associated queue data? [y/N]: ')
            if confirm.lower() != 'y':
                self.stdout.write(self.style.WARNING('Aborted.'))
                return
        
        # Extract user IDs before deleting queues
        if keep_users > 0:
            # Keep some users, ordered by ID
            users_to_keep = sample_users.order_by('id')[:keep_users]
            users_to_delete = sample_users.exclude(id__in=users_to_keep.values_list('id', flat=True))
        else:
            users_to_delete = sample_users
        
        user_ids = list(users_to_delete.values_list('id', flat=True))
        
        with transaction.atomic():
            # Count related items first
            queue_count = Queue.objects.filter(user_id__in=user_ids).count()
            qrcode_count = QRCode.objects.filter(queue__user_id__in=user_ids).count()
            
            self.stdout.write(f'Found {queue_count} queues and {qrcode_count} QR codes to delete.')
            
            # Delete QR codes first
            QRCode.objects.filter(queue__user_id__in=user_ids).delete()
            
            # Then delete queues
            Queue.objects.filter(user_id__in=user_ids).delete()
            
            # Finally delete users
            deleted_count = users_to_delete.delete()[0]
            
            self.stdout.write(self.style.SUCCESS(
                f'Successfully deleted {deleted_count} sample users and their related data.'
            ))
            
            if keep_users > 0:
                self.stdout.write(f'Kept {keep_users} sample users for testing.')