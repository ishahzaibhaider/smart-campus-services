# Assignment 4 — Dynamic Smart Campus Client (Angular)

**Course:** CSC337 Advanced Web Technologies (COMSATS)
**Author:** Syed Shahzaib Haider Rizvi (FA23-BAI-050)
**Case study:** Smart Campus Service Management System

A single-page Angular client for the Smart Campus REST API built in Assignment 3. Students submit and
track service requests (IT Support, Maintenance, Transport, Library, Lost & Found, Classroom &
Equipment, Facility Services); service administrators assign them and move them through the workflow
**Submitted → Assigned → In Progress → Resolved → Closed**.

Built with Angular 22 (standalone components, signals, zoneless change detection), TypeScript,
RxJS and plain CSS. No UI library is used.

---

## How to run

### 1. Start the API (Assignment 3)

The client expects the API at **`http://localhost:4000/api`** (configured in
`src/environments/environment.ts`). The API allows CORS from `http://localhost:4200`.

```bash
cd ../assignment-3-rest-api
npm install
PORT=4000 npm run dev:memory     # in-memory MongoDB + seed data
```

### 2. Start the Angular client

```bash
cd assignment-4-angular-client
npm install
npx ng serve                     # http://localhost:4200
```

Other commands:

| Command | Purpose |
| --- | --- |
| `npx ng build` | Production build into `dist/` |
| `npx ng test --watch=false` | Unit tests (Vitest): workflow rules, `timeAgo` pipe, API error mapping |

### Seeded accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | `ayesha@student.campus.edu` | `Student@123` |
| Student | `shahzaib@student.campus.edu` | `Student@123` |
| Admin | `admin@campus.edu` | `Admin@123` |
| Admin | `it.admin@campus.edu` | `Admin@123` |

The login page has one-click buttons that fill in these accounts.

---

## Features

**Common**
- Login (reactive form with validation messages) and student registration (with a password-match validator).
- Sticky header with the logged-in user's name, initials avatar, role and **Log out**; collapses to a menu on phones.
- API errors from the `{ "error": { status, message, code } }` envelope are shown to the user, inline or as toasts.
- Expired or invalid JWT (HTTP 401) logs the user out and sends them to `/login?reason=expired`.
- Responsive layout down to 360 px wide.

**Student**
- **My Requests** dashboard: table of the student's requests (REQ-xxx, title, category, priority, status badge, dates) with status tabs, search and pagination, plus a **+ New Request** button.
- **New Request** form: title, category (loaded from `GET /api/categories`), priority, description, with character counters and validation messages.
- **Request details**: status tracker (stepper highlighting the current step), history timeline, details panel. A student can withdraw (delete) their own request only while it is **Submitted**.

**Administrator**
- **Dashboard** (`GET /api/stats`): total and per-status cards, unresolved requests per category, priority breakdown, latest requests, and how many are assigned to you. The cards link to filtered lists.
- **All Requests**: filters for search, category, status, priority and "assigned to me", page size and pagination. Filters are kept in the URL, so `?status=Assigned` can be bookmarked.
- **Request details with admin actions**: assign or reassign to an administrator (`GET /api/users?role=admin`), advance to **only the next valid status** with an optional note, change priority, delete.

---

## Angular concepts checklist

| Required concept | Where it is used |
| --- | --- |
| **Components** (standalone) | `src/app/app.ts` (shell), `layout/header/`, `features/**` pages (`LoginPage`, `RegisterPage`, `StudentDashboard`, `NewRequestPage`, `RequestDetailsPage`, `AdminDashboard`, `AllRequestsPage`, `NotFoundPage`), reusable `shared/components/` (`RequestTable`, `StatusTracker`, `HistoryTimeline`, `Pagination`, `Toasts`) |
| **Component communication** | `input()` / `input.required()` in `RequestTable`, `StatusTracker`, `HistoryTimeline`, `Pagination`, `AdminActions`; `output()` events in `Pagination` (`pageChange`) and `features/requests/admin-actions/admin-actions.ts` (`assign`, `advance`, `priorityChange`, `remove`) handled by `RequestDetailsPage` |
| **TypeScript models / interfaces** | `src/app/core/models/` — `user.model.ts`, `category.model.ts`, `request.model.ts` (union types `RequestStatus`, `RequestPriority`), `stats.model.ts`, `api.model.ts` (`DataResponse<T>`, `PaginatedResponse<T>`, `ApiErrorBody`); typed `ApiError` class in `core/utils/api-error.ts` |
| **Services and DI with `inject()`** | `core/services/auth.service.ts`, `request.service.ts`, `category.service.ts`, `user.service.ts`, `stats.service.ts`, `toast.service.ts` (all `providedIn: 'root'`, injected with `inject()`) |
| **Routing** | `src/app/app.routes.ts`, `features/admin/admin.routes.ts`; route params (`requests/:id`), query params (`returnUrl`, filters), `routerLink`, `routerLinkActive`, wildcard 404, functional `redirectTo`, page titles, `withComponentInputBinding()` in `app.config.ts` |
| **Route guards** | `core/guards/auth.guard.ts` (`authGuard`, `studentGuard`, `guestGuard`), `core/guards/admin.guard.ts` (`adminGuard`, used as `canMatch` + `canActivate`) |
| **Lazy loading** | Every page uses `loadComponent`; the admin area uses `loadChildren` (`ADMIN_ROUTES`), so students never download it |
| **Data binding** | Interpolation `{{ }}` everywhere; property binding (`[disabled]`, `[routerLink]`, `[style.width.%]`, `[class.active]`, `[attr.aria-current]`); event binding (`(click)`, `(ngSubmit)`, `(pageChange)`); **two-way** `[(ngModel)]` bound to signals in `admin/all-requests/all-requests.html` and `requests/admin-actions/admin-actions.html` |
| **Reactive Forms** | `features/auth/login/` (login), `features/auth/register/` (cross-field `passwordsMatch` validator), `features/student/new-request/` (new request) — `NonNullableFormBuilder`, `Validators`, per-field error messages |
| **Template-driven forms** | Admin filters (`#filterForm="ngForm"`, `ngModel`) in `admin/all-requests/`, admin action fields in `requests/admin-actions/`, search in the student dashboard |
| **HttpClient and Observables** | All services return `Observable<T>`. RxJS operators: `map`, `catchError`, `tap`, `shareReplay` (services); `switchMap`, `debounceTime`, `distinctUntilChanged`, `startWith` (dashboards and `RequestDetailsPage` route params); `forkJoin` (admin dashboard); `finalize`; `toObservable` / `toSignal` / `takeUntilDestroyed` interop |
| **HTTP interceptor** | `core/interceptors/auth.interceptor.ts`: attaches `Authorization: Bearer <jwt>`; on 401 calls `AuthService.logout()` and redirects to `/login`. Registered with `provideHttpClient(withInterceptors([...]))` in `app.config.ts` |
| **Pipes (built-in)** | `date`, `titlecase`, `number`, `percent`, `async` (header, request table, details, admin dashboard, new-request category list) |
| **Custom pipes** | `shared/pipes/time-ago.pipe.ts` (`timeAgo`: "3 hours ago"), `shared/pipes/initials.pipe.ts` (`initials`: avatar letters) |
| **Directives** | Built-in control flow `@if` / `@else if` / `@for` / `@empty` / `@let` in every template; custom attribute directive `shared/directives/status-color.directive.ts` (`[appStatusColor]`) colours status and priority badges via host bindings |
| **Signals (state)** | `AuthService` (`currentUser`, `isAdmin` computed), page state (`signal`, `computed`, `linkedSignal` in `AdminActions`, `effect` to sync filters to the URL) |
| **App initialisation** | `provideAppInitializer` in `app.config.ts` re-validates a stored token with `GET /api/auth/me` |

---

## Project structure

```
src/
├── environments/environment.ts      API base URL and storage keys
├── styles.css                       Design tokens, buttons, forms, tables, badges
└── app/
    ├── app.ts / app.html / app.css  Shell: header + router-outlet + toasts
    ├── app.config.ts                Router, HttpClient + interceptor, app initializer
    ├── app.routes.ts                Top-level routes with guards and lazy loading
    ├── core/
    │   ├── models/                  TypeScript interfaces for API types
    │   ├── services/                AuthService, RequestService, CategoryService, UserService, StatsService, ToastService
    │   ├── guards/                  authGuard, studentGuard, guestGuard, adminGuard
    │   ├── interceptors/            authInterceptor (JWT + 401 handling)
    │   └── utils/                   ApiError mapping, workflow rules (next status)
    ├── layout/header/               Navigation bar
    ├── shared/
    │   ├── components/              RequestTable, StatusTracker, HistoryTimeline, Pagination, Toasts
    │   ├── directives/              appStatusColor
    │   └── pipes/                   timeAgo, initials
    └── features/
        ├── auth/                    login, register
        ├── student/                 student-dashboard, new-request
        ├── requests/                request-details, admin-actions
        ├── admin/                   admin.routes.ts, admin-dashboard, all-requests
        └── not-found/
```

## API endpoints used

| Method | Endpoint | Used by |
| --- | --- | --- |
| POST | `/api/auth/login`, `/api/auth/register` | Login, Register |
| GET | `/api/auth/me` | App initializer (session restore) |
| GET | `/api/categories` | New Request form, admin filters |
| GET | `/api/users?role=admin` | Admin assign dropdown |
| GET | `/api/requests?status=&category=&priority=&q=&assignedTo=&page=&limit=` | Student dashboard, All Requests, admin dashboard |
| GET | `/api/requests/:id` (Mongo id or `REQ-101`) | Request details |
| POST | `/api/requests` | New Request |
| PUT | `/api/requests/:id` | Admin priority change |
| PATCH | `/api/requests/:id/status` | Admin "Move to …" |
| PATCH | `/api/requests/:id/assign` | Admin assign or reassign |
| DELETE | `/api/requests/:id` | Student withdraw (Submitted only), admin delete |
| GET | `/api/stats` | Admin dashboard |
