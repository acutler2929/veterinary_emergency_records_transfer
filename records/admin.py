from django.contrib import admin

from .models import Medication, Owner, Pet, Vaccine, Visit


@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "phone")
    search_fields = ("first_name", "last_name", "email", "phone")


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ("name", "species", "breed", "owner", "weight_lbs", "updated_at")
    list_filter = ("species", "sex", "spayed_neutered")
    search_fields = ("name", "breed", "owner__first_name", "owner__last_name", "microchip_id")


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("pet", "visited_on", "visit_type", "clinic_name", "veterinarian", "follow_up_date")
    list_filter = ("visit_type", "visited_on")
    search_fields = ("pet__name", "clinic_name", "veterinarian")


@admin.register(Vaccine)
class VaccineAdmin(admin.ModelAdmin):
    list_display = ("name", "pet", "date_administered", "next_due", "provider", "due_status")
    list_filter = ("next_due",)
    search_fields = ("name", "pet__name", "provider", "lot_number")


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ("name", "pet", "dosage", "frequency", "start_date", "end_date", "status_label")
    list_filter = ("active", "start_date", "end_date")
    search_fields = ("name", "pet__name", "prescribing_vet")
