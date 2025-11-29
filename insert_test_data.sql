USE guardian_health;

INSERT INTO users (username, password_hash, full_name, email, role)
VALUES ('gold', 'smiths', 'Gold Smith', 'gold@example.com', 'admin');

-- assume gold is id = 1
INSERT INTO workouts (user_id, date, type, duration_min, intensity, calories, notes)
VALUES
  (1, CURDATE() - INTERVAL 3 DAY, 'Run',    30, 4, 260, 'Morning run'),
  (1, CURDATE() - INTERVAL 2 DAY, 'Gym',    45, 5, 350, 'Strength training'),
  (1, CURDATE() - INTERVAL 1 DAY, 'Walk',   20, 2, 90,  'Evening walk'),
  (1, CURDATE(),                  'Yoga',   40, 3, 150, 'Relax session');

INSERT INTO metrics (user_id, date, weight_kg, steps, bp_systolic, bp_diastolic, notes)
VALUES
  (1, CURDATE() - INTERVAL 3 DAY, 70.5, 8000, 120, 80, 'Normal'),
  (1, CURDATE() - INTERVAL 2 DAY, 70.3, 9500, 118, 79, ''),
  (1, CURDATE() - INTERVAL 1 DAY, 70.4, 6500, 122, 83, 'A bit stressed'),
  (1, CURDATE(),                  70.2, 10000,116, 78, 'Feeling good');
