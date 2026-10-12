# CSC Frontend - MVP

React + Vite + TypeScript + Tailwind, wired to the csc_backend API. Matches
the same MVP scope: login, cases list/create, evidence list/add, file upload.

## Setup

```bash
npm install
cp .env.example .env    # points to http://127.0.0.1:8000/api by default
npm run dev
```

Runs at `http://localhost:5173/`.

## Before you log in

Make sure the backend is running (`python manage.py runserver`) and that
`CORS_ALLOWED_ORIGINS=http://localhost:5173` is set in the backend's `.env`
(it's already the default). Log in with the superuser you created with
`python manage.py createsuperuser`, or create an officer user via
`/admin/`.

## Pages

- `/login` — sign in, stores JWT access + refresh tokens
- `/` — cases list + create case
- `/cases/:id` — case detail, evidence list, add evidence, upload files

## What's deliberately NOT here yet (phase 2)

- Offline mode / PWA (manifest, service worker, IndexedDB, sync queue)
- QR generation and printing
- Admin dashboard (search, filters, reports, charts)
- GPS map picker (lat/lng fields exist on the case model but there's no
  map UI to set them yet)

Add these once the core flow (login → create case → log evidence →
upload files) is tested and solid.
