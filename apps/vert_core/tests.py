from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Medication, Owner, Pet, Vaccine, Visit


class PortalViewsTest(TestCase):
    def setUp(self):
        self.owner = Owner.objects.create(
            first_name="Jamie",
            last_name="Carter",
            email="jamie@example.com",
            phone="555-0101",
        )
        self.pet = Pet.objects.create(
            owner=self.owner,
            name="Mochi",
            species=Pet.Species.DOG,
            breed="Corgi",
            weight_lbs="24.50",
        )
        Visit.objects.create(
            pet=self.pet,
            visited_on=timezone.localdate(),
            visit_type=Visit.VisitType.WELLNESS,
            veterinarian="Dr. Singh",
        )
        Vaccine.objects.create(
            pet=self.pet,
            name="Rabies",
            next_due=timezone.localdate() + timedelta(days=21),
        )
        Medication.objects.create(
            pet=self.pet,
            name="Heartworm Prevention",
            dosage="1 chew",
            frequency="Monthly",
        )

    def test_dashboard_renders_pet_summary(self):
        response = self.client.get(reverse("records:dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Mochi")
        self.assertContains(response, "Rabies")

    def test_pet_detail_renders_related_records(self):
        response = self.client.get(reverse("records:pet_detail", args=[self.pet.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Dr. Singh")
        self.assertContains(response, "Heartworm Prevention")

    def test_pet_create_form_renders(self):
        response = self.client.get(reverse("records:pet_add"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Add Pet Profile")
        self.assertContains(response, "Save pet")

    def test_visit_create_form_renders_patient_context(self):
        response = self.client.get(reverse("records:visit_add", args=[self.pet.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Add Vet Visit")
        self.assertContains(response, "Jamie Carter")
