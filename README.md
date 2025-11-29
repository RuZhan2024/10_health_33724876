# 10_health_33724876 – Health Tracker (Express + MySQL)

A small health-tracking web application built with **Node.js**, **Express**, **EJS**, and **MySQL**.

Users can register, log in, and track their **workouts** and **health metrics** (weight, blood pressure, heart rate, steps, sleep, etc.).  
An **admin panel** provides an overview of users, simple activity statistics, and recent login attempts.

## 1. Features

### Core user features

- **User registration & login**  
  - Passwords stored as **bcrypt hashes**
  - Validation using `express-validator`
  - Flash messages for errors/success (`connect-flash`)

- **Role-based access**
  - `user` – normal user
  - `admin` – access to `/admin` dashboard
  - New registrations always get `role = 'user'` by default

- **Personal dashboard**
  - Recent **workouts** and **metrics**
  - Simple summary stats (totals / last 7 days)

- **Workouts module**
  - List your own workouts
  - Add / edit / delete workouts
  - Filter by **date range** and **workout type**

- **Metrics module**
  - List your own health metrics (weight, BP, HR, steps, sleep, etc.)
  - Add / edit / delete metrics
  - Filter by **date range** and **metric type**

- **Search**
  - Search across **workouts** and/or **metrics**
  - Filter by keyword, scope (workouts / metrics / both), and date range

- **Error pages**
  - 403 – forbidden (e.g. user tries to open `/admin` without admin role)
  - 404 – not found
  - 500 – server error

### Admin features

- **Admin dashboard (`/admin`)**
  - Overall site stats:
    - Total users / admins / active users
    - Total workouts & metrics
    - Workouts and metrics in the last 7 days
  - Users table:
    - Username, email, role, active status
    - Counts of workouts & metrics per user
    - Created time and last login time
  - Actions:
    - Change user role (`user` ↔ `admin`)
    - Activate / deactivate users (cannot deactivate yourself)
  - **Login audit**:
    - Recent login attempts (username, success/failure, IP, user agent, timestamp)

## 2. Tech stack

- **Backend**
  - Node.js
  - Express

- **Templating**
  - EJS

- **Database**
  - MySQL 8
  - `mysql2` for queries
  - `express-mysql-session` for session storage

- **Auth / security**
  - `express-session`
  - `bcrypt`

- **Validation & UX**
  - `express-validator`
  - `connect-flash`

- **Config**
  - `dotenv`

## 3. Project structure

```text
10_health_33724876/
├─ index.js                 # Main Express app (middleware + routes)
├─ db.js                    # MySQL connection / session store config
├─ _middleware.js           # Auth / role middleware & locals
├─ create_db.sql            # Create database, tables, app user & grants
├─ insert_test_data.sql     # Seed data (admin user, types, sample data)
├─ .env.example             # Example environment variables
├─ package.json
├─ public/
│  └─ main.css              # Shared styles
├─ routes/
│  ├─ home.js
│  ├─ auth.js
│  ├─ dashboard.js
│  ├─ workouts.js
│  ├─ metrics.js
│  ├─ search.js
│  └─ admin.js
└─ views/
   ├─ partials/
   │  ├─ header.ejs         # <head> + navigation + opening <main> + flash
   │  ├─ footer.ejs         # closing </main> and </body></html>
   │  └─ _flash.ejs         # flash message partial
   ├─ home.ejs
   ├─ about.ejs
   ├─ error_403.ejs
   ├─ error_404.ejs
   ├─ error_500.ejs
   ├─ auth/
   │  ├─ login.ejs
   │  └─ register.ejs
   ├─ dashboard.ejs
   ├─ workouts/
   │  ├─ list.ejs
   │  └─ form.ejs
   ├─ metrics/
   │  ├─ list.ejs
   │  └─ form.ejs
   ├─ search/
   │  ├─ search.ejs
   │  └─ results.ejs
   └─ admin.ejs             # Admin dashboard
````

All “page” views include:

```ejs
<%- include('../partials/header', { pageTitle: 'Page Title' }) %>

<!-- page content -->

<%- include('../partials/footer') %>
```

## 4. Database design

**Database name:** `health_app`

Tables:

1. `users`
2. `workout_types`
3. `workouts`
4. `metric_types`
5. `metrics`
6. `login_audit`

### 4.1 `users`

Stores user accounts and roles.

| Column        | Type                 | Notes                       |
| ------------- | -------------------- | --------------------------- |
| id            | INT UNSIGNED PK      | Auto-increment              |
| username      | VARCHAR(50) UNIQUE   | Login name                  |
| email         | VARCHAR(255) UNIQUE  | User email                  |
| password_hash | VARCHAR(255)         | Bcrypt hash                 |
| role          | ENUM('user','admin') | Default `'user'`            |
| is_active     | TINYINT(1)           | 1 = active, 0 = deactivated |
| created_at    | DATETIME             | Default current timestamp   |
| last_login    | DATETIME NULL        | Updated on successful login |

### 4.2 `workout_types`

Lookup table for possible workout types.

| Column      | Type               | Notes                 |
| ----------- | ------------------ | --------------------- |
| id          | INT UNSIGNED PK    | Auto-increment        |
| name        | VARCHAR(50) UNIQUE | e.g. Running, Walking |
| description | VARCHAR(255) NULL  | Optional description  |

### 4.3 `workouts`

Individual workout sessions per user.

| Column           | Type                               | Notes                     |
| ---------------- | ---------------------------------- | ------------------------- |
| id               | INT UNSIGNED PK                    | Auto-increment            |
| user_id          | INT UNSIGNED FK → users.id         | Owner                     |
| workout_type_id  | INT UNSIGNED FK → workout_types.id | Type of workout           |
| workout_date     | DATE                               | Date of the workout       |
| duration_minutes | INT UNSIGNED                       | Duration in minutes       |
| intensity        | ENUM('low','medium','high')        | Default `'medium'`        |
| notes            | VARCHAR(500) NULL                  | Optional notes            |
| created_at       | DATETIME                           | Default current timestamp |

Index: `(user_id, workout_date)` for faster per-user queries.

---

### 4.4 `metric_types`

Lookup table for different health metrics.

| Column       | Type               | Notes                       |
| ------------ | ------------------ | --------------------------- |
| id           | INT UNSIGNED PK    | Auto-increment              |
| name         | VARCHAR(50) UNIQUE | e.g. Weight, Blood Pressure |
| default_unit | VARCHAR(20)        | e.g. kg, mmHg, bpm          |
| description  | VARCHAR(255) NULL  | Optional description        |

### 4.5 `metrics`

Individual health metric entries per user.

| Column         | Type                              | Notes                                 |
| -------------- | --------------------------------- | ------------------------------------- |
| id             | INT UNSIGNED PK                   | Auto-increment                        |
| user_id        | INT UNSIGNED FK → users.id        | Owner                                 |
| metric_type_id | INT UNSIGNED FK → metric_types.id | Type                                  |
| metric_date    | DATE                              | Date of measurement                   |
| value          | DECIMAL(10,2)                     | Numeric value                         |
| unit           | VARCHAR(20) NULL                  | Optional override (else default_unit) |
| notes          | VARCHAR(500) NULL                 | Optional notes                        |
| created_at     | DATETIME                          | Default current timestamp             |

Index: `(user_id, metric_date)`.

### 4.6 `login_audit`

Logging login attempts (used on the admin dashboard).

| Column           | Type                       | Notes                         |
| ---------------- | -------------------------- | ----------------------------- |
| id               | INT UNSIGNED PK            | Auto-increment                |
| user_id          | INT UNSIGNED FK → users.id | May be NULL for unknown users |
| username_attempt | VARCHAR(50) NULL           | Username attempted            |
| success          | TINYINT(1)                 | 1 = success, 0 = failure      |
| ip_address       | VARCHAR(45) NULL           | IPv4/IPv6                     |
| user_agent       | VARCHAR(255) NULL          | Browser / client string       |
| attempted_at     | DATETIME                   | Default current timestamp     |


## 5. Database setup scripts

### 5.1 `create_db.sql` (summary)

* Drops and recreates the `health_app` database.
* Defines tables: `users`, `workout_types`, `workouts`, `metric_types`, `metrics`, `login_audit`.
* Adds indexes and foreign keys.
* Optionally creates a **dedicated MySQL user** for the app:

```sql
-- Optional: create dedicated MySQL user for the app (run as root / admin)
CREATE USER IF NOT EXISTS 'health_app'@'localhost' IDENTIFIED BY 'qwertyuiop';

GRANT SELECT, INSERT, UPDATE, DELETE
ON health_app.* TO 'health_app'@'localhost';
```

> In development, the app is configured to connect using this `health_app` MySQL user.

---

### 5.2 `insert_test_data.sql` (summary)

* Uses the `health_app` database.
* Inserts:

  * One **admin user** (for marking).
  * Basic workout types and metric types.
  * A small number of sample workouts, metrics, and login audit entries for that user.

#### Default admin user

> All other pre-inserted users were removed – only this admin user is created by `insert_test_data.sql`.

| username | role  | email                                         | password |
| -------- | ----- | --------------------------------------------- | -------- |
| gold     | admin | [gru001@gold.ac.uk](mailto:gru001@gold.ac.uk) | `smiths` |

The script inserts the **bcrypt hash** for `"smiths"` into `users.password_hash`.
Markers can also create additional **user** accounts via the registration form.


## 6. Environment variables

`.env.example`:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=health_app
DB_PASSWORD=qwertyuiop
DB_NAME=health_app

SESSION_SECRET=change_this_in_real_env
```

Steps:

1. Copy it to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Adjust values if needed (e.g. different DB user/password, stronger `SESSION_SECRET`).

The `.env` file is **not committed** to the repository.

## 7. Route design

### Mounted routes (in `index.js`)

```js
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/workouts', workoutsRoutes);
app.use('/metrics', metricsRoutes);
app.use('/search', searchRoutes);
app.use('/admin', adminRoutes);
```

### Key routes (summary)

| Area      | Method | Path                             | Middleware         | Description                                     |
| --------- | ------ | -------------------------------- | ------------------ | ----------------------------------------------- |
| Home      | GET    | `/`                              | attachUserToLocals | Landing page                                    |
| Home      | GET    | `/about`                         | attachUserToLocals | About page                                      |
| Auth      | GET    | `/auth/register`                 | attachUserToLocals | Show registration form                          |
| Auth      | POST   | `/auth/register`                 | attachUserToLocals | Register user (validation + bcrypt)             |
| Auth      | GET    | `/auth/login`                    | attachUserToLocals | Show login form                                 |
| Auth      | POST   | `/auth/login`                    | attachUserToLocals | Authenticate, set session, log to `login_audit` |
| Auth      | GET    | `/auth/logout`                   | requireLogin       | Clear session user & redirect to `/`            |
| Dashboard | GET    | `/dashboard`                     | requireLogin       | User dashboard (recent data + stats)            |
| Workouts  | GET    | `/workouts`                      | requireLogin       | List workouts + filters                         |
| Workouts  | GET    | `/workouts/add`                  | requireLogin       | Add workout form                                |
| Workouts  | POST   | `/workouts/add`                  | requireLogin       | Insert workout                                  |
| Workouts  | GET    | `/workouts/:id/edit`             | requireLogin       | Edit own workout                                |
| Workouts  | POST   | `/workouts/:id/edit`             | requireLogin       | Update workout                                  |
| Workouts  | POST   | `/workouts/:id/delete`           | requireLogin       | Delete workout                                  |
| Metrics   | GET    | `/metrics`                       | requireLogin       | List metrics + filters                          |
| Metrics   | GET    | `/metrics/add`                   | requireLogin       | Add metric form                                 |
| Metrics   | POST   | `/metrics/add`                   | requireLogin       | Insert metric                                   |
| Metrics   | GET    | `/metrics/:id/edit`              | requireLogin       | Edit own metric                                 |
| Metrics   | POST   | `/metrics/:id/edit`              | requireLogin       | Update metric                                   |
| Metrics   | POST   | `/metrics/:id/delete`            | requireLogin       | Delete metric                                   |
| Search    | GET    | `/search`                        | requireLogin       | Search form                                     |
| Search    | GET    | `/search/results`                | requireLogin       | Search results across workouts/metrics          |
| Admin     | GET    | `/admin`                         | requireAdmin       | Admin dashboard (stats + users + login audit)   |
| Admin     | POST   | `/admin/users/:id/role`          | requireAdmin       | Change user role                                |
| Admin     | POST   | `/admin/users/:id/toggle-active` | requireAdmin       | Activate / deactivate user                      |


## 8. Middleware

Defined in `_middleware.js`:

* **`requireLogin`**

  * Redirects unauthenticated users to `/auth/login`.
  * Used on routes that require a logged-in user.

* **`requireAdmin`**

  * Checks that `req.session.user` exists and `role === 'admin'`.
  * Otherwise responds with **403** (or redirects).

* **`attachUserToLocals`**

  * Makes the current user available as `currentUser` in all views.
  * Also attaches `success` and `error` flash messages for `_flash.ejs`.

## 9. Setup & run

### Prerequisites

* Node.js **18+**
* MySQL **8+**
* A MySQL user with permission to run `create_db.sql` and `insert_test_data.sql` once.

### Steps

1. **Clone the repo**

   ```bash
   git clone <your-repo-url>.git
   cd 10_health_33724876
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create database & app user**

   Log into MySQL as root (or another admin), then run:

   ```sql
   SOURCE create_db.sql;
   SOURCE insert_test_data.sql;
   ```

4. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env if needed (DB credentials, SESSION_SECRET, etc.)
   ```

5. **Run the app**

   ```bash
   npm start
   # or: node index.js
   ```

6. **Log in as admin**

   Use the pre-seeded admin user:

   * **Username:** `gold`
   * **Email:** `gru001@gold.ac.uk`
   * **Password:** `smiths`

   You can then:

   * Access `/admin` to see the admin panel.
   * Register new normal users through `/auth/register`.


