from abc import ABC, abstractmethod
from .models import User

class Role(ABC):
    template_name = 'dashbaord.html'

    @abstractmethod
    def visible_records(self, request):
        """Return the records this role may see."""

class PetOwnerRole(Role):
    template_name = 'owner_dashboard.html'

    def visible_records(self, request):
        return User.objects.filter(user=request.user)

class MedicalProviderRole(Role):
    template_name = 'provider_dashboard.html'

    def visible_records(self, request):
        return User.objects.all()

class AdminRole(Role):
    def visible_records(self, request):
        return User.objects.all()

class NoRole(Role):
    def visible_records(self, request):
        return User.objects.none()

ROLES = {
    'pet owner' : PetOwnerRole,
    'medical provider' : MedicalProviderRole,
    'admin' : AdminRole,
}

def get_role(request):
    if request.user.is_superuser:
        return ROLES['admin']
    role_name = (
        User.objects.filter(user=request.user).exclude(user_permissions='').values_list('user_permissions', flat=True).first()
    )
    return ROLES.get((role_name or '').strip().lower(), NoRole())