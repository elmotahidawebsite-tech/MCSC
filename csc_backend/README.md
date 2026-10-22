# CSC Backend - MVP

Django + DRF backend for the Crime Scene Collector project. This is the
simplified MVP scope: **Users -> Cases -> Evidence -> Evidence Media**.
No offline sync, QR codes, roles table, or audit log yet -- those come
in phase 2 once this works end to end.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit values if needed

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Server runs at `http://127.0.0.1:8000/`. Admin at `/admin/`.

Database is SQLite by default -- zero setup needed to start. Switch to
PostgreSQL later by setting the `DB_*` variables in `.env`.

## Endpoints (MVP)

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/login/` | - |
| POST | `/api/auth/refresh/` | - |
| GET | `/api/auth/me/` | required |
| GET/POST | `/api/cases/` | required |
| GET/PUT/PATCH/DELETE | `/api/cases/{id}/` | required |
| GET/POST | `/api/cases/{case_pk}/evidence/` | required |
| GET/PUT/PATCH/DELETE | `/api/evidence/{id}/` | required |
| GET/POST | `/api/evidence/{evidence_pk}/media/` | required |
| DELETE | `/api/media/{id}/` | required |

Login request body: `{"username": "...", "password": "..."}` -> returns
`access` and `refresh` JWT tokens. Pass `Authorization: Bearer <access>`
on every other request.

## Project layout

```
config/       project settings, root urls
users/        custom User model (role field), login/me endpoints
cases/        Case model + CRUD API
evidence/     Evidence + EvidenceMedia models + CRUD/upload API
```

## What's deliberately NOT here yet (phase 2)

- Separate Roles/Permissions table (role is just a string on User for now)
- Separate CrimeScene table (location/GPS fields live on Case for now)
- QR code storage (generate from `evidence_code` on demand when needed)
- Sync Queue / offline PWA support
- Audit log

Add these once the core CRUD flow is working and tested.
