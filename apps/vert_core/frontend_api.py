from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET

from .roles import get_role

RECENT_RECORD_LIMIT = 5


def patient_data(record):
    owner = record.user
    # Record model has no species, breed, microchip. Pet model is commented out
    return {
        "id": record.id,
        "name": record.user_name,
        "species": "Not recorded",
        "breed": "",
        "owner_name": (owner.get_full_name() or owner.get_username()) if owner else "No owner",
        "microchip_id": "",
    }


@never_cache
@require_GET
def dashboard(request):
    if not request.user.is_authenticated:
        return JsonResponse({"message": "Sign in to see records."}, status=401)
    records = get_role(request).visible_records(request).select_related("user")
    return JsonResponse({"patients": [patient_data(record) for record in records.order_by("user_name", "id")],
                         "recent_records": [{"id": record.id, "name": record.user_name} for record in records.order_by("-id")[:RECENT_RECORD_LIMIT]],
                         "upcoming_visits": [],
                         "owners": [],
    })