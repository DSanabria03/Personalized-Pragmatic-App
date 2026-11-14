CREATE DATABASE IF NOT EXISTS pragmatic_app;

USE pragmatic_app;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS exercise_attempts;
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS exercise_options;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS assessment_profiles;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS therapists;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE therapists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    therapist_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    access_code VARCHAR(20) NOT NULL UNIQUE,
    avatar VARCHAR(100) NOT NULL DEFAULT 'character-cowboy.png',
    current_level INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_child_age CHECK (age BETWEEN 6 AND 10),
    CONSTRAINT fk_children_therapist
        FOREIGN KEY (therapist_id) REFERENCES therapists(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)

CREATE TABLE assessment_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL UNIQUE,
    irony_score FLOAT NOT NULL DEFAULT 0.0,
    metaphors_score FLOAT NOT NULL DEFAULT 0.0,
    indirect_requests_score FLOAT NOT NULL DEFAULT 0.0,
    recommended_category ENUM('irony', 'metaphors', 'indirect_requests') NOT NULL,
    raw_assessment_json JSON NULL,
    imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_irony_score CHECK (irony_score BETWEEN 0.0 AND 100.0),
    CONSTRAINT chk_metaphors_score CHECK (metaphors_score BETWEEN 0.0 AND 100.0),
    CONSTRAINT chk_indirect_score CHECK (indirect_requests_score BETWEEN 0.0 AND 100.0),
    CONSTRAINT fk_assessment_child
        FOREIGN KEY (child_id) REFERENCES children(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)

CREATE TABLE exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category ENUM('irony', 'metaphors', 'indirect_requests') NOT NULL,
    difficulty_level INT NOT NULL DEFAULT 1,
    story_context_text TEXT NOT NULL,
    target_utterance VARCHAR(255) NOT NULL,
    scene_image_url VARCHAR(255) NOT NULL,
    scene_audio_url VARCHAR(255) NULL,
    clue_face TEXT NOT NULL,
    clue_voice TEXT NOT NULL,
    clue_situation TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_exercises_cat_level (category, difficulty_level)
)

CREATE TABLE exercise_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    arasaac_pictogram_url VARCHAR(255) NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    error_type ENUM('none', 'literal_interpretation', 'unrelated_distractor') NOT NULL DEFAULT 'none',
    CONSTRAINT fk_options_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)

CREATE TABLE training_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    first_try_accuracy FLOAT NOT NULL DEFAULT 0.0,
    llm_clinical_draft TEXT NULL,
    therapist_validated_notes TEXT NULL,
    is_approved_by_therapist BOOLEAN NOT NULL DEFAULT FALSE,
    parent_mission_text TEXT NULL,
    CONSTRAINT fk_sessions_child
        FOREIGN KEY (child_id) REFERENCES children(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)

CREATE TABLE exercise_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    exercise_id INT NOT NULL,
    selected_option_id INT NULL,
    trials_count INT NOT NULL DEFAULT 1,
    is_first_try_correct BOOLEAN NOT NULL DEFAULT FALSE,
    response_time_seconds INT NOT NULL DEFAULT 0,
    used_clue_face BOOLEAN NOT NULL DEFAULT FALSE,
    used_clue_voice BOOLEAN NOT NULL DEFAULT FALSE,
    used_clue_situation BOOLEAN NOT NULL DEFAULT FALSE,
    used_grandpa_llm_hint BOOLEAN NOT NULL DEFAULT FALSE,
    grandpa_hint_generated TEXT NULL,
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempts_session
        FOREIGN KEY (session_id) REFERENCES training_sessions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_attempts_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_attempts_option
        FOREIGN KEY (selected_option_id) REFERENCES exercise_options(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
)