
# 10_health_33724876 – Health Tracker (Express + MySQL)

A small health-tracking web application built with **Node.js**, **Express**, **EJS**, and **MySQL**.

Users can register, log in, and track their **workouts** and **health metrics** (weight, blood pressure, heart rate, steps, sleep, etc.).  
An **admin panel** provides an overview of users and basic activity statistics.

> This README also documents the **database design** and **route structure** we’ve planned so far, so future work can follow the same structure.

---

## 1. Features (planned)

### Core user features

- User registration and login with **hashed passwords**.
- Role-based access:
  - `user` – normal user
  - `admin` – admin panel access
- Personal dashboard:
  - Recent workouts
  - Recent health metrics
  - Simple summary stats
- Workouts module:
  - List own workouts
  - Add / edit / delete workouts
  - Filter by date range and workout type
- Metrics module:
  - List own health metrics (weight, BP, HR, steps, sleep, …)
  - Add / edit / delete metrics
  - Filter by date range and metric type
- Search:
  - Search across workouts / metrics with optional filters
- Admin area:
  - List all users with basic stats
  - (Optional) change roles / deactivate users
- Friendly error pages:
  - 403 – forbidden
  - 404 – not found
  - 500 – server error

### Technical features

- Passwords stored as **bcrypt hashes**.
- DB credentials managed via **`.env`** (not committed to Git).
- Separate route modules per feature (home, auth, dashboard, workouts, metrics, search, admin).
- Shared layout and partials for consistent UI.
- Optional **login audit** table for recording login attempts (bonus feature).

---

## 2. Tech stack

- **Backend**
  - Node.js
  - Express
- **Templating**
  - EJS
- **Database**
  - MySQL 8
  - `mysql2` / `express-mysql-session` for DB + session store
- **Auth / security**
  - `express-session`
  - `bcrypt`
- **Validation & UX**
  - `express-validator`
  - `connect-flash`
- **Config**
  - `dotenv`

---

## 3. Project structure (planned)

```text
10_health_33724876/
├─ index.js                 # Main Express app
├─ db.js                    # MySQL connection / config
├─ _middleware.js           # Auth / role middleware & locals
├─ create_db.sql            # Create database, tables, (optional) app user
├─ insert_test_data.sql     # Seed data (users, types, workouts, metrics)
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
   ├─ layout.ejs
   ├─ partials/
   │  ├─ _head.ejs
   │  ├─ _header.ejs
   │  ├─ _nav.ejs
   │  ├─ _flash.ejs
   │  └─ _footer.ejs
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
   └─ search/
      ├─ search.ejs
      └─ results.ejs
````

---

## 4. Database design

**Database name:** `health_app` (can be changed, but must stay consistent)

We use **6 tables**:

1. `users`
2. `workout_types`
3. `workouts`
4. `metric_types`
5. `metrics`
6. `login_audit` (optional but implemented in schema and test data)

### 4.1 Tables (overview)

#### `users`

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

#### `workout_types`

Lookup table for possible workout types.

| Column      | Type               | Notes                 |
| ----------- | ------------------ | --------------------- |
| id          | INT UNSIGNED PK    | Auto-increment        |
| name        | VARCHAR(50) UNIQUE | E.g. Running, Walking |
| description | VARCHAR(255) NULL  | Optional description  |

#### `workouts`

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

Index: `(user_id, workout_date)` for fast per-user queries.

#### `metric_types`

Lookup table for different health metrics.

| Column       | Type               | Notes                       |
| ------------ | ------------------ | --------------------------- |
| id           | INT UNSIGNED PK    | Auto-increment              |
| name         | VARCHAR(50) UNIQUE | E.g. Weight, Blood Pressure |
| default_unit | VARCHAR(20)        | E.g. kg, mmHg, bpm          |
| description  | VARCHAR(255) NULL  | Optional description        |

#### `metrics`

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

#### `login_audit` (optional)

For logging login attempts – useful for the admin page.

| Column           | Type                       | Notes                         |
| ---------------- | -------------------------- | ----------------------------- |
| id               | INT UNSIGNED PK            | Auto-increment                |
| user_id          | INT UNSIGNED FK → users.id | May be NULL for unknown users |
| username_attempt | VARCHAR(50) NULL           | Username attempted            |
| success          | TINYINT(1)                 | 1 = success, 0 = failure      |
| ip_address       | VARCHAR(45) NULL           | IPv4/IPv6                     |
| user_agent       | VARCHAR(255) NULL          | Browser / client string       |
| attempted_at     | DATETIME                   | Default current timestamp     |

---

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

### 5.2 `insert_test_data.sql` (summary)

* Uses `health_app` database.
* Inserts seed data:

**Users**

Plaintext passwords for the marker:

| username | role  | password        |
| -------- | ----- | --------------- |
| admin    | admin | `AdminPass123!` |
| alice    | user  | `AlicePass123!` |
| bob      | user  | `BobPass123!`   |

Each has a corresponding **bcrypt hash** inserted into `users.password_hash`.

**Workout types**

* Running
* Walking
* Cycling
* Strength Training
* Yoga

**Sample workouts**

* Several workouts for `alice` and `bob` on different dates, with different types, intensities, and durations.

**Metric types**

* Weight (kg)
* Blood Pressure (mmHg)
* Heart Rate (bpm)
* Steps (steps)
* Sleep (hours)

**Sample metrics**

* Weight, heart rate, steps, sleep entries for both `alice` and `bob`, spread across dates.
* Example BP entry stored with value and unit `mmHg`.

**Login audit**

* A few example login audit rows, including successful and failed attempts.

---

## 6. Environment variables

A `.env.example` file should look like:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=health_app
DB_PASSWORD=qwertyuiop
DB_NAME=health_app

SESSION_SECRET=change_this_in_real_env
```

The real `.env` is **not** committed to the repo.

---

## 7. Route design (planned)

### Mounted routes

In `index.js`:

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
| Home      | GET    | `/`                              | attachUserToLocals | Landing page (guest vs logged-in vs admin view) |
| Home      | GET    | `/about`                         | attachUserToLocals | About page                                      |
| Auth      | GET    | `/auth/register`                 | attachUserToLocals | Show registration form                          |
| Auth      | POST   | `/auth/register`                 | attachUserToLocals | Handle registration (validation + bcrypt)       |
| Auth      | GET    | `/auth/login`                    | attachUserToLocals | Show login form                                 |
| Auth      | POST   | `/auth/login`                    | attachUserToLocals | Authenticate, set session, log to login_audit   |
| Auth      | GET    | `/auth/logout`                   | requireLogin       | Destroy session, redirect                       |
| Dashboard | GET    | `/dashboard`                     | requireLogin       | Show user’s recent workouts/metrics + stats     |
| Workouts  | GET    | `/workouts`                      | requireLogin       | List user workouts + filters                    |
| Workouts  | GET    | `/workouts/add`                  | requireLogin       | Add workout form                                |
| Workouts  | POST   | `/workouts/add`                  | requireLogin       | Insert workout                                  |
| Workouts  | GET    | `/workouts/:id/edit`             | requireLogin       | Edit own workout                                |
| Workouts  | POST   | `/workouts/:id/edit`             | requireLogin       | Update workout                                  |
| Workouts  | POST   | `/workouts/:id/delete`           | requireLogin       | Delete workout                                  |
| Metrics   | GET    | `/metrics`                       | requireLogin       | List user metrics + filters                     |
| Metrics   | GET    | `/metrics/add`                   | requireLogin       | Add metric form                                 |
| Metrics   | POST   | `/metrics/add`                   | requireLogin       | Insert metric                                   |
| Metrics   | GET    | `/metrics/:id/edit`              | requireLogin       | Edit own metric                                 |
| Metrics   | POST   | `/metrics/:id/edit`              | requireLogin       | Update metric                                   |
| Metrics   | POST   | `/metrics/:id/delete`            | requireLogin       | Delete metric                                   |
| Search    | GET    | `/search`                        | requireLogin       | Show search form                                |
| Search    | GET    | `/search/results`                | requireLogin       | Show workouts/metrics results                   |
| Admin     | GET    | `/admin`                         | requireAdmin       | Admin dashboard with user list + stats          |
| Admin     | POST   | `/admin/users/:id/role`          | requireAdmin       | (Optional) Change user role                     |
| Admin     | POST   | `/admin/users/:id/toggle-active` | requireAdmin       | (Optional) Activate/deactivate user             |

---

## 8. Middleware

In `_middleware.js`:

* `requireLogin` – redirect unauthenticated users to `/auth/login`.
* `requireAdmin` – also checks `req.session.user.role === 'admin'`, otherwise 403.
* `attachUserToLocals` – makes `currentUser` and flash messages available to all views.

---

## 9. Setup & run

### Prerequisites

* Node.js 18+
* MySQL 8+
* A MySQL user with permission to create databases and users (for running `create_db.sql` once).

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

   Log into MySQL as root (or another admin), then:

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

6. **Test logins**

   * Admin: `admin` / `AdminPass123!`
   * User: `alice` / `AlicePass123!`
   * User: `bob` / `BobPass123!`


