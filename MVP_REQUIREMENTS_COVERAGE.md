# MVP requirements coverage

Based on the updated B2B SRS dated September 28, 2026 and design report dated September 25. The interface and tests exist on `frontend-jake`; most record services are pending. “Frontend completed, backend pending” includes working components, routes, input validation and explicit unavailable-save states, not working persistence.

| Requirement | Status | Implementation and remaining work |
| --- | --- | --- |
| FR 1 Provider registration | Frontend completed, backend pending | Name/email/password/confirmation/clinic form. Authorized enrollment and duplicate handling need an approved backend contract. |
| FR 2 Login and authorization | Partially implemented | React login and protected routes use Django/allauth session adapter. CSRF and logout tested. Clinical eligibility, clinic associations and every record-level permission remain backend work. |
| FR 3 Password recovery | Frontend completed, backend pending | React email and reset forms, missing/unverified token messaging, link to existing allauth HTML recovery. Email delivery, single-use expiry and React confirmation pending. |
| FR 4 Clinic information | Frontend completed, backend pending | Clinic directory/detail/edit with permission-aware save state. Active clinic identity and API absent. |
| FR 5 Pet owner profile | Frontend completed, backend pending | Searchable list, contacts, create/edit and associated pets. No owner-login portal. Provider-owned record API pending. |
| FR 6 Pet profile | Frontend completed, backend pending | Owner association, identity, DOB or age, optional weight/photo/notes, signalment/microchip/clinical findings. Pet CRUD, enums and upload pending. |
| FR 7 Pet profile maintenance | Blocked by a project decision | Edit UI complete with preserved input; persistence pending. Deletion omitted until archival/retention rules are approved. |
| FR 8 Dashboard and lookup | Frontend completed, backend pending | Patients/upcoming visits/recent records, loaded-record owner/pet search, directories and quick actions. Backend filtering/pagination and authorized data pending. No fabricated live statistics. |
| FR 9 Visit creation | Frontend completed, backend pending | Pet/clinic/clinician/time/status relationships and form validation. Status choices and saved retrievable encounters pending. |
| FR 10 Visit documentation | Frontend completed, backend pending | Concern, examination, diagnostics, diagnosis, treatment, follow-up, notes; author/time detail display. Server mutation/provenance pending. |
| FR 11 Medication entry | Frontend completed, backend pending | Create/edit/detail, required name/directions/status/pet and optional visit. Status/active classification and persistence pending. |
| FR 12 Critical information | Frontend completed, backend pending | Prominent Critical Medical Information; unknown versus confirmed absence versus recorded findings, active medication entries. Clinical data/provenance contract pending. |
| FR 13 Input integrity | Partially implemented | Frontend required/email/confirmation/weight/date/relationship/image checks; valid input preserved, errors linked to fields. Server validation/referential integrity still required. |
| FR 14 Audit trail | Frontend completed, backend pending | Read-only admin-gated review UI, no ordinary-user fetch. Server event logging and review contract absent. |
| FR 15 Backup and recovery | Backend/infrastructure responsibility | No fake UI. Team must schedule backups, document recovery and test linked-record restoration. |

## Nonfunctional verification limits

- Responsive desktop/mobile layouts, keyboard focus, skip link, form labels, semantic tables, linked validation messages and React text escaping are implemented.
- Automated Edge browser checks cover sample navigation, login validation/failure and mobile layout width. This is not full WCAG certification or the required browser-version matrix.
- Dashboard/pet response targets (3 seconds) and lookup target (5 seconds) cannot be accepted without agreed workload and real authorized record APIs.
- Availability, TLS deployment, authorization policy, database integrity and backup recovery are backend/infrastructure acceptance work.
- Optional photographs have an input/display interface; uploading and authorized media serving remain pending.
- No owner portal, sharing/export, notifications, reminders, consent, premium media, bulk import or analytics were added.
