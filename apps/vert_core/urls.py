from django.urls import path, include, re_path
from .views import serve_frontend_app


# from .views import (
#     # users,    # views not needed for the moment, will build these out later after the React frontend is implemented. Keeping them here for reference in case they are needed in the future.
#     # update_user,
#     # delete_user,
#     # DashboardView,
#     # MedicationCreateView,
#     # OwnerCreateView,
#     # PetCreateView,
#     # PetDetailView,
#     # VaccineCreateView,
#     # VisitCreateView,
# )


app_name = "vert_core"

urlpatterns = [
    # path('api/', include('apps.vert_core.urls')),    #               the api endpoint (ERROR: causes an infinite loop if not careful, because it will include itself)
    # path("", DashboardView.as_view(), name="dashboard"),
    # path('', users),                                              old urls used in backend placeholder
    # path('update_user/<id>', update_user, name='update_user'),    old urls used in backend placeholder
    # path('delete_user/<id>', delete_user, name='delete_user'),    old urls used in backend placeholder
    # path("owners/add/", OwnerCreateView.as_view(), name="owner_add"),
    # path("pets/add/", PetCreateView.as_view(), name="pet_add"),
    # path("pets/<int:pk>/", PetDetailView.as_view(), name="pet_detail"),
    # path("pets/<int:pk>/visits/add/", VisitCreateView.as_view(), name="visit_add"),
    # path("pets/<int:pk>/vaccines/add/", VaccineCreateView.as_view(), name="vaccine_add"),
    # path("pets/<int:pk>/medications/add/", MedicationCreateView.as_view(), name="medication_add"),
    re_path(
        r"^(?!api/|admin/|accounts/|static/).*$",
        serve_frontend_app,
        name="frontend_app",
    ),   # catch-all route for react frontend (must be last in the list!)
]
