# VERT React frontend

Provider-facing React/Vite application for the B2B MVP. It includes login, registration/recovery interfaces, dashboard, clinic/owner/pet directories and details, create/edit forms, clinical visit documentation, medication entry and a read-only administrative audit interface. The white/teal medical layout supports desktop and mobile.

The backend record APIs do not exist on this branch. Save buttons remain disabled, notices identify integration gaps, and `Check form` performs validation only. See `../BACKEND_INTEGRATION_TODO.md` and `../MVP_REQUIREMENTS_COVERAGE.md` for contracts, blockers and FR 1–15 status.

## Local setup

Work only on `frontend-jake`. In the repository root:

```bash
git switch frontend-jake
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

On Windows use `python -m venv .venv` and `.venv\Scripts\Activate.ps1` instead. Use the team’s existing database/account setup when available; migrations are a local developer setup step, not something this frontend task ran against your database. No new schema migrations were added. The current project uses SQLite locally despite the planned MySQL architecture.

With a recent Node LTS (22.12+; implementation was tested using the bundled Node runtime) and pnpm 11, open a second terminal:

```bash
cd frontend
pnpm install --frozen-lockfile
# Optional: copy .env.example to .env.local to change the local Django target.
pnpm dev
```

Open `http://127.0.0.1:5173/login`. Sign in with an existing Django/allauth account. For visual review without a database, open `http://127.0.0.1:5173/preview/`; its fictional fixtures never authenticate a provider or save records. Do not use sample data for treatment.

Use the same hostname (`127.0.0.1`) consistently. Vite proxies `/api/` and `/accounts/` without changing Origin so Django’s session cookies and CSRF stay intact. Browser requests are relative, same-origin requests; `DJANGO_DEV_URL=http://127.0.0.1:8000` configures only the development proxy. No credentials belong in frontend environment variables.

Allauth login checks use the backend’s identifier label (currently username by default). Provider enrollment and clinical permissions are unfinished; creating a general account does not approve a veterinary provider. Use an existing development account or the team’s account process. The existing HTML recovery route can be opened through the React recovery page; actual email delivery needs backend configuration.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

The browser suite defaults to installed Microsoft Edge. On a host with another Playwright-supported installation, set `PLAYWRIGHT_CHANNEL=chrome` or use the team’s Playwright browser setup. The suite starts its own local Vite server and mocks only the authentication boundary. `pnpm preview` previews production assets; it does not proxy Django and is suitable for `/preview/` unless a same-origin API proxy is supplied.

From the repository root, with backend dependencies installed:

```bash
python manage.py test apps.vert_core.tests_frontend_auth --settings=vert.frontend_test_settings --noinput
```

That command uses a disposable in-memory database. `frontend_test_settings` uses fast test hashes and an in-memory email backend; never use it to run an actual server. The old backend `tests.py` imports commented-out models and requires separate backend repair; this task does not silently remove it.

## Code organization

- `src/App.jsx`: public/protected routes and the separate sample preview routes.
- `src/context/`: authenticated session and workspace service selection.
- `src/components/`: navigation, shared cards, fields and state displays.
- `src/pages/`: authentication, dashboard, directories, medical details, account and audit views.
- `src/forms/`: create/edit forms and field definitions for owners, pets, clinics, visits, medications and public enrollment/recovery.
- `src/services/api.js`: verified authentication requests, error/CSRF handling, explicit pending record functions and integration capabilities.
- `src/utils/validation.js`: required field and medical-input checks, nullable values, timestamp normalization.
- `src/preview/`: fictional read-only fixtures used only by `/preview/`.
- `src/test/` and `e2e/`: component/API/validation and browser workflow tests.
- `src/styles.css`: healthcare palette, forms, focus and responsive layouts. No external fonts or images are needed.

## Production integration

`pnpm build` emits `dist/`. Serve those assets with SPA fallback for React page routes. Route `/api/` and `/accounts/` to Django first and configure authorized media separately. Do not deploy the Vite development server. Use HTTPS, secure session cookie settings, real secrets and approved host/origin configuration from the backend deployment plan. Existing Django templates and routes remain available.

Registration/recovery contracts, record API URLs, status enums and provider permissions must be agreed and implemented before enabling their capability flags. Never enable a flag merely to remove a warning. Every save must return backend confirmation; every protected operation needs a server access check. The photo File needs a real multipart upload service before pet saving can be enabled. See the handoff for detailed data expectations and unresolved decisions.
