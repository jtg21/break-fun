from django.core.management.base import BaseCommand
from agents.models import User, ChatHistory

class Command(BaseCommand):
    help = 'Cleans up duplicate users by keeping the oldest one for each wallet address'

    def handle(self, *args, **options):
        # Get all wallet addresses
        wallet_addresses = User.objects.values_list('wallet_address', flat=True).distinct()
        
        for wallet in wallet_addresses:
            # Get all users with this wallet, ordered by creation date
            users = User.objects.filter(wallet_address=wallet).order_by('created_at')
            
            if users.count() > 1:
                # Keep the oldest user
                oldest_user = users.first()
                
                # Update all chat histories to point to the oldest user
                ChatHistory.objects.filter(user__in=users[1:]).update(user=oldest_user)
                
                # Delete the duplicate users
                users.exclude(id=oldest_user.id).delete()
                
                self.stdout.write(self.style.SUCCESS(
                    f'Cleaned up duplicates for wallet {wallet}. Kept user {oldest_user.id}'
                )) 