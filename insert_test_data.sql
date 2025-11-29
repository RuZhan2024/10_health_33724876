-- insert_test_data.sql – sample data for Health App
-- Run AFTER create_db.sql
USE health_app;

-- ---------------------------------------------------
-- 1. Users (admin + 2 normal users)
--    Plaintext passwords for testing:
--      admin -> AdminPass123!
--      alice -> AlicePass123!
--      bob   -> BobPass123!
-- ---------------------------------------------------
INSERT INTO users (username, email, password_hash, role, is_active, created_at, last_login)
VALUES
  ('gold', 'gru001@gold.ac.uk',
   '$2b$10$XCgr6z1XWPKufo/Qw07XY.Wtv0U/aa.VMfsVYX4CDWDmN08wM.lHW',
   'admin', 1, '2025-11-10 09:00:00', NULL);

-- After this insert, IDs will typically be:
-- admin -> id = 1
-- alice -> id = 2
-- bob   -> id = 3

-- ---------------------------------------------------
-- 2. Workout types
-- ---------------------------------------------------
INSERT INTO workout_types (name, description)
VALUES
  ('Running',  'Outdoor or treadmill running'),
  ('Walking',  'Casual or brisk walking'),
  ('Cycling',  'Outdoor or indoor cycling'),
  ('Strength Training', 'Gym or bodyweight strength sessions'),
  ('Yoga',     'Yoga and stretching sessions');

-- Expected IDs:
-- Running -> 1, Walking -> 2, Cycling -> 3, Strength Training -> 4, Yoga -> 5

-- ---------------------------------------------------
-- 3. Sample workouts for alice (user_id = 2) and bob (user_id = 3)
-- ---------------------------------------------------
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

-- ---------------------------------------------------
-- 4. Metric types
-- ---------------------------------------------------
INSERT INTO metric_types (name, default_unit, description)
VALUES
  ('Weight',        'kg',    'Body weight'),
  ('Blood Pressure','mmHg',  'Systolic/diastolic blood pressure'),
  ('Heart Rate',    'bpm',   'Resting heart rate'),
  ('Steps',         'steps', 'Daily step count'),
  ('Sleep',         'hours', 'Nightly sleep duration');

-- Expected IDs:
-- Weight -> 1, Blood Pressure -> 2, Heart Rate -> 3, Steps -> 4, Sleep -> 5

-- ---------------------------------------------------
-- 5. Sample metrics for alice (user_id = 2) and bob (user_id = 3)
-- ---------------------------------------------------
INSERT INTO metrics (user_id, metric_type_id, metric_date,
                     value, unit, notes)
VALUES
  -- Alice's metrics
  (2, 1, '2025-11-19', 72.40,  NULL, 'Morning weigh-in'),
  (2, 1, '2025-11-22', 72.10,  NULL, 'Post-workout weight'),
  (2, 3, '2025-11-19', 65.00,  NULL, 'Resting pulse'),
  (2, 4, '2025-11-20', 8500.00, NULL, 'Office day, walked to station'),
  (2, 5, '2025-11-21', 7.50,   NULL, 'Slept well'),

  -- Bob's metrics
  (3, 1, '2025-11-19', 80.20,  NULL, 'Evening weigh-in'),
  (3, 2, '2025-11-19', 120.00, 'mmHg', 'BP approx 120/80 after rest'),
  (3, 3, '2025-11-20', 75.00,  NULL, 'Resting pulse after coffee'),
  (3, 4, '2025-11-21', 10200.00, NULL, 'Lots of walking today'),
  (3, 5, '2025-11-22', 6.00,   NULL, 'Late night, shorter sleep');

-- ---------------------------------------------------
-- 6. Sample login audit records (optional, for admin page)
-- ---------------------------------------------------
INSERT INTO login_audit (user_id, username_attempt, success,
                         ip_address, user_agent, attempted_at)
VALUES
  (1, 'admin', 1, '127.0.0.1',
   'Local dev / Chrome', '2025-11-24 10:00:00'),
  (2, 'alice', 1, '127.0.0.1',
   'Local dev / Chrome', '2025-11-24 10:05:00'),
  (NULL, 'wronguser', 0, '127.0.0.1',
   'Local dev / Chrome', '2025-11-24 10:10:00');
