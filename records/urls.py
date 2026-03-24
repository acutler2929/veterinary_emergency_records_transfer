from django.urls import path

from .views import (
    DashboardView,
    MedicationCreateView,
    OwnerCreateView,
    PetCreateView,
    PetDetailView,
    VaccineCreateView,
    VisitCreateView,
)


app_name = "records"

urlpatterns = [
    path("", DashboardView.as_view(), name="dashboard"),
    path("owners/add/", OwnerCreateView.as_view(), name="owner_add"),
    path("pets/add/", PetCreateView.as_view(), name="pet_add"),
    path("pets/<int:pk>/", PetDetailView.as_view(), name="pet_detail"),
    path("pets/<int:pk>/visits/add/", VisitCreateView.as_view(), name="visit_add"),
    path("pets/<int:pk>/vaccines/add/", VaccineCreateView.as_view(), name="vaccine_add"),
    path("pets/<int:pk>/medications/add/", MedicationCreateView.as_view(), name="medication_add"),
]
