from datetime import date, timedelta

from django.db import models


class Owner(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self) -> str:
        return self.full_name or "Owner"


class Pet(models.Model):
    class Species(models.TextChoices):
        DOG = "dog", "Dog"
        CAT = "cat", "Cat"
        BIRD = "bird", "Bird"
        RABBIT = "rabbit", "Rabbit"
        REPTILE = "reptile", "Reptile"
        OTHER = "other", "Other"

    class Sex(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        UNKNOWN = "unknown", "Unknown"

    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name="pets")
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=20, choices=Species.choices)
    breed = models.CharField(max_length=100, blank=True)
    sex = models.CharField(max_length=20, choices=Sex.choices, default=Sex.UNKNOWN)
    date_of_birth = models.DateField(blank=True, null=True)
    weight_lbs = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    color_markings = models.CharField(max_length=150, blank=True)
    microchip_id = models.CharField(max_length=100, blank=True)
    allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)
    diet_notes = models.TextField(blank=True)
    spayed_neutered = models.BooleanField(default=False)
    insurance_provider = models.CharField(max_length=100, blank=True)
    insurance_member_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    @property
    def age_display(self) -> str:
        if not self.date_of_birth:
            return "Not recorded"
        today = date.today()
        years = today.year - self.date_of_birth.year
        if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
            years -= 1
        if years >= 2:
            return f"{years} years"
        if years == 1:
            return "1 year"
        months = (today.year - self.date_of_birth.year) * 12 + (today.month - self.date_of_birth.month)
        if today.day < self.date_of_birth.day:
            months -= 1
        if months > 1:
            return f"{months} months"
        if months == 1:
            return "1 month"
        return "Under 1 month"

    @property
    def next_vaccine_due(self):
        return self.vaccines.exclude(next_due__isnull=True).order_by("next_due").first()

    @property
    def active_medication_count(self) -> int:
        return sum(1 for medication in self.medications.all() if medication.is_current)


class Visit(models.Model):
    class VisitType(models.TextChoices):
        WELLNESS = "wellness", "Wellness"
        EMERGENCY = "emergency", "Emergency"
        SURGERY = "surgery", "Surgery"
        FOLLOW_UP = "follow_up", "Follow-up"
        DENTAL = "dental", "Dental"
        OTHER = "other", "Other"

    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="visits")
    visited_on = models.DateField()
    visit_type = models.CharField(max_length=25, choices=VisitType.choices, default=VisitType.WELLNESS)
    clinic_name = models.CharField(max_length=150, blank=True)
    veterinarian = models.CharField(max_length=100, blank=True)
    reason_for_visit = models.TextField(blank=True)
    assessment = models.TextField(blank=True)
    treatment_plan = models.TextField(blank=True)
    follow_up_date = models.DateField(blank=True, null=True)

    class Meta:
        ordering = ["-visited_on", "-id"]

    def __str__(self) -> str:
        return f"{self.pet.name} visit on {self.visited_on:%b %d, %Y}"


class Vaccine(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="vaccines")
    name = models.CharField(max_length=120)
    date_administered = models.DateField(blank=True, null=True)
    next_due = models.DateField(blank=True, null=True)
    provider = models.CharField(max_length=100, blank=True)
    lot_number = models.CharField(max_length=80, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["next_due", "name"]

    def __str__(self) -> str:
        return f"{self.name} for {self.pet.name}"

    @property
    def due_status(self) -> str:
        if not self.next_due:
            return "No due date"
        today = date.today()
        if self.next_due < today:
            return "Overdue"
        if self.next_due <= today + timedelta(days=30):
            return "Due soon"
        return "Up to date"


class Medication(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="medications")
    name = models.CharField(max_length=120)
    dosage = models.CharField(max_length=120, blank=True)
    frequency = models.CharField(max_length=120, blank=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    prescribing_vet = models.CharField(max_length=100, blank=True)
    instructions = models.TextField(blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} for {self.pet.name}"

    @property
    def is_current(self) -> bool:
        if not self.active:
            return False
        if self.end_date and self.end_date < date.today():
            return False
        return True

    @property
    def status_label(self) -> str:
        return "Active" if self.is_current else "Completed"
