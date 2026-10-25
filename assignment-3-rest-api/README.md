# Assignment 3: Secure REST API for Smart Campus Services

Assignment 2 turned into a **stateless REST API** with **JWT authentication**, **role-based authorization**, a **status workflow**, input validation, CORS and basic hardening. The web app, the mobile app and the admin dashboard can all use the same API.

## Run

```bash
npm install
cp .env.example .env      # PORT=4000, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN
npm run seed              # 7 categories, 2 admins, 3 students, 10 requests
npm start                 # http://localhost:4000/api
# no MongoDB installed?  npm run dev:memory
npm test                  # 49 end-to-end checks on an in-memory database
```

**Postman:** import `postman/smart-campus-api.postman_collection.json` (37 requests). Run it top to bottom on freshly seeded data; all 44 assertions pass.

**Seeded accounts**

| Role | Email | Password |
|---|---|---|
| Service administrator | admin@campus.edu | Admin@123 |
| Service administrator | it.admin@campus.edu | Admin@123 |
| Student | shahzaib@student.campus.edu | Student@123 |
| Student | ayesha@student.campus.edu | Student@123 |
| Student | omar@student.campus.edu | Student@123 |

## Endpoints (all under `/api`)

| Method | Endpoint | Who | Purpose |
|---|---|---|---|
| POST | `/auth/register` | anyone | create a **student** account → `201 { token, user }` |
| POST | `/auth/login` | anyone | `200 { token, user }`, or `401` |
| GET | `/auth/me` | logged in | current user |
| GET | `/requests` | student: own only; admin: all | filters `status`, `category`, `priority`, `q`, `assignedTo=me`; `page`, `limit` |
| GET | `/requests/:id` | owner or admin | `:id` = ObjectId or `REQ-101`; includes the status history |
| POST | `/requests` | logged in | create a request (status `Submitted`) → `201` + `Location` |
| PUT | `/requests/:id` | student owner while `Submitted`; admin | update; an admin may also send `assignedTo`, `status` and `note` |
| DELETE | `/requests/:id` | student owner while `Submitted`; admin | `204` |
| PATCH | `/requests/:id/assign` | admin | assign to an administrator (`Submitted` moves to `Assigned`) |
| PATCH | `/requests/:id/status` | admin | move to the next status |
| GET | `/stats` | admin | totals by status and by priority, plus unresolved requests per category (aggregation) |
| GET | `/categories` | anyone | categories |
| GET | `/users?role=admin` | admin | assignable administrators |

Every error comes back as `{ "error": { "status", "message", "code", "details"? } }`:
- **400:** malformed JSON or id, unknown field
- **401:** `TOKEN_MISSING`, `TOKEN_INVALID`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`
- **403:** wrong role, or not the owner
- **404:** request or route not found
- **409:** `INVALID_TRANSITION`, `ASSIGNEE_REQUIRED`, `REQUEST_LOCKED`, `STALE_STATUS`, `EMAIL_TAKEN`
- **422:** validation errors, listed in `details`
- **429:** too many login or register attempts

## Workflow

```
Submitted → Assigned → In Progress → Resolved → Closed
```

- **One step forward only:** skipping a step or going back is rejected with `409 INVALID_TRANSITION`, which names the next allowed status.
- **Assigned needs an assignee:** a request can only become `Assigned` once it has an administrator assigned to it.
- **Students' edit window:** students can edit or withdraw their request only while it is `Submitted`.
- **History:** every change is recorded in `history` (status, note, who, when).
- **No double moves:** the status update only matches the status that was checked, so two administrators clicking "Resolve" at the same moment cannot both succeed. The test shows exactly one succeeds.

## REST principles applied

| Principle | How |
|---|---|
| Resources and URIs | plural nouns: `/requests`, `/requests/REQ-101`, `/categories`; actions on a request use sub-resources (`/assign`, `/status`) |
| HTTP method selection | GET reads (safe), POST creates (201 + Location), PUT updates, PATCH makes partial workflow changes, DELETE removes (204) |
| Statelessness | the server keeps no session; every request carries a JWT that is verified on each call |
| Idempotency | GET, PUT and DELETE are idempotent: repeating them leaves the same state (a second DELETE returns 404 because the resource is already gone). POST is not idempotent, since each call creates a new request |
| Status codes | as listed above |

## Security

| Concern | Measure |
|---|---|
| Authentication | JWT (`jsonwebtoken`), sent as `Authorization: Bearer <token>`, valid for 2 h, secret kept in `.env`; passwords hashed with bcrypt and never returned |
| Authorization | `authenticate` middleware, then `authorize('admin')`; ownership checks in the service layer |
| CORS | only the origins in `CORS_ORIGIN` (the Angular app at `http://localhost:4200`) may call the API from a browser |
| Input validation | declarative `validate()` middleware (types, lengths, enums, ObjectIds, unknown fields rejected) plus Mongoose schema validation |
| XSS | the API returns only JSON with `X-Content-Type-Options: nosniff` and a strict CSP (`helmet`); the Angular client escapes all interpolated text |
| NoSQL injection | `sanitize` strips `$` and `.` keys from request bodies; query values must be plain strings |
| DoS / brute force | `express-rate-limit` on login/register (10 per minute per IP), 100 kb JSON body limit, pagination capped at 100 |
