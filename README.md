# 10_health_33724876 – Health Tracker

A small health-tracking web application built with Node.js, Express, EJS, and MySQL.

Users can:

- Register and log in
- Record workouts
- Record health metrics
- Search their own data
- View a personal dashboard
- (Admins) View an admin dashboard
- View current weather via OpenWeatherMap

## Features

### Authentication and accounts

- Registration and login with server-side validation
- Passwords hashed with bcrypt
- Session-based auth with `express-session` and MySQL session store
- Roles: `user` and `admin`
- Middleware:
  - `requireLogin` – blocks guests
  - `requireAdmin` – blocks non-admins

### Dashboard

- Route: `/dashboard`
- Shows:
  - Recent workouts
  - Recent metrics
  - Basic stats (workouts and minutes in last 7 / 30 days, metric count)

### Workouts

- Routes under `/workouts`
- Per-user CRUD:
  - List with filters (type, date range)
  - Add / edit / delete
- Fields:
  - Date
  - Type (from `workout_types`)
  - Duration (minutes)
  - Intensity: `low` / `medium` / `high`
  - Notes (optional)

### Metrics

- Routes under `/metrics`
- Per-user CRUD:
  - List with filters (type, date range)
  - Add / edit / delete
- Fields:
  - Date
  - Metric type (from `metric_types`)
  - Value
  - Unit (optional, default from type)
  - Notes (optional)

### Search

- Routes: `/search`, `/search/results`
- Search scope: `all`, `workouts`, `metrics`
- Filters:
  - Keyword (type name and notes)
  - Date range
- Results separated into workouts and metrics lists

### Weather

- Route: `/weather`
- Uses OpenWeatherMap current weather API
- Input: city name (query param `city`)
- Shows:
  - City and country
  - Temperature, feels like
  - Humidity
  - Wind speed
  - Description
- Handles:
  - Missing or invalid city
  - Network / API errors
  - Missing `OPENWEATHER_API_KEY` (shows clear message)

### Admin dashboard

- Route: `/admin` (admin only)
- Shows:
  - Site stats (users, admins, active users, workouts, metrics)
  - Per-user counts of workouts and metrics
  - Created date and last login
- Actions:
  - Change user role (user/admin)
  - Toggle account active/inactive
  - Protects against removing your own admin role or deactivating yourself
- Recent login attempts from `login_audit` (username, success, IP, UA, timestamp)

## Tech stack

- Node.js, Express
- EJS templates
- MySQL 8, `mysql2`
- `express-session`, `express-mysql-session`
- `bcrypt`
- `express-validator`
- `connect-flash`
- `dotenv`
- OpenWeatherMap API (via `fetch`)
- Tests: `mocha`, `supertest`, `chai`

## Project structure (simplified)

```text
index.js           # Express app setup (middleware + routes)
db.js              # MySQL pool and session store

routes/
  home.js          # /, /about
  auth.js          # register, login, logout, delete account
  dashboard.js     # /dashboard
  workouts.js      # /workouts...
  metrics.js       # /metrics...
  search.js        # /search...
  admin.js         # /admin...
  weather.js       # /weather

views/
  partials/        # header, footer, flash messages
  auth/            # login, register, delete account
  workouts/        # list, form
  metrics/         # list, form
  search/          # search, results
  home.ejs
  about.ejs
  dashboard.ejs
  weather.ejs
  admin.ejs
  error_403.ejs
  error_404.ejs
  error_500.ejs

public/
  main.css

_middleware.js     # requireLogin, requireAdmin, attachUserToLocals
create_db.sql      # schema + basic user privileges
insert_test_data.sql
app.test.js        # router / integration tests
.env.example
README.md
```

## Database (overview)

Database name (example): `health_app`

Tables:

- `users`

  - username, email (unique)
  - password_hash
  - role (`user` / `admin`)
  - is_active (1/0)
  - created_at, last_login

- `workout_types`
- `workouts`

  - user_id, workout_type_id
  - workout_date
  - duration_minutes
  - intensity
  - notes

- `metric_types`

  - default_unit

- `metrics`

  - user_id, metric_type_id
  - metric_date
  - value, unit
  - notes

- `login_audit`

  - user_id (nullable), username_attempt
  - success (1/0)
  - ip_address, user_agent
  - attempted_at

Weather data is not stored.

## Environment variables

Copy `.env.example` to `.env` and edit:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=health_app
DB_PASSWORD=qwertyuiop
DB_NAME=health_app

SESSION_SECRET=change_this

OPENWEATHER_API_KEY=your_openweathermap_api_key
```

`.env` is not committed to the repo.

## Setup and running

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create database and seed data in MySQL:

   ```sql
   SOURCE create_db.sql;
   SOURCE insert_test_data.sql;
   ```

   In the VM

   ```
   sudo apt-get update
   sudo apt-get install mysql-server
   sudo mysql
   source create_db.sql;
   source insert_test_data.sql;
   ```

3. Create `.env`:

```bash
cp .env.example .env
# then edit values
````

4. Start the app:

   ```bash
   npm start
   # or
   node index.js
   ```

5. Open in browser (default):

   - Home: `http://localhost:3000/`
   - Register / login: `/auth/register`, `/auth/login`
   - Dashboard: `/dashboard`
   - Admin (with admin user): `/admin`

## Tests

Tests are in `app.test.js` and cover:

- Public routes: `/`, `/about`, `/auth/register`, `/auth/login`
- Basic validation errors for login / register
- Redirect behaviour on protected routes when not logged in
- Weather route responses

Run:

```bash
npm test
```
