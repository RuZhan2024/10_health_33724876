# 10_health_33724876 – Health Tracker (Express + MySQL)

Health Tracker is a small web application built with Node.js, Express, EJS, and MySQL.

Users can register, log in, and record workouts and health metrics (for example: weight, blood pressure, heart rate, steps, sleep). An admin dashboard gives an overview of users, activity, and recent login attempts. A separate weather page integrates with the OpenWeatherMap API to show current weather for a chosen city.

The project also includes basic router tests using Supertest and Chai to check that key routes respond correctly and that protected routes redirect unauthenticated users.


## 1. Features

### 1.1 User accounts and authentication

- User registration and login
- Passwords stored as bcrypt hashes
- Server-side validation with `express-validator`
- Session-based authentication using `express-session`
- Flash messages for success and error feedback

### 1.2 Roles and permissions

- Two roles:
  - `user` – normal application user
  - `admin` – can access `/admin` dashboard and manage users
- New registrations always start as `user`
- Middleware:
  - `requireLogin` for routes that require a logged-in user
  - `requireAdmin` for admin-only routes

### 1.3 Dashboard

- Personal dashboard at `/dashboard` for logged-in users
- Shows:
  - Recent workouts
  - Recent health metrics
  - Simple activity statistics (for example, workouts in the last 7 and 30 days)

### 1.4 Workouts

- List your own workouts at `/workouts`
- Add, edit, and delete workouts
- Filter by date range and workout type
- Each workout stores:
  - Date
  - Workout type (for example, Running, Walking)
  - Duration in minutes
  - Intensity (low / medium / high)
  - Optional notes

### 1.5 Metrics

- List your own health metrics at `/metrics`
- Add, edit, and delete metrics
- Filter by date range and metric type
- Each metric stores:
  - Date
  - Metric type (for example, Weight, Blood Pressure)
  - Value
  - Unit (optional; otherwise default from `metric_types`)
  - Optional notes

### 1.6 Search

- Combined search across workouts and metrics:
  - Scope: all / workouts only / metrics only
  - Keyword search in type names and notes
  - Date range filter
- Results are split into “workouts” and “metrics” sections

### 1.7 Weather (extra feature)

- Weather page at `/weather`
- User enters a city name (for example, `London,uk` or `Paris,fr`)
- Server calls the OpenWeatherMap current weather API and shows:
  - City and country
  - Temperature and “feels like”
  - Humidity
  - Wind speed
  - Short description (for example, “clear sky”)
- Clear error messages for:
  - City not found
  - Network / API errors
  - Missing `OPENWEATHER_API_KEY`

### 1.8 Admin dashboard

- Admin dashboard at `/admin`
- Overview:
  - Total users
  - Number of admins
  - Number of active users
  - Total workouts and metrics
  - Workouts and metrics in the last 7 days
- User table:
  - Username, email, role, active status
  - Counts of workouts and metrics per user
  - Created date and last login
- Actions:
  - Change user role (`user` ↔ `admin`)
  - Activate / deactivate user accounts
  - Admins cannot remove their own admin role or deactivate themselves
- Login audit:
  - Recent login attempts (username attempted, success / failure, IP, user agent, timestamp)
  - Failed attempts are logged even if the username does not exist

### 1.9 Error pages

- 403 – forbidden (for example, non-admin accessing `/admin`)
- 404 – not found
- 500 – server error


## 2. Tech stack

- Backend:
  - Node.js
  - Express
- Views:
  - EJS templates
- Database:
  - MySQL 8
  - `mysql2` for queries
  - `express-mysql-session` for storing sessions in MySQL
- Auth and security:
  - `express-session`
  - `bcrypt`
- Validation and UX:
  - `express-validator`
  - `connect-flash`
- Configuration:
  - `dotenv`
- External API:
  - OpenWeatherMap current weather API (via `OPENWEATHER_API_KEY`)
- Testing:
  - `supertest` for HTTP tests
  - `chai` for assertions


## 3. Project structure

```text
10_health_33724876/
├─ index.js                 # Main Express app (middleware + routes)
├─ db.js                    # MySQL connection and session store
├─ routes/
│  ├─ home.js               # Home and about pages
│  ├─ auth.js               # Register, login, logout, delete account
│  ├─ dashboard.js          # Personal dashboard
│  ├─ workouts.js           # CRUD for workouts
│  ├─ metrics.js            # CRUD for health metrics
│  ├─ search.js             # Combined search for workouts/metrics
│  ├─ admin.js              # Admin dashboard and user management
│  └─ weather.js            # Weather page (OpenWeatherMap integration)
├─ views/
│  ├─ partials/
│  │  ├─ header.ejs         # <head>, navigation, flash messages, open <main>
│  │  ├─ footer.ejs         # Close <main> and HTML
│  │  └─ _flash.ejs         # Flash messages
│  ├─ home.ejs
│  ├─ about.ejs
│  ├─ error_403.ejs
│  ├─ error_404.ejs
│  ├─ error_500.ejs
│  ├─ auth/
│  │  ├─ login.ejs
│  │  └─ register.ejs
│  ├─ auth/delete_account.ejs
│  ├─ dashboard.ejs
│  ├─ workouts/
│  │  ├─ list.ejs
│  │  └─ form.ejs
│  ├─ metrics/
│  │  ├─ list.ejs
│  │  └─ form.ejs
│  ├─ search/
│  │  ├─ search.ejs
│  │  └─ results.ejs
│  ├─ weather.ejs
│  └─ admin.ejs
├─ public/
│  └─ main.css              # Shared styles
├─ _middleware.js           # requireLogin, requireAdmin, attachUserToLocals
├─ create_db.sql            # Database and tables
├─ insert_test_data.sql     # Seed data (admin, types, sample data)
├─ app.test.js              # Router / integration tests
├─ .env.example
├─ package.json
└─ README.md
````


## 4. Database schema

Database name: `health_app`

Tables:

1. `users`
2. `workout_types`
3. `workouts`
4. `metric_types`
5. `metrics`
6. `login_audit`

### 4.1 `users`

Stores user accounts and roles.

Key fields include:

* `username`, `email` (both unique)
* `password_hash` (bcrypt hash)
* `role` (`user` or `admin`)
* `is_active` (1 = active, 0 = deactivated)
* `created_at`, `last_login`

### 4.2 `workout_types`

Lookup table for workout types (for example, Running, Walking, Cycling).

### 4.3 `workouts`

Individual workout sessions per user:

* Foreign keys to `users` and `workout_types`
* Workout date
* Duration in minutes
* Intensity (low / medium / high)
* Optional notes
* Index on `(user_id, workout_date)` for per-user queries

### 4.4 `metric_types`

Lookup table for metric types (for example, Weight, Blood Pressure, Heart Rate):

* Default unit for each metric type (for example, kg, mmHg, bpm)

### 4.5 `metrics`

Health metrics per user:

* Foreign keys to `users` and `metric_types`
* Metric date
* Value and unit
* Optional notes
* Index on `(user_id, metric_date)`

### 4.6 `login_audit`

Logs login attempts:

* User id (may be `NULL` if the username does not exist)
* Username attempted
* Success / failure flag
* IP address and user agent
* Timestamp

Weather data is not stored in the database; it is fetched live from OpenWeatherMap and rendered in the view.


## 5. Database setup scripts

### 5.1 `create_db.sql` (summary)

* Creates the `health_app` database
* Creates the six tables listed above
* Defines primary keys, foreign keys, and indexes
* Optionally creates a dedicated MySQL user:

```sql
CREATE USER IF NOT EXISTS 'health_app'@'localhost' IDENTIFIED BY 'qwertyuiop';

GRANT SELECT, INSERT, UPDATE, DELETE
ON health_app.* TO 'health_app'@'localhost';
```

### 5.2 `insert_test_data.sql` (summary)

* Inserts:

  * One admin user
  * A small set of workout types and metric types
  * Sample workouts, metrics, and login audit rows for that user

Default admin user:

* Username: `gold`
* Email: `gru001@gold.ac.uk`
* Password: `smiths` (stored as a bcrypt hash in `users.password_hash`)


## 6. Environment variables
The `.env` file is not committed to version control.

If the application does not start because of missing environment variables, please create a .env file in the project root:

MySQL connection (`HEALTH_HOST`, `HEALTH_USER`, `HEALTH_PASSWORD`, `HEALTH_DATABASE`, `HEALTH_DB_PORT`)

SESSION_SECRET (any non-empty string for local testing)

OPENWEATHER_API_KEY (a valid key from OpenWeatherMap, or leave blank if you do not need the weather page)

## 7. Routes and middleware

### 7.1 Mounted routes (in `index.js`)

```js
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/workouts', workoutsRoutes);
app.use('/metrics', metricsRoutes);
app.use('/search', searchRoutes);
app.use('/admin', adminRoutes);
app.use('/weather', weatherRoutes);
```

### 7.2 Route summary

| Area      | Method | Path                             | Middleware         | Description                             |
| --------- | ------ | -------------------------------- | ------------------ | --------------------------------------- |
| Home      | GET    | `/`                              | attachUserToLocals | Landing page                            |
| Home      | GET    | `/about`                         | attachUserToLocals | About page                              |
| Auth      | GET    | `/auth/register`                 | attachUserToLocals | Show registration form                  |
| Auth      | POST   | `/auth/register`                 | attachUserToLocals | Register user (validation + bcrypt)     |
| Auth      | GET    | `/auth/login`                    | attachUserToLocals | Show login form                         |
| Auth      | POST   | `/auth/login`                    | attachUserToLocals | Authenticate, set session, log to audit |
| Auth      | GET    | `/auth/logout`                   | requireLogin       | Clear session and redirect to `/`       |
| Auth      | GET    | `/auth/delete-account`           | requireLogin       | Confirm account deletion                |
| Auth      | POST   | `/auth/delete-account`           | requireLogin       | Delete user and cascaded data           |
| Dashboard | GET    | `/dashboard`                     | requireLogin       | Personal dashboard                      |
| Workouts  | GET    | `/workouts`                      | requireLogin       | List workouts + filters                 |
| Workouts  | GET    | `/workouts/add`                  | requireLogin       | Add workout form                        |
| Workouts  | POST   | `/workouts/add`                  | requireLogin       | Create workout                          |
| Workouts  | GET    | `/workouts/:id/edit`             | requireLogin       | Edit own workout                        |
| Workouts  | POST   | `/workouts/:id/edit`             | requireLogin       | Update workout                          |
| Workouts  | POST   | `/workouts/:id/delete`           | requireLogin       | Delete workout                          |
| Metrics   | GET    | `/metrics`                       | requireLogin       | List metrics + filters                  |
| Metrics   | GET    | `/metrics/add`                   | requireLogin       | Add metric form                         |
| Metrics   | POST   | `/metrics/add`                   | requireLogin       | Create metric                           |
| Metrics   | GET    | `/metrics/:id/edit`              | requireLogin       | Edit own metric                         |
| Metrics   | POST   | `/metrics/:id/edit`              | requireLogin       | Update metric                           |
| Metrics   | POST   | `/metrics/:id/delete`            | requireLogin       | Delete metric                           |
| Search    | GET    | `/search`                        | requireLogin       | Search form                             |
| Search    | GET    | `/search/results`                | requireLogin       | Search results                          |
| Admin     | GET    | `/admin`                         | requireAdmin       | Admin dashboard                         |
| Admin     | POST   | `/admin/users/:id/role`          | requireAdmin       | Change user role                        |
| Admin     | POST   | `/admin/users/:id/toggle-active` | requireAdmin       | Activate / deactivate user              |
| Weather   | GET    | `/weather`                       | attachUserToLocals | Weather form + results for a city       |

### 7.3 Middleware (`_middleware.js`)

* `requireLogin`
  Redirects unauthenticated users to `/auth/login` and shows a flash message.

* `requireAdmin`
  Requires a logged-in user with `role = 'admin'`. Non-admin users receive a 403 error page.

* `attachUserToLocals`
  Adds `currentUser` and flash messages to `res.locals` for use in all templates.


## 8. Running the application

### 8.1 Prerequisites

* Node.js 18+
* MySQL 8+
* Ability to run the SQL scripts once as a MySQL admin user
* (Optional) OpenWeatherMap API key

### 8.2 Setup and run

1. Clone the repository:

   ```bash
   git clone https://github.com/RuZhan2024/10_health_33724876.git
   cd 10_health_33724876
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create the database and seed data (inside MySQL):

   ```sql
   SOURCE create_db.sql;
   SOURCE insert_test_data.sql;
   ```

4. Create `.env`:

   ```bash
   cp .env.example .env
   # Edit .env to match your local MySQL user and add a SESSION_SECRET
   # Optionally add OPENWEATHER_API_KEY
   ```

5. Start the application:

   ```bash
   npm start
   # or:
   node index.js
   ```

6. Open the app in your browser:

   * Normal user flow: register via `/auth/register`
   * Admin access: log in as `gold / smiths`, then visit `/admin`


## 9. Automated tests

The project includes a small set of router / integration tests in `app.test.js`.

### 9.1 What is tested

The tests focus on basic route behaviour:

* Public routes:

  * `GET /` returns `200` and includes “Welcome”
  * `GET /about` returns `200` and includes “About”
  * `GET /auth/register` and `GET /auth/login` return `200` and render the respective forms

* Auth validation:

  * `POST /auth/login` with empty data returns `422` and shows a validation message
  * `POST /auth/register` with invalid data returns `422` and shows an error about username length

* Protected routes:

  * `GET /dashboard`, `/workouts`, `/workouts/add`, `/metrics`, `/metrics/add`,
    `/search`, `/search/results`, `/admin` and selected POST routes all
    redirect to `/auth/login` when the user is not logged in
    (status code `302` or `303`, `Location` header contains `/auth/login`)

* Weather:

  * `GET /weather` with no `city` query returns `200` and renders the weather page
  * `GET /weather?city=London` returns `200` and includes the weather output in the response
  * If `OPENWEATHER_API_KEY` is not set, the page contains a message explaining that the API key is missing

### 9.2 Running the tests

From the project root:

```bash
npm test
```

