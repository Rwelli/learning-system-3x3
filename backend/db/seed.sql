-- حذف البيانات القديمة (بالترتيب الصحيح)
DELETE FROM student_progress;
DELETE FROM test_results;
DELETE FROM questions;
DELETE FROM tests;
DELETE FROM systems;
DELETE FROM theory;
DELETE FROM users;
DELETE FROM groups;

-- إعادة تعيين التسلسل (sequence)
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE groups_id_seq RESTART WITH 1;
ALTER SEQUENCE systems_id_seq RESTART WITH 1;
ALTER SEQUENCE tests_id_seq RESTART WITH 1;
ALTER SEQUENCE questions_id_seq RESTART WITH 1;
ALTER SEQUENCE test_results_id_seq RESTART WITH 1;
ALTER SEQUENCE theory_id_seq RESTART WITH 1;

-- 1. اضافة المجموعات
INSERT INTO groups (name) VALUES ('Group DINRb-21');
INSERT INTO groups (name) VALUES ('Group IVT-21');
INSERT INTO groups (name) VALUES ('Group DEEB12');

-- 2. اضافة المستخدمين
-- كلمة المرور للجميع: 123456
-- التشفير: $2a$10$N9qo8uLOickgx2ZMRZoMy.MrJkQvJqQvJqQvJqQvJqQvJqQvJqQ

INSERT INTO users (email, password_hash, full_name, role) VALUES 
('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJkQvJqQvJqQvJqQvJqQvJqQvJqQ', 'Admin', 'admin');

INSERT INTO users (email, password_hash, full_name, role) VALUES 
('teacher@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJkQvJqQvJqQvJqQvJqQvJqQvJqQ', 'Teacher Ivanov', 'teacher');

INSERT INTO users (email, password_hash, full_name, role) VALUES 
('student@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJkQvJqQvJqQvJqQvJqQvJqQvJqQ', 'Student Petrov', 'student');

-- 3. تحديث حقل teacher_id في المجموعات
UPDATE groups SET teacher_id = (SELECT id FROM users WHERE email = 'teacher@example.com') WHERE name = 'Group DINRb-21';
UPDATE groups SET teacher_id = (SELECT id FROM users WHERE email = 'teacher@example.com') WHERE name = 'Group IVT-21';
UPDATE groups SET teacher_id = (SELECT id FROM users WHERE email = 'teacher@example.com') WHERE name = 'Group DEEB12';

-- 4. تحديث group_id للطلاب
UPDATE users SET group_id = (SELECT id FROM groups WHERE name = 'Group DINRb-21') WHERE email = 'student@example.com';

-- 5. اضافة الانظمة (المعادلات)
INSERT INTO systems (a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, solution_x, solution_y, solution_z, difficulty, created_by) 
VALUES (2, 1, -1, 8, -3, -1, 2, -11, -2, 1, 2, -3, 1, 2, 3, 2, (SELECT id FROM users WHERE email = 'teacher@example.com'));

INSERT INTO systems (a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, solution_x, solution_y, solution_z, difficulty, created_by) 
VALUES (1, 1, 1, 6, 1, -1, 1, 2, 2, 1, -1, 3, 1, 2, 3, 1, (SELECT id FROM users WHERE email = 'teacher@example.com'));

INSERT INTO systems (a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, solution_x, solution_y, solution_z, difficulty, created_by) 
VALUES (2, 3, 1, 13, 1, 2, 3, 14, 3, 1, 2, 12, 2, 3, 1, 2, (SELECT id FROM users WHERE email = 'teacher@example.com'));

-- 6. اضافة الاختبارات
INSERT INTO tests (title, description, start_date, end_date, created_by) 
VALUES ('Test 3x3 Systems', 'Solving linear systems using Cramer rule', '2024-01-01', '2025-12-31', (SELECT id FROM users WHERE email = 'teacher@example.com'));

INSERT INTO tests (title, description, start_date, end_date, created_by) 
VALUES ('Hard Systems', 'Systems with parameters', '2024-01-01', '2025-12-31', (SELECT id FROM users WHERE email = 'teacher@example.com'));

-- 7. اضافة الاسئلة
INSERT INTO questions (test_id, system_id, points, order_index) 
VALUES (1, 1, 1, 1);

INSERT INTO questions (test_id, system_id, points, order_index) 
VALUES (1, 2, 1, 2);

INSERT INTO questions (test_id, system_id, points, order_index) 
VALUES (2, 3, 2, 1);

-- 8. اضافة المواد النظرية
INSERT INTO theory (title, content, order_index) 
VALUES ('Cramer Method', '<h2>Cramer Method</h2><p>Cramer method is used for solving linear systems...</p>', 1);

INSERT INTO theory (title, content, order_index) 
VALUES ('Gauss Method', '<h2>Gauss Method</h2><p>Gauss method reduces matrix to triangular form...</p>', 2);