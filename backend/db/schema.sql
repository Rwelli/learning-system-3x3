-- PostgreSQL Schema for Linear Systems Training App

-- Drop existing tables if they exist (بالترتيب الصحيح)
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS systems CASCADE;
DROP TABLE IF EXISTS theory CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Groups table (بدون teacher_id في البداية)
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إضافة teacher_id إلى groups بعد إنشاء users
ALTER TABLE groups ADD COLUMN teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Systems of equations table
CREATE TABLE systems (
    id SERIAL PRIMARY KEY,
    a1 DECIMAL(10, 4) NOT NULL,
    b1 DECIMAL(10, 4) NOT NULL,
    c1 DECIMAL(10, 4) NOT NULL,
    d1 DECIMAL(10, 4) NOT NULL,
    a2 DECIMAL(10, 4) NOT NULL,
    b2 DECIMAL(10, 4) NOT NULL,
    c2 DECIMAL(10, 4) NOT NULL,
    d2 DECIMAL(10, 4) NOT NULL,
    a3 DECIMAL(10, 4) NOT NULL,
    b3 DECIMAL(10, 4) NOT NULL,
    c3 DECIMAL(10, 4) NOT NULL,
    d3 DECIMAL(10, 4) NOT NULL,
    solution_x DECIMAL(10, 4) NOT NULL,
    solution_y DECIMAL(10, 4) NOT NULL,
    solution_z DECIMAL(10, 4) NOT NULL,
    difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tests table
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions (link between tests and systems)
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 1 CHECK (points > 0),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test results
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    score DECIMAL(10, 2) DEFAULT 0,
    max_score DECIMAL(10, 2) DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Theory content table
CREATE TABLE theory (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student progress tracking
CREATE TABLE student_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
    solved BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    solved_at TIMESTAMP,
    UNIQUE(user_id, system_id)
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_group ON users(group_id);
CREATE INDEX idx_systems_difficulty ON systems(difficulty);
CREATE INDEX idx_tests_dates ON tests(start_date, end_date);
CREATE INDEX idx_questions_test ON questions(test_id);
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_test ON test_results(test_id);
CREATE INDEX idx_student_progress_user ON student_progress(user_id);

-- إضافة حقول التصنيف التلقائي إلى جدول الاختبارات
ALTER TABLE tests ADD COLUMN IF NOT EXISTS avg_time FLOAT DEFAULT 0;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS avg_question_difficulty FLOAT DEFAULT 0;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS auto_difficulty INT DEFAULT 1;