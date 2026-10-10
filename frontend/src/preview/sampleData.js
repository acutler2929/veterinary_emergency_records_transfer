// Fictional read-only UI fixtures. These never authenticate a user or reach Django.
const owner = {
  id: 'sample-owner',
  name: 'Alex Morgan',
  email: 'alex@example.test',
  phone: '555-0104',
  address: 'Sample address',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  notes: '',
  permissions: {},
};
const medication = {
  id: 'sample-medication',
  pet_id: 'sample-pet',
  visit_id: 'sample-visit',
  name: 'Sample prescription',
  directions: 'Demonstration directions only',
  status: 'Sample active',
  active: true,
  permissions: {},
};
const visit = {
  id: 'sample-visit',
  pet_id: 'sample-pet',
  pet_name: 'Mochi',
  clinic_id: 'sample-clinic',
  clinician_id: 'sample-clinician',
  clinic_name: 'Sample Veterinary Clinic',
  clinician_name: 'Sample provider',
  occurred_at: '2026-10-12T09:30:00-04:00',
  status: 'Sample scheduled',
  presenting_concern: 'Demonstration encounter',
  examination_findings: '',
  diagnostic_results: '',
  assessment: '',
  treatment: '',
  follow_up: '',
  notes: '',
  author: 'Sample provider',
  updated_at: '2026-10-09T12:00:00-04:00',
  permissions: {},
};
const pet = {
  id: 'sample-pet',
  name: 'Mochi',
  species: 'Dog',
  breed: 'Corgi',
  date_of_birth: '2022-05-14',
  weight_lbs: 24.5,
  owner_id: owner.id,
  owner_name: owner.name,
  sex: 'Female',
  color_markings: 'Tan and white',
  microchip_id: null,
  notes: 'Fictional record for interface review. Do not use for treatment.',
  permissions: {},
  critical: {
    allergies: { state: 'recorded', text: 'Sample allergy entry' },
    chronic_conditions: { state: 'unknown', text: '' },
    procedures: { state: 'absent', text: '' },
    medications: { state: 'recorded', text: '' },
  },
  visits: [visit],
  medications: [medication],
};
const clinic = {
  id: 'sample-clinic',
  name: 'Sample Veterinary Clinic',
  address: '120 Example Avenue, Kalamazoo, MI',
  phone: '555-0100',
  permissions: {},
};
owner.pets = [pet];
function detail(item, id) {
  if (item.id !== id)
    return Promise.reject(new Error('This sample record was not found.'));
  return Promise.resolve(item);
}
function readOnly() {
  return Promise.reject(
    new Error('Sample preview is read-only. Nothing was saved.'),
  );
}
export const sampleApi = {
  dashboard: async () => ({
    patients: [pet],
    upcoming_visits: [visit],
    recent_records: [pet],
    owners: [owner],
  }),
  owners: async () => [owner],
  owner: (id) => detail(owner, id),
  pets: async () => [pet],
  pet: (id) => detail(pet, id),
  clinics: async () => [clinic],
  clinic: (id) => detail(clinic, id),
  visits: async () => [visit],
  visit: (id) => detail(visit, id),
  medication: (id) => detail(medication, id),
  options: async () => ({
    owners: [owner],
    pets: [pet],
    clinics: [clinic],
    visits: [{ id: visit.id, name: 'Sample encounter' }],
    clinicians: [],
    visit_statuses: [],
    medication_statuses: [],
    species: [],
    sex: [],
  }),
  saveOwner: readOnly,
  savePet: readOnly,
  saveVisit: readOnly,
  saveClinic: readOnly,
  saveMedication: readOnly,
};
