from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.views.generic import CreateView, DetailView, TemplateView

from .forms import MedicationForm, OwnerForm, PetForm, VaccineForm, VisitForm
from .models import Medication, Pet, Vaccine, Visit


class DashboardView(TemplateView):
    template_name = "dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        today = timezone.localdate()
        pets = Pet.objects.select_related("owner").prefetch_related("medications", "vaccines").all()
        upcoming_vaccines = (
            Vaccine.objects.select_related("pet")
            .exclude(next_due__isnull=True)
            .order_by("next_due")
        )
        recent_visits = Visit.objects.select_related("pet").order_by("-visited_on")[:6]
        active_medications_all = [
            medication
            for medication in Medication.objects.select_related("pet").order_by("name")
            if medication.is_current
        ]
        context.update(
            {
                "pets": pets,
                "featured_pet": pets.first(),
                "recent_visits": recent_visits,
                "upcoming_vaccines": upcoming_vaccines[:6],
                "active_medications": active_medications_all[:6],
                "total_pets": pets.count(),
                "due_soon_count": upcoming_vaccines.filter(
                    next_due__lte=today + timedelta(days=30)
                ).count(),
                "active_med_count": len(active_medications_all),
                "recent_visit_count": Visit.objects.filter(
                    visited_on__gte=today - timedelta(days=90)
                ).count(),
                "today": today,
            }
        )
        return context


class OwnerCreateView(CreateView):
    form_class = OwnerForm
    template_name = "form_page.html"
    success_url = reverse_lazy("records:dashboard")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "form_title": "Add Pet Owner",
                "form_intro": "Save owner contact details so each pet record has a reliable home base.",
                "submit_label": "Save owner",
                "cancel_url": reverse("records:dashboard"),
            }
        )
        return context


class PetCreateView(CreateView):
    form_class = PetForm
    template_name = "form_page.html"
    success_url = reverse_lazy("records:dashboard")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "form_title": "Add Pet Profile",
                "form_intro": "Create a patient card with everyday health details, alerts, and insurance info.",
                "submit_label": "Save pet",
                "cancel_url": reverse("records:dashboard"),
            }
        )
        return context


class PetDetailView(DetailView):
    model = Pet
    template_name = "pet_detail.html"
    context_object_name = "pet"

    def get_queryset(self):
        return (
            Pet.objects.select_related("owner")
            .prefetch_related("visits", "vaccines", "medications")
            .all()
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        pet = self.object
        context.update(
            {
                "visits": pet.visits.all(),
                "vaccines": pet.vaccines.all(),
                "medications": pet.medications.all(),
                "next_vaccine": pet.next_vaccine_due,
            }
        )
        return context


class PetRelatedCreateMixin(CreateView):
    pet = None
    template_name = "form_page.html"

    def dispatch(self, request, *args, **kwargs):
        self.pet = get_object_or_404(Pet.objects.select_related("owner"), pk=kwargs["pk"])
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        form.instance.pet = self.pet
        return super().form_valid(form)

    def get_success_url(self):
        return reverse("records:pet_detail", kwargs={"pk": self.pet.pk})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "pet": self.pet,
                "form_title": self.form_title,
                "form_intro": self.form_intro,
                "submit_label": self.submit_label,
                "cancel_url": reverse("records:pet_detail", kwargs={"pk": self.pet.pk}),
            }
        )
        return context


class VisitCreateView(PetRelatedCreateMixin):
    form_class = VisitForm
    form_title = "Add Vet Visit"
    form_intro = "Log a visit summary, care plan, and any follow-up date for this pet."
    submit_label = "Save visit"

    def get_initial(self):
        return {"visited_on": timezone.localdate()}


class VaccineCreateView(PetRelatedCreateMixin):
    form_class = VaccineForm
    form_title = "Add Vaccine Record"
    form_intro = "Track vaccines and due dates so reminders show up on the dashboard."
    submit_label = "Save vaccine"


class MedicationCreateView(PetRelatedCreateMixin):
    form_class = MedicationForm
    form_title = "Add Medication"
    form_intro = "Store prescriptions, dosage notes, and whether the medication is still active."
    submit_label = "Save medication"
