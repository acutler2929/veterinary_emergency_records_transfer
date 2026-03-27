from django import forms

from .models import Medication, Owner, Pet, Vaccine, Visit


INPUT_CLASS = "form-input"
TEXTAREA_CLASS = "form-input form-input--textarea"
CHECKBOX_CLASS = "form-checkbox"


class StyledModelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            widget = field.widget
            if isinstance(widget, forms.CheckboxInput):
                widget.attrs.setdefault("class", CHECKBOX_CLASS)
                continue
            css_class = TEXTAREA_CLASS if isinstance(widget, forms.Textarea) else INPUT_CLASS
            existing_class = widget.attrs.get("class", "")
            widget.attrs["class"] = f"{existing_class} {css_class}".strip()
            if isinstance(widget, (forms.DateInput, forms.DateTimeInput)):
                widget.attrs["type"] = "date"


class OwnerForm(StyledModelForm):
    class Meta:
        model = Owner
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "notes",
        ]
        widgets = {
            "address": forms.Textarea(attrs={"rows": 3}),
            "notes": forms.Textarea(attrs={"rows": 3}),
        }


class PetForm(StyledModelForm):
    class Meta:
        model = Pet
        fields = [
            "owner",
            "name",
            "species",
            "breed",
            "sex",
            "date_of_birth",
            "weight_lbs",
            "color_markings",
            "microchip_id",
            "allergies",
            "chronic_conditions",
            "diet_notes",
            "spayed_neutered",
            "insurance_provider",
            "insurance_member_id",
        ]
        widgets = {
            "date_of_birth": forms.DateInput(),
            "allergies": forms.Textarea(attrs={"rows": 3}),
            "chronic_conditions": forms.Textarea(attrs={"rows": 3}),
            "diet_notes": forms.Textarea(attrs={"rows": 3}),
        }


class VisitForm(StyledModelForm):
    class Meta:
        model = Visit
        fields = [
            "visited_on",
            "visit_type",
            "clinic_name",
            "veterinarian",
            "reason_for_visit",
            "assessment",
            "treatment_plan",
            "follow_up_date",
        ]
        widgets = {
            "visited_on": forms.DateInput(),
            "follow_up_date": forms.DateInput(),
            "reason_for_visit": forms.Textarea(attrs={"rows": 3}),
            "assessment": forms.Textarea(attrs={"rows": 4}),
            "treatment_plan": forms.Textarea(attrs={"rows": 4}),
        }


class VaccineForm(StyledModelForm):
    class Meta:
        model = Vaccine
        fields = ["name", "date_administered", "next_due", "provider", "lot_number", "notes"]
        widgets = {
            "date_administered": forms.DateInput(),
            "next_due": forms.DateInput(),
            "notes": forms.Textarea(attrs={"rows": 3}),
        }


class MedicationForm(StyledModelForm):
    class Meta:
        model = Medication
        fields = [
            "name",
            "dosage",
            "frequency",
            "start_date",
            "end_date",
            "prescribing_vet",
            "instructions",
            "active",
        ]
        widgets = {
            "start_date": forms.DateInput(),
            "end_date": forms.DateInput(),
            "instructions": forms.Textarea(attrs={"rows": 4}),
        }
