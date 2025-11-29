-- create_db.sql

DROP DATABASE IF EXISTS guardian_health;
CREATE DATABASE guardian_health
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE guardian_health;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  type ENUM('Run','Walk','Gym','Yoga','Cycling','Other') NOT NULL,
  duration_min INT NOT NULL,
  intensity TINYINT UNSIGNED NOT NULL,
  calories INT UNSIGNED,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_workouts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_workouts_user_date
  ON workouts (user_id, date);

CREATE TABLE metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  weight_kg DECIMAL(5,2),
  steps INT UNSIGNED,
  bp_systolic TINYINT UNSIGNED,
  bp_diastolic TINYINT UNSIGNED,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_metrics_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_metrics_user_date
  ON metrics (user_id, date);
