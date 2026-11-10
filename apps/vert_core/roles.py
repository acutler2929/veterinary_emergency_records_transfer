from abc import ABC, abstractmethod
from .models import User

class Role(ABC):
    template_name = 'dashboard.html'
    can_add_records = False

    @abstractmethod
    def visible_records(self, request):
        """Return the records this role may see."""

class PetOwnerRole(Role):
    template_name = 'owner_dashboard.html'
    can_add_records = True

    def visible_records(self, request):
        return User.objects.filter(user=request.user)

class MedicalProviderRole(Role):
    template_name = 'provider_dashboard.html'
    can_add_records = True

    def visible_records(self, request):
        return User.objects.all()

class AdminRole(Role):
    can_add_records = True

    def visible_records(self, request):
        return User.objects.all()

class NoRole(Role):
    def visible_records(self, request):
        return User.objects.none()

ROLES = {
    'pet owner' : PetOwnerRole(),
    'medical provider' : MedicalProviderRole(),
    'admin' : AdminRole(),
}

def get_role(request):
    if request.user.is_superuser:
        return ROLES['admin']
    profile = getattr(request.user, 'profile', None)
    return ROLES.get(profile.role if profile else '', NoRole())