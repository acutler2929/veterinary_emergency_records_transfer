# VERT backend integration handoff

The React MVP interface is implemented on `frontend-jake`. The record services are **not operational**: this branch has no JSON record APIs and its Pet, Visit, and Medication models are commented out. All record saves are disabled. `Check form` validates browser inputs and never saves. `/preview/` uses separate fictional, read-only fixtures, never a real record service.

The updated SRS dated September 28, 2026 takes precedence over the September 25 design report. Both documents were read, including the design diagram. The owner-login and deletion methods pictured in that diagram do not establish MVP scope or retention policy.

## Existing backend inspected

| Existing code / endpoint | Finding |
| --- | --- |
| `/accounts/login/`, `/accounts/logout/` | Existing allauth HTML/session authentication. React login now delegates to allauth LoginForm through the small adapter below. |
| `/accounts/signup/` | General allauth signup exists; clinic association and provider enrollment rules are absent. React enrollment stays pending and does not send users to unrestricted signup. |
| `/accounts/password/reset/` and allauth reset links | Existing HTML recovery route. React offers a link to it; React email submission and token validation are pending. Email delivery was not verified. |
| `/`, `/update_user/<id>`, `/delete_user/<id>` | HTML CRUD for the custom `User` record. These are not owner/pet APIs and React does not call them. |
| `apps/vert_core/models.py` | Custom User, PetOwner and MedicalProvider exist. PetOwner.full_name refers to first_name/last_name that are not its own fields. Pet, Visit, Vaccine and Medication definitions are commented out. |
| `forms.py`, `tests.py` | Reference missing Owner/Pet/Visit/Medication/Vaccine classes and old `records:` URL names. Existing backend tests require backend-team repair. |
| `vert/settings.py` | Django sessions, CSRF middleware, allauth, SQLite development database. MySQL is an intended architecture, not the active configuration. Production configuration and email delivery remain team responsibilities. |

## Implemented authentication adapter

| Endpoint | Request | Response / behavior |
| --- | --- | --- |
| `GET /api/frontend/session/` | Same-origin session cookie | `{user: null or {id, username, name, email}, permissions: {}, csrf_token, login_label}`. No-store response. Initializes CSRF cookie. |
| `POST /api/frontend/login/` | JSON `{login, password}` and `X-CSRFToken` | Uses existing/custom allauth login form, validation, rate limiting and login flow. Returns the session response with rotated CSRF token after authentication; 400 for invalid credentials/input, 403 for CSRF rejection, 409 with a safe `/accounts/…` continuation if another allauth step is needed. |
| `POST /api/frontend/logout/` | JSON `{}`, cookie and CSRF header | Uses allauth adapter logout; returns anonymous session. GET cannot log out. |

Account authentication **does not establish provider approval**. `permissions` is deliberately empty. Backend teammates must implement eligibility and clinic membership before releasing clinical access. The frontend must consume permission responses, and every protected backend read/write must independently enforce them.

## Missing dependencies

Every contract below is a **frontend expectation for team review**, not an existing or approved API. No record endpoint URL has been invented. Implement and agree the server contracts before replacing the matching pending functions in `frontend/src/services/api.js` and enabling a capability in `integrated`.

| Page / component and service seam | Required request and response data | Existing endpoint | Status and backend work |
| --- | --- | --- | --- |
| Register / `register(values)` | Name, email, password, confirmation, approved clinic ID; duplicate and field errors; account/approval result | `/accounts/signup/` is HTML only and lacks provider/clinic policy | Frontend completed, backend pending. Define enrollment and clinic membership verification; map actual required account identifier fields; use allauth validation and secure hashes. Public request confirmation requires `{confirmed: true}`. |
| Login, AppLayout, account and all record forms | Session must include clinic membership, provider eligibility and operation permissions such as `owners_create`, `pets_create`, `visits_create`, `medications_create`, `audit_read` | New session adapter above, authentication tested | Partially implemented. Return authorized capabilities; do not infer clinical permissions from a username or is_staff alone. Review who may enter clinical notes. |
| ForgotPassword / `recover(values)` | Email; a non-enumerating confirmed response; email delivery and single-use expiring link | Existing allauth HTML recovery linked from UI | Frontend completed, backend pending. Connect React to allauth recovery without exposing account existence. Test real email delivery. |
| ResetPassword / `reset(values)` | Token/link identity, password, confirmation; valid/expired/used token errors; server confirmation | Existing allauth HTML reset-link flow | Frontend completed, backend pending. Agree how uid/token in the existing URL map to React; currently `?token=` is only a pending interface. Do not enable until validation and expiration are enforced by Django. |
| Dashboard / `dashboard()` | `{patients: [...], upcoming_visits: [...], recent_records: [...], owners: [...]}` with authorized IDs, names and relationships | None | Frontend completed, backend pending. Define “current,” “upcoming” and “recent.” Return no fabricated counts. Add workload-defined lookup and pagination. |
| PetOwners, OwnerDetail, owner create/edit / `owners()`, `owner(id)`, `saveOwner(values,id)` | Owner ID, name, optional email/phone/address/emergency contact/notes; detail includes `pets`; detail `permissions.update`; mutations return saved `{id,…}` | None. HTML User CRUD is unrelated | Frontend completed, backend pending. Implement provider-maintained owner profiles independent of login accounts. Enforce one owner to many pets. Map PetOwner/User fields safely. |
| Pet list, PetDetail, pet create/edit / `pets()`, `pet(id)`, `savePet(values,id)` | Pet ID, owner_id, name, species, breed, date_of_birth or age, nullable weight_lbs, sex, markings, microchip_id, notes, optional photograph; owner name, visits, medication history, detail permissions | None. Pet model commented out | Frontend completed, backend pending. Implement authorized profile CRUD and relationship constraints. Empty optional values normalize to null; weight becomes numeric. Status/species/sex choices must come from options contract. No deletion is exposed. |
| Pet image input / `savePet` upload handling | Optional JPEG/PNG/WebP File; server-approved size/type policy; authorized same-origin photo_url | No active pet-photo upload service | Frontend completed, backend pending. Implement multipart/FormData in service alongside authorized upload/storage; do not JSON-serialize File. Current UI allows choosing a file but cannot upload/save it. Agree server limits before enabling. |
| Critical Medical Information / `pet(id).critical` | For allergies, chronic_conditions, procedures, medications: `{state: 'unknown'|'absent'|'recorded', text: string or null}`. Medication entries include backend-computed `active` | None | Frontend completed, backend pending. Preserve unknown versus confirmed negative. These three UI recording states are a proposed clinical-data contract, not medication/visit status enums. Return provenance of negative findings; do not infer absence from empty arrays. Positive active entries must remain prominent. |
| VeterinaryClinics, clinic detail/edit / `clinics()`, `clinic(id)`, `saveClinic(values,id)` | Clinic ID, name, address, phone, detail `permissions.update`; saved record on update | None. MedicalProvider has clinic text, not a directory | Frontend completed, backend pending. Establish clinic identity and provider associations without treating free-text clinic_name as an identifier. Enforce update permissions. |
| All relationship/status selects / `options()` | Arrays `owners`, `pets`, `clinics`, `clinicians`, `visits`, `species`, `sex`, `visit_statuses`, `medication_statuses`; relationships `{id,name}`, enumerations `{value,label}` | None | Frontend completed, backend pending. Filter choices by authorization; approve visit and medication statuses. Validate selected visit belongs to pet, clinician belongs to an authorized clinic, and owner exists. No status enum was invented from commented visit-type values. |
| Visits, VisitCreate, documentation/edit / `visits()`, `visit(id)`, `saveVisit(values,id)` | Pet/clinic/clinician IDs, `occurred_at` ISO UTC timestamp, backend-approved status, presenting_concern, examination_findings, diagnostic_results, assessment, treatment, follow_up, notes; author, updated_at, permissions; saved record ID | None. Visit model/views/routes commented out | Frontend completed, backend pending. Persist encounter plus authorship/version time; enforce clinician and clinic relationships; return saved visit through pet detail. UI accepts local time and sends an ISO UTC timestamp. |
| MedicationCreate, medication detail/edit / `medication(id)`, `saveMedication(values,id)` | Name, dosage/directions, backend-approved status, pet_id, optional visit_id; saved ID, detail permissions, active classification for pet view | None. Medication model/views/routes commented out | Frontend completed, backend pending. Persist and retrieve medication changes; verify optional visit belongs to pet. Define active versus historical without adopting a speculative enum. |
| AuditHistory / `audit()` | Read-only events with ID, actor, action, target, timestamp; `audit_read` permission | None | Frontend completed, backend pending. Implement immutable server logging for protected access/create/update/archive, plus authorized admin review. Normal users cannot edit or fetch history through this interface. |
| FR 15 backups | Scheduled consistent backups and tested restoration of all linked records | None | Backend/infrastructure responsibility. Define schedule/RPO/RTO, retention and restoration runbook; test a restore. There is no frontend backup button. |

## Contract details and connection steps

1. Agree resource fields, IDs, status enums, permission names and clinical recording states. Adapt at the service boundary if database names differ from frontend names.
2. Implement real server routes with authenticated, record-level access checks and server validation. A list seam currently expects an array; adapt paginated server responses in the service before enabling. Never fetch records across clinic boundaries by default.
3. Return 401 for unauthenticated reads, 403 for unauthorized requests, 404 for inaccessible/missing records as approved by policy, and structured field errors for invalid input. The request layer rejects HTML/redirect responses as save confirmation. Agree optimistic concurrency (version or updated_at) to prevent lost clinical edits.
4. Use `request()` with same-origin Django cookies and CSRF. Add only verified routes. Do not put records, passwords or session tokens in localStorage. Write operations must resolve to the saved record including ID; public enrollment/recovery operations require explicit confirmed response. Refresh record detail after mutation.
5. Add positive, negative and permission tests; enable a capability only after read, write, choices, error handling and relevant permissions work together. Keep sampleApi separate and read-only.
6. Configure production same-origin routing for React, `/api/`, `/accounts/` and authorized media. Vite is a development proxy, not a production server. Test allauth-generated email/continuation redirects in deployment.

## Team decisions required

- Provider enrollment and approved clinic membership; identifier choice and staff clinical permissions.
- Cross-clinic search/read/edit policy for normal and emergency providers.
- Approved visit and medication statuses; definition of current patients and upcoming visits.
- Explicit negative clinical findings, source/time of observations and medication active classification.
- Clinic identity and how current User/PetOwner/MedicalProvider fields map to the revised SRS.
- Record archival/retention, deletion requests and concurrent edit handling.
- MySQL migration/deployment plan, HTTPS, production settings, email delivery and media authorization.
- Offline/PWA scope, supported workload, performance tests, availability and recovery objectives.

## Backend files changed by this frontend effort

- `apps/vert_core/frontend_auth.py`: small session/login/logout JSON adapter delegating to allauth. No record business logic.
- `vert/urls.py`: three adapter routes added ahead of existing routes.
- `requirements.txt`: missing django-allauth dependency declared, compatible 65.x range.
- `apps/vert_core/tests_frontend_auth.py`: session, CSRF, error and continuation tests.
- `vert/frontend_test_settings.py`: isolated in-memory test DB and test-only password/email settings; never use for deployment.

No models, migrations, existing views/forms/templates, database schema or authentication backend were replaced.

## Workflow blockers

Login → Dashboard works against the tested session adapter. Find/create owner is the first live record blocker: there is no authorized owner API. Pet saves, encounter saves, documentation and medication entry are blocked downstream. The sample preview demonstrates record navigation and validates forms; it does not complete database operations or prove end-to-end clinical integration.
