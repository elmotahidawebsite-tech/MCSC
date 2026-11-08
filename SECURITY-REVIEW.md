# Security review

**Scope:** Django backend and frontend authentication paths reviewed for production deployment.
**Date:** 2026-11-01

## Findings

| # | Severity | File | Lines | Finding | Confidence |
|---|---|---|---|---|---:|
| 1 | HIGH | `csc_backend/config/settings.py` | 10, 123-126 | If `DJANGO_SECRET_KEY` is not set, Django uses the fixed `dev-only-change-me` value. SimpleJWT has no separate signing key configured, so the default secret is also used to sign tokens. | 9/10 |
| 2 | MEDIUM | `csc_backend/config/settings.py`; `csc_backend/cases/views.py` | settings.py: 11-13; views.py: 157-162 | `DEBUG` defaults to `True`; `ALLOWED_HOSTS` is unconditionally overwritten with `["*"]`. The case view reads `request.user.role` before enforcing `IsAuthenticated`, which can raise an exception for anonymous requests and expose a debug error page. | 9/10 |
| 3 | MEDIUM | `csc_frontend/src/api/client.ts`; `csc_frontend/src/api/auth.ts` | client.ts: 3, 5; auth.ts: 5, 10-11 | The API origin is hard-coded to HTTP, and the login flow stores access and refresh JWTs in `localStorage`. Without HTTPS in deployment, credentials and bearer tokens can be intercepted in transit. | 9/10 |
| 4 | MEDIUM | `csc_backend/users/views.py`; `csc_backend/users/urls.py`; `csc_backend/config/settings.py` | views.py: 16-17; urls.py: 6; settings.py: 101-115 | The public login endpoint has no configured DRF throttling or application-level login attempt limit, enabling online password guessing if no upstream controls are added. | 8/10 |
| 5 | MEDIUM | `csc_backend/cases/views.py` | 504-545; 157-162 | `import_case` has no explicit upload-size, ZIP-member-count, or expanded-size limits and reads archive image members into memory. Any authenticated user allowed through the view can potentially consume excessive worker memory with a large or highly compressed archive. | 8/10 |

## Production hardening priorities

1. Require a high-entropy secret from the deployment secret manager; fail startup when it is absent in production. Consider a separate JWT signing key and a rotation/revocation plan.
2. Make production settings fail closed: `DEBUG=False`, explicit `ALLOWED_HOSTS`, HTTPS-only API/frontend origins, secure cookies where applicable, and Django's production deployment checks.
3. Configure HTTPS at the reverse proxy/load balancer and remove hard-coded HTTP API origins. Reassess browser token storage; protect against XSS and keep tokens out of logs.
4. Add login throttling/lockout and upstream request limits. Add explicit import limits for compressed bytes, uncompressed bytes, archive member count, and JSON size; record import outcomes.
5. Add security tests and run `manage.py check --deploy` against the actual production environment before release.

## Scope notes

- The `.env.example` contains placeholders, not production credentials. The review did not identify a committed real `.env` file.
- `import_case` reads archive entries but does not extract their paths to the filesystem; archive path traversal was not identified in that code path.
- JWT blacklist support and a server-side logout endpoint are not configured. The frontend logout only removes local tokens; a copied token remains usable until expiration or until the associated user is disabled.
- Case ownership checks exist in the reviewed case/resource access paths; no cross-user case access bypass was identified in those paths.
