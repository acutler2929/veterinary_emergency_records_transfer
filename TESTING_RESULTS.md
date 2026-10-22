# Frontend verification results

Verified locally on October 9, 2026 (America/New_York), on `frontend-jake`. Runtime: Node 24.19.0, Python 3.12.14, Django 5.2.18, django-allauth 65.19.7, bundled Pillow 12.3.0 and Microsoft Edge 155.0.4283.45.

| Command | Result | Scope |
| --- | --- | --- |
| `pnpm test` from frontend | 45 tests passed, 4 files | Required fields, email/password confirmation, weight/date/image validation, unknown clinical findings, prominent active medications, API/CSRF/HTTP errors, pending services issuing no requests, authentication states, navigation, input retention, approved service-double save confirmation and denied writes. |
| `pnpm lint` from frontend | Passed | ESLint and React hook rules. |
| `pnpm build` from frontend | Passed | Production Vite bundle: approximately 311 kB JS / 96.5 kB gzip and 16 kB CSS / 4.1 kB gzip. Build size is not a live performance benchmark. |
| `pnpm test:e2e` from frontend | 4 tests passed | Microsoft Edge; protected-route redirect/login validation, read-only sample record navigation, visit form input retention/disabled saving, rejected login, desktop screenshots and 390px mobile layout checks/navigation. Final run exited successfully outside the sandbox. |
| `python manage.py test apps.vert_core.tests_frontend_auth --settings=vert.frontend_test_settings --noinput` | 7 tests passed | Actual Django/allauth login/session/logout on disposable in-memory SQLite; missing CSRF denied, GET logout denied, bad credentials/malformed JSON rejected, additional account flow does not claim authentication. |
| `python manage.py check` | Passed | Django system checks with installed backend dependencies. |
| `python manage.py test apps.vert_core.tests --settings=vert.frontend_test_settings --noinput` | Failed — pre-existing blocker | Old test module cannot import Medication (and other removed/commented models). It also references older URL namespaces. Existing tests were preserved for the backend team. |
| `git diff --check` | Passed | No whitespace errors in tracked changes. |

The initial component run found a duplicate text selector in one test; it was corrected to use the accessible View owner link. The initial browser run found an exact label selector including a required-field marker; it was corrected. The sandbox allowed browser assertions but hung during server cleanup; the final approved run completed with four passing tests.

## Visual review

Desktop dashboard and mobile pet-record screenshots were rendered and inspected. The medical record shows the critical section before the rest of the history, with distinct recorded, unknown and confirmed-absence examples. The focus behavior was adjusted to avoid scrolling the page when routes change. Automated mobile width checks covered login, registration, dashboard, owner list, pet detail, visit creation and medication creation at 390 × 844. Desktop record checks used 1440 × 1100. No runtime page errors were observed in the sampled record workflow.

## What remains unverified

- Real owner/pet/clinic/visit/medication/audit reads and writes, because the backend contracts do not exist. Test doubles in RecordForm tests validate confirmation behavior; they do not demonstrate a real API.
- The complete live workflow is blocked at owner lookup/create after login. Subsequent record relationships and saves cannot be accepted as integrated.
- Actual provider enrollment, clinic eligibility, clinical/staff permissions and cross-clinic authorization.
- Email delivery, reset-link expiry/single use and deployed account continuation redirects.
- Pet image upload, authorized media delivery and production static/API routing.
- The latest-two-version Chrome/Edge/Firefox/Safari matrix, complete assistive-technology review and WCAG 2.1 AA audit.
- The SRS dashboard/detail/lookup timing targets under an agreed workload, concurrent editing, TLS/availability, MySQL integration and backup restoration.
- A clean installation of the entire existing Python requirements file: adapter tests used isolated Django/allauth packages and bundled Pillow. The existing Pillow lower bound was preserved.

No real database was migrated or populated during verification. Models and migrations were left unchanged. No sensitive records or credentials were written into browser storage or test artifacts; browser fixtures are fictional.
