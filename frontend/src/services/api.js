export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let csrfToken = '';

// uses the Django session cookie; no credentials or records go into browser storage
export async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...options.headers };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (options.method && options.method !== 'GET')
    headers['X-CSRFToken'] = csrfToken;
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
      credentials: 'same-origin',
      redirect: 'error',
    });
  } catch {
    throw new ApiError(
      'Cannot reach Django. Check your connection and try again.',
      0,
    );
  }
  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');
  const data = isJson ? await response.json() : null;
  if (!response.ok) {
    let message = data?.message || 'The request could not be completed.';
    if (response.status === 401) {
      message = 'Your session has expired. Sign in again.';
      window.dispatchEvent(new Event('vert-session-expired'));
    }
    if (response.status === 403)
      message =
        'Access denied or security token expired. Refresh and try again.';
    if (response.status === 404)
      message = 'The requested record was not found.';
    const error = new ApiError(message, response.status, data?.errors);
    if (
      data?.continue_url?.startsWith('/accounts/') &&
      !data.continue_url.startsWith('//')
    )
      error.continueUrl = data.continue_url;
    throw error;
  }
  if (!isJson || !data)
    throw new ApiError(
      'Django returned an unexpected response. No save was confirmed.',
      502,
    );
  if (data.csrf_token) csrfToken = data.csrf_token;
  return data;
}

export const authApi = {
  session: () => request('/api/frontend/session/'),
  login: (values) =>
    request('/api/frontend/login/', {
      method: 'POST',
      body: JSON.stringify(values),
    }),
  logout: () =>
    request('/api/frontend/logout/', { method: 'POST', body: '{}' }),
};

export class IntegrationPending extends Error {
  constructor(feature) {
    super(`Backend integration pending — ${feature} is not available yet.`);
    this.pending = true;
  }
}

function pending(feature) {
  return Promise.reject(new IntegrationPending(feature));
}

// BACKEND TODO: Dashboard needs authorized patients, upcoming visits, recent records
// and owner/pet lookup results. No JSON record endpoints exist on frontend-jake.
// BACKEND TODO: PetOwners and OwnerDetail need owner CRUD, contact fields, permissions
// and associated pets by owner ID. Do not reuse the unrelated User HTML CRUD views.
// BACKEND TODO: PetDetail and PetForm need pet CRUD, owner relationship, photo upload,
// nullable clinical findings and explicit confirmed-negative states.
// BACKEND TODO: VeterinaryClinics needs authorized clinic IDs, names, addresses,
// phone numbers and edit permissions; MedicalProvider is not a clinic directory.
// BACKEND TODO: Visits and VisitCreate need pet/clinic/clinician IDs, date/time,
// approved statuses, clinical fields, author and update timestamp plus save responses.
// BACKEND TODO: MedicationCreate needs pet/optional visit IDs, name, directions,
// approved statuses and confirmed create/update responses; active model is commented out.
// BACKEND TODO: Register needs provider enrollment/clinic rules and account responses;
// Recovery pages need email-reset and single-use token contracts; allauth HTML exists.
// BACKEND TODO: AuditHistory needs an administrator-only read API with actor,
// timestamp, action and target. Backend must log every protected read and write.
// Replace these explicit pending functions only after agreeing and implementing contracts.
export const recordsApi = {
  dashboard: () => pending('loading the dashboard'),
  owners: () => pending('loading owner profiles'),
  owner: (_id) => pending('loading this owner'),
  saveOwner: (_values, _id) => pending('saving owner profiles'),
  pets: () => pending('loading pet records'),
  pet: (_id) => pending('loading this pet record'),
  savePet: (_values, _id) => pending('saving pet information'),
  clinics: () => pending('loading clinics'),
  clinic: (_id) => pending('loading this clinic'),
  saveClinic: (_values, _id) => pending('saving clinic information'),
  visits: () => pending('loading visits'),
  visit: (_id) => pending('loading this visit'),
  saveVisit: (_values, _id) => pending('saving visits'),
  medication: (_id) => pending('loading this medication'),
  saveMedication: (_values, _id) => pending('saving medications'),
  options: () => pending('loading authorized relationships and status choices'),
  register: (_values) => pending('provider enrollment'),
  recover: (_values) => pending('requesting a password reset from this form'),
  reset: (_values) => pending('validating and using this reset link'),
  audit: () => pending('reviewing audit history'),
};

// Every record operation starts unavailable. Backend teammates enable a capability
// only alongside a real service implementation and server-enforced permission.
export const integrated = {
  owners: false,
  pets: false,
  clinics: false,
  visits: false,
  medications: false,
  registration: false,
  recovery: false,
  reset: false,
  audit: false,
};
