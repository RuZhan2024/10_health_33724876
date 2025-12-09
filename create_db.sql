-- create_db.sql – Health Tracking App
-- You can change 'health_app' below if you want a different database name.

DROP DATABASE IF EXISTS health_app;
CREATE DATABASE IF NOT EXISTS health_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE health_app;

-- Users table
-- Stores login details and basic account info.
CREATE TABLE users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login      DATETIME NULL,

  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email    UNIQUE (email)
) ENGINE=InnoDB;


-- Workout types
-- Simple lookup table for naming workout categories.
CREATE TABLE workout_types (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,

  CONSTRAINT uq_workout_types_name UNIQUE (name)
) ENGINE=InnoDB;

-- Workouts
-- Individual workout records linked to a user and a workout type.
CREATE TABLE workouts (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED NOT NULL,
  workout_type_id   INT UNSIGNED NOT NULL,
  workout_date      DATE NOT NULL,
  duration_minutes  INT UNSIGNED NOT NULL,
  intensity         ENUM('low','medium','high') DEFAULT 'medium',
  notes             VARCHAR(500) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_workouts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_workouts_type
    FOREIGN KEY (workout_type_id) REFERENCES workout_types(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Index to speed up “show my workouts over time” queries
CREATE INDEX idx_workouts_user_date
  ON workouts (user_id, workout_date);


-- Metric types
-- Lookup table for things like weight, blood pressure, steps, etc.
CREATE TABLE metric_types (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(50) NOT NULL,
  default_unit VARCHAR(20) NOT NULL,
  description  VARCHAR(255) NULL,

  CONSTRAINT uq_metric_types_name UNIQUE (name)
) ENGINE=InnoDB;

-- Metrics
-- Stores actual measurements for each user (weight, BP, sleep, etc.).
CREATE TABLE metrics (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  metric_type_id  INT UNSIGNED NOT NULL,
  metric_date     DATE NOT NULL,
  value           DECIMAL(10,2) NOT NULL,
  unit            VARCHAR(20) NULL,
  notes           VARCHAR(500) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_metrics_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_metrics_type
    FOREIGN KEY (metric_type_id) REFERENCES metric_types(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Index to make user + date lookups faster
CREATE INDEX idx_metrics_user_date
  ON metrics (user_id, metric_date);

-- Login audit
-- Optional table to log login attempts (for an admin view).
CREATE TABLE login_audit (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NULL,
  username_attempt VARCHAR(50) NULL,
  success          TINYINT(1) NOT NULL,
  ip_address       VARCHAR(45) NULL,
  user_agent       VARCHAR(255) NULL,
  attempted_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_login_audit_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_login_audit_user_time
  ON login_audit (user_id, attempted_at);

-- MySQL user for the app
-- Run this part as root/admin in MySQL.
-- In production you’d probably lock this down to specific privileges.
CREATE USER IF NOT EXISTS 'health_app'@'localhost' IDENTIFIED BY 'qwertyuiop';

GRANT ALL PRIVILEGES ON health_app.* TO 'health_app'@'localhost';
FLUSH PRIVILEGES;

-- More restrictive permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE
-- ON health_app.* TO 'health_app'@'localhost';
