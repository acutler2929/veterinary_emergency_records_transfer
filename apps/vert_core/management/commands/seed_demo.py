import getpass

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.vert_core.models import Profile, User

DEMO_ACCOUNTS = [
    ('demo_owner', Profile.Role.PET_OWNER),
    ('demo_owner2', Profile.Role.PET_OWNER),
    ('demo_provider', Profile.Role.MEDICAL_PROVIDER),
    ('demo_admin', Profile.Role.ADMIN),
]

DEMO_RECORDS = [
    ('demo_owner', 'Biscuit', 'Fictional demo pet. Not a real patient.'),
    ('demo_owner', 'Pepper', 'Fictional demo pet. Not a real patient.'),
    ('demo_owner2', 'Mango', 'Fictional demo pet. Not a real patient.'),
    (None, 'Unclaimed stray', 'Fictional record with no owner.'),
]


class Command(BaseCommand):
    help = 'Create demo accounts (one per role) and fictional pet records for local development.'

    def add_arguments(self, parser):
        parser.add_argument('--password', help='Password for new demo accounts. Asked for when left out.')

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('seed_demo is for local development and only runs with DEBUG on.')
        Account = get_user_model()
        usernames = [username for username, _ in DEMO_ACCOUNTS]
        password = None
        if Account.objects.filter(username__in=usernames).count() < len(usernames):
            password = options['password'] or self.ask_password()
            try:
                validate_password(password)
            except ValidationError as error:
                raise CommandError(' '.join(error.messages))

        accounts = {}
        for username, role in DEMO_ACCOUNTS:
            account = Account.objects.filter(username=username).first()
            created = account is None
            if created:
                account = Account.objects.create_user(username, password=password)
            Profile.objects.update_or_create(user=account, defaults={'role': role})
            accounts[username] = account
            self.stdout.write(f"{'Created' if created else 'Kept'} {username} ({role})")

        for owner, name, notes in DEMO_RECORDS:
            if not User.objects.filter(user=accounts.get(owner), user_name=name).exists():
                User.objects.create(user=accounts.get(owner), user_name=name, additional_notes=notes)
        self.stdout.write(self.style.SUCCESS('Demo data is ready.'))

    def ask_password(self):
        password = getpass.getpass('Password for the demo accounts: ')
        if password != getpass.getpass('Password again: '):
            raise CommandError('The passwords did not match.')
        return password
