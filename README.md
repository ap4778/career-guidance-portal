# CareerPath

CareerPath is a career-planning and job-search web application. It brings career recommendations, job listings, application tracking, a resume builder, and learning plans together in one account.

The frontend is built with React and Vite. An Express API handles authentication and application data, with MySQL for persistence.

> **Demo data:** The seeded job listings are fictional examples for demonstration and are not live job opportunities. Career recommendations use a deterministic, rule-based assessment—not an AI model.

## Features

- Register, sign in, sign out, and change your password.
- Create and update a career profile with skills, interests, education, and experience.
- Compare career recommendations and review the skills behind each assessment.
- Search and filter job listings, save jobs, and track applications.
- Build, save, preview, and print resumes.
- Follow learning roadmaps and save progress to your account.
- Manage users, job listings, applications, and statistics with an administrator account.
- Use light or dark appearance preferences.

The interface uses a responsive layout, warm neutral surfaces, and a restrained forest-green accent. Job listings and application details adapt to smaller screens.

## Requirements

- Node.js 20 or newer and npm
- MySQL 8.0 or newer

By default, Vite runs on port `5173` and the API runs on port `4000`.

## Get started

Run commands from the project root in PowerShell.

### 1. Install dependencies

```powershell
npm install
npm --prefix backend install
```

### 2. Configure environment variables

Create local environment files from the examples:

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env` with your local MySQL connection settings. Set `DB_PASSWORD` to the password for the MySQL account you use. Set `JWT_SECRET` to a unique random value of at least 32 characters; generate one with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

The root `.env` is optional when using Vite's `/api` proxy. Keep environment files and secrets out of source control; never put server secrets in `VITE_*` variables.

### 3. Create and seed the database

The seed script reads `backend\.env`, creates the `career_guidance_db` database and schema if needed, and inserts the career, skill, roadmap, and fictional demo-job data:

```powershell
npm --prefix backend run db:seed
```

The schema and seed operations are designed to be rerun. The configured MySQL account needs permission to create the database and tables.

### 4. Start the application

Start the frontend and API together:

```powershell
npm run dev:full
```

Open the Vite URL shown in the terminal, normally [http://localhost:5173](http://localhost:5173). Check API and database readiness at [http://localhost:4000/api/health](http://localhost:4000/api/health).

You can also run each service in a separate terminal:

```powershell
npm run dev
npm --prefix backend run dev
```

The API can start while MySQL is unavailable, but database-backed features require a working MySQL connection.

## Environment reference

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port; defaults to `4000` |
| `FRONTEND_ORIGIN` | Exact frontend origin allowed by CORS |
| `JWT_SECRET` | Unique secret, at least 32 characters |
| `JWT_EXPIRES_IN` | Session token lifetime; defaults to `2h` |
| `DB_HOST`, `DB_PORT` | MySQL host and port |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Database name and credentials |
| `DB_SSL` | Enable MySQL TLS when set to `true` |
| `DB_SSL_REJECT_UNAUTHORIZED`, `DB_SSL_CA` | Optional MySQL TLS verification and CA settings |
| `COOKIE_SECURE` | Set to `true` when serving over HTTPS |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials used by the admin provisioning script |

### Frontend (`.env`)

`VITE_API_BASE_URL=/api` uses Vite's development proxy to reach the local API. To connect directly instead, set this value to `http://localhost:4000/api` and configure `FRONTEND_ORIGIN` to match the frontend origin.

## Create an administrator

Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters in `backend\.env`, then run:

```powershell
npm --prefix backend run db:create-admin
```

The script creates or promotes the configured account and stores its password as a bcrypt hash. Public registration only creates student accounts. Replace all example credentials before use.

## Routes

| Route | Description |
|---|---|
| `/` | Dashboard and account overview |
| `/guidance` | Career recommendations |
| `/jobs` | Job search, saved jobs, and application tracker |
| `/resume` | Resume editor and print preview |
| `/roadmap` | Learning plans and saved progress |
| `/account` | Profile and password settings |
| `/admin` | Administrator tools; requires an admin account |

The API uses JSON. Successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": { "code", "message", "details?" } }`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | API/database readiness |
| `POST` | `/api/auth/register` | Public | Register a student |
| `POST` | `/api/auth/login` | Public | Sign in |
| `POST` | `/api/auth/logout` | Public | Sign out |
| `GET` | `/api/auth/me` | Signed in | Read current account |
| `PATCH` | `/api/auth/password` | Signed in | Change password |
| `GET`, `PUT` | `/api/profile` | Signed in | Read or update own profile |
| `GET` | `/api/skills`, `/api/careers` | Public | Read skill and career catalogues |
| `POST` | `/api/careers/recommendations` | Signed in | Create a career assessment |
| `GET` | `/api/careers/assessments` | Signed in | Read own assessment history |
| `GET` | `/api/jobs`, `/api/jobs/:id` | Public | Search jobs or read an active listing |
| `GET`, `POST`, `DELETE` | `/api/saved-jobs` and `/api/saved-jobs/:jobId` | Signed in | List, save, or unsave jobs |
| `GET`, `POST`, `DELETE` | `/api/applications` and `/api/applications/:id` | Signed in | List, create, or remove own applications |
| `GET`, `POST` | `/api/resumes` | Signed in | List or create resumes |
| `GET`, `PUT`, `DELETE` | `/api/resumes/:id` | Signed in | Read, update, or delete an own resume |
| `GET` | `/api/roadmaps` | Signed in | Read roadmaps and own progress |
| `PATCH` | `/api/roadmaps/:id/steps/:stepId` | Signed in | Update a roadmap step |
| `GET`, `PATCH` | `/api/admin/users`, `/api/admin/users/:id` | Admin | Search users or update account access |
| `GET` | `/api/admin/jobs` | Admin | List job listings |
| `POST`, `PUT`, `DELETE` | `/api/jobs`, `/api/jobs/:id` | Admin | Create, update, or deactivate listings |
| `GET`, `PATCH` | `/api/admin/applications`, `/api/admin/applications/:id` | Admin | Review applications and update status |
| `GET` | `/api/admin/statistics` | Admin | Read aggregate statistics |

Job search supports `q`, `title`, `skill`, `location`, `category`, `jobType`, `workMode`, `page`, and `limit` query parameters. Pagination defaults to 12 items. Application statuses are `Applied`, `Under Review`, `Shortlisted`, `Rejected`, and `Selected`.

## Data and security

- Passwords are hashed with bcrypt. Authenticated sessions use an HttpOnly cookie; the JWT is not stored in browser local storage.
- The API scopes profiles, resumes, assessments, saved jobs, applications, and roadmap progress to the signed-in user.
- Administrator endpoints require the admin role. Deleting a job deactivates its listing so application history is retained.
- SQL values are parameterized. Dynamic column names in the administrator update flow use a fixed allowlist.
- The seed job listings are fictional and marked as demos. Do not present them as live vacancies.

## Tests and production build

Run the backend unit tests and build the frontend:

```powershell
npm --prefix backend test
npm run build
```

The current automated tests cover the career scoring logic and do not require database credentials. Seeding and full API workflows require a configured MySQL instance.

## Deployment notes

1. Provision MySQL 8 or newer and set the backend `DB_*` variables.
2. Set a unique production `JWT_SECRET`, `NODE_ENV=production`, `COOKIE_SECURE=true`, and the exact production `FRONTEND_ORIGIN`.
3. Run `npm --prefix backend run db:seed` against the production database and provision the administrator securely.
4. Build the frontend with `npm run build`. Configure `VITE_API_BASE_URL` for the deployed API or reverse-proxy `/api` to Express.
5. Serve the API over HTTPS, run it under a process manager, and expose `/api/health` as the health check.

Do not commit environment files, expose database ports unnecessarily, or use wildcard CORS origins with credentialed cookies.

## Project structure

```text
src/
  components/       Shared UI components
  context/          Authentication state
  data/             Frontend reference data
  pages/            Dashboard, jobs, guidance, resume, roadmap, and settings
  services/         API client
  styles/           Shared design tokens and base styles
  utils/            Matching and formatting helpers
backend/
  schema.sql        MySQL schema and demo seed data
  src/config/       Environment and database setup
  src/routes/       REST endpoints
  src/services/     Database and career logic
  src/middleware/   Authentication, authorization, and validation
  src/scripts/      Database seeding and admin provisioning
  test/             Backend unit tests
```
