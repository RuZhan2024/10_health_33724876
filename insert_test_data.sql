-- insert_test_data.sql – sample data for the Health App
-- This script should be run after create_db.sql
USE health_app;

-- Users
-- We’ll create one admin account and two normal users for testing.
-- Passwords (in plain text, for reference):
--   admin : AdminPass123!
--   alice : AlicePass123!
--   bob   : BobPass123!
INSERT INTO users (username, email, password_hash, role, is_active, created_at, last_login)
VALUES
  ('gold',  'gru001@gold.ac.uk',
   '$2b$10$XCgr6z1XWPKufo/Qw07XY.Wtv0U/aa.VMfsVYX4CDWDmN08wM.lHW',
   'admin', 1, '2025-11-10 09:00:00', NULL),

  ('alice', 'alice@example.com',
   '<put a bcrypt hash here>',
   'user', 1, '2025-11-11 09:00:00', NULL),

  ('bob',   'bob@example.com',
   '<put a bcrypt hash here>',
   'user', 1, '2025-11-12 09:00:00', NULL);

-- After this insert, MySQL will normally give:
--   gold  -> id = 1
--   alice -> id = 2
--   bob   -> id = 3
-- (unless you already had rows in this table before running the script)

-- Workout types
-- A few basic types so the workouts table has something to point at.
INSERT INTO workout_types (name, description)
VALUES
  ('Running',  'Outdoor or treadmill running'),
  ('Walking',  'Casual or brisk walking'),
  ('Cycling',  'Outdoor or indoor cycling'),
  ('Strength Training', 'Gym or bodyweight strength sessions'),
  ('Yoga',     'Yoga and stretching sessions');

-- Typically these will get IDs 1–5 in the order above.

-- Workouts
-- Some example workouts for Alice (user_id = 2) and Bob (user_id = 3).
INSERT INTO workouts (user_id, workout_type_id, workout_date,
                      duration_minutes, intensity, notes)
VALUES
  -- Alice's workouts
  (2, 1, '2025-11-20', 30, 'high',   'Interval run around the park'),
  (2, 2, '2025-11-21', 45, 'medium', 'Evening walk with friends'),
  (2, 4, '2025-11-22', 40, 'high',   'Upper body dumbbell workout'),

  -- Bob's workouts
  (3, 2, '2025-11-19', 20, 'low',    'Short lunchtime walk'),
  (3, 5, '2025-11-21', 60, 'low',    'Relaxing yoga session'),
  (3, 1, '2025-11-23', 25, 'medium', 'Easy recovery run');

-- Metric types
-- These describe what kind of health metric we’re storing (weight, BP, etc.).
INSERT INTO metric_types (name, default_unit, description)
VALUES
  ('Weight',        'kg',    'Body weight'),
  ('Blood Pressure','mmHg',  'Systolic/diastolic blood pressure'),
  ('Heart Rate',    'bpm',   'Resting heart rate'),
  ('Steps',         'steps', 'Daily step count'),
  ('Sleep',         'hours', 'Nightly sleep duration');

-- Again, IDs are usually 1–5 in the order shown.

-- Metrics
-- A small set of readings for Alice (user_id = 2) and Bob (user_id = 3).
INSERT INTO metrics (user_id, metric_type_id, metric_date,
                     value, unit, notes)
VALUES
  -- Alice's metrics
  (2, 1, '2025-11-19', 72.40,   NULL, 'Morning weigh-in'),
  (2, 1, '2025-11-22', 72.10,   NULL, 'Post-workout weight'),
  (2, 3, '2025-11-19', 65.00,   NULL, 'Resting pulse'),
  (2, 4, '2025-11-20', 8500.00, NULL, 'Office day, walked to station'),
  (2, 5, '2025-11-21', 7.50,    NULL, 'Slept well'),

  -- Bob's metrics
  (3, 1, '2025-11-19', 80.20,    NULL, 'Evening weigh-in'),
  (3, 2, '2025-11-19', 120.00,   'mmHg', 'BP approx 120/80 after rest'),
  (3, 3, '2025-11-20', 75.00,    NULL, 'Resting pulse after coffee'),
  (3, 4, '2025-11-21', 10200.00, NULL, 'Lots of walking today'),
  (3, 5, '2025-11-22', 6.00,     NULL, 'Late night, shorter sleep');

-- Login audit
-- A few example login attempts that can be shown on an admin page.
INSERT INTO login_audit (user_id, username_attempt, success,
                         ip_address, user_agent, attempted_at)
VALUES
  (1, 'admin', 1, '127.0.0.1',
   'Local dev / Chrome', '2025-11-24 10:00:00'),
  (2, 'alice', 1, '127.0.0.1',
   'Local dev / Chrome', '2025-11-24 10:05:00'),
  (NULL, 'wronguser', 0, '127.0.0.1',
   'Local dev / Chrome', '2025-11-24 10:10:00');
