const field = (name, label, type = 'text', required = false, extra = {}) => ({
  name,
  label,
  type,
  required,
  ...extra,
});
const relationship = (name, label, source, required = true) =>
  field(name, label, 'select', required, {
    source,
    hint: 'Choices must come from authorized backend records.',
  });
const notes = (name, label) =>
  field(name, label, 'textarea', false, { wide: true });
const findingStates = [
  { value: 'unknown', label: 'Not recorded' },
  { value: 'absent', label: 'Confirmed absence' },
  { value: 'recorded', label: 'Finding recorded' },
];
const findings = (name, label) => [
  field(`${name}_state`, `${label} recording state`, 'select', true, {
    options: findingStates,
    defaultValue: 'unknown',
  }),
  notes(name, label),
];

export const formDefinitions = {
  owner: {
    title: 'owner profile',
    capability: 'owners',
    loader: 'owner',
    saver: 'saveOwner',
    detailPath: '/owners/',
    fields: [
      field('name', 'Owner name', 'text', true),
      field('email', 'Email', 'email'),
      field('phone', 'Phone', 'tel'),
      notes('address', 'Address'),
      field('emergency_contact_name', 'Emergency contact name'),
      field('emergency_contact_phone', 'Emergency contact phone', 'tel'),
      notes('notes', 'Owner notes'),
    ],
  },
  pet: {
    title: 'pet record',
    capability: 'pets',
    loader: 'pet',
    saver: 'savePet',
    detailPath: '/pets/',
    fields: [
      relationship('owner_id', 'Owner', 'owners'),
      field('name', 'Pet name', 'text', true),
      relationship('species', 'Species', 'species'),
      field('breed', 'Breed'),
      field('date_of_birth', 'Date of birth', 'date'),
      field('age', 'Age when date of birth is unknown', 'text', false, {
        hint: 'Include the unit, such as 3 years. Exact date is preferred when known.',
      }),
      field('weight_lbs', 'Weight (lb)', 'number', false, {
        min: 0,
        step: '0.01',
      }),
      relationship('sex', 'Sex', 'sex', false),
      field('color_markings', 'Color / markings'),
      field('microchip_id', 'Microchip ID'),
      field('photo', 'Pet photograph', 'file', false, {
        hint: 'Optional JPEG, PNG, or WebP. Upload integration is pending.',
      }),
      notes('notes', 'Medical notes'),
      ...findings('allergies', 'Allergies'),
      ...findings('chronic_conditions', 'Chronic conditions'),
      ...findings('procedures', 'Recent major procedures'),
    ],
  },
  clinic: {
    title: 'clinic information',
    capability: 'clinics',
    loader: 'clinic',
    saver: 'saveClinic',
    detailPath: '/clinics/',
    fields: [
      field('name', 'Clinic name', 'text', true),
      notes('address', 'Address'),
      field('phone', 'Phone', 'tel'),
    ],
  },
  visit: {
    title: 'visit',
    capability: 'visits',
    loader: 'visit',
    saver: 'saveVisit',
    detailPath: '/visits/',
    fields: [
      relationship('pet_id', 'Pet', 'pets'),
      relationship('clinic_id', 'Clinic', 'clinics'),
      relationship('clinician_id', 'Clinician', 'clinicians'),
      field('occurred_at', 'Visit date and time', 'datetime-local', true, {
        hint: 'Enter your local time. The API receives an ISO timestamp with UTC offset.',
      }),
      relationship('status', 'Visit status', 'visit_statuses'),
      notes('presenting_concern', 'Presenting concern'),
      notes('examination_findings', 'Examination findings'),
      notes('diagnostic_results', 'Diagnostic results'),
      notes('assessment', 'Assessment / diagnosis'),
      notes('treatment', 'Treatment'),
      notes('follow_up', 'Follow-up recommendations'),
      notes('notes', 'Additional clinical notes'),
    ],
  },
  medication: {
    title: 'medication',
    capability: 'medications',
    loader: 'medication',
    saver: 'saveMedication',
    detailPath: '/medications/',
    fields: [
      relationship('pet_id', 'Pet', 'pets'),
      relationship('visit_id', 'Associated visit', 'visits', false),
      field('name', 'Medication name', 'text', true),
      field('directions', 'Dosage / directions', 'textarea', true, {
        wide: true,
      }),
      relationship('status', 'Medication status', 'medication_statuses'),
    ],
  },
  registration: {
    title: 'Provider registration',
    capability: 'registration',
    saver: 'register',
    fields: [
      field('name', 'Full name', 'text', true, { autoComplete: 'name' }),
      field('email', 'Email', 'email', true, { autoComplete: 'email' }),
      field('clinic_id', 'Clinic identifier', 'text', true, {
        hint: 'Clinic membership must be verified by the backend enrollment policy.',
      }),
      field('password', 'Password', 'password', true, {
        autoComplete: 'new-password',
        hint: 'Django will enforce the account password rules.',
      }),
      field('confirm_password', 'Confirm password', 'password', true, {
        autoComplete: 'new-password',
      }),
    ],
  },
  recovery: {
    title: 'Forgot password',
    capability: 'recovery',
    saver: 'recover',
    fields: [
      field('email', 'Account email', 'email', true, { autoComplete: 'email' }),
    ],
  },
  reset: {
    title: 'Reset password',
    capability: 'reset',
    saver: 'reset',
    fields: [
      field('password', 'New password', 'password', true, {
        autoComplete: 'new-password',
      }),
      field('confirm_password', 'Confirm new password', 'password', true, {
        autoComplete: 'new-password',
      }),
    ],
  },
};
