const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db/config');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'linear-systems-secret-key-2026';

app.use(cors());
app.use(express.json());

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};

// ===================== AUTH ROUTES =====================

app.post('/api/register', async (req, res) => {
    try {
        const { email, password, full_name, role = 'student', group_id } = req.body;
        
        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Email, password and full_name are required' });
        }
        
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const password_hash = await bcrypt.hash(password, 10);
        
        const result = await db.query(
            'INSERT INTO users (email, password_hash, full_name, role, group_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, group_id',
            [email, password_hash, full_name, role, group_id || null]
        );
        
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, group_id: user.group_id },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/profile', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, full_name, role, group_id, phone, bio, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===================== UPDATE PROFILE ROUTE =====================

app.put('/api/profile', authenticate, async (req, res) => {
    try {
        const { full_name, phone, bio } = req.body;
        const userId = req.user.id;
        
        const result = await db.query(
            `UPDATE users 
             SET full_name = COALESCE($1, full_name),
                 phone = COALESCE($2, phone),
                 bio = COALESCE($3, bio)
             WHERE id = $4 
             RETURNING id, email, full_name, role, phone, bio, created_at`,
            [full_name, phone, bio, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===================== THEORY ROUTES =====================

app.get('/api/theory', authenticate, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM theory ORDER BY order_index');
        res.json(result.rows);
    } catch (err) {
        console.error('Theory error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===================== SYSTEMS ROUTES =====================

app.get('/api/systems', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT s.*, u.full_name as created_by_name FROM systems s LEFT JOIN users u ON s.created_by = u.id ORDER BY s.id'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get systems error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/system/create', authenticate, authorize('teacher', 'admin'), async (req, res) => {
    try {
        const { a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, solution_x, solution_y, solution_z, difficulty = 1 } = req.body;
        
        const result = await db.query(
            `INSERT INTO systems (a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, solution_x, solution_y, solution_z, difficulty, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             RETURNING *`,
            [a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, solution_x, solution_y, solution_z, difficulty, req.user.id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create system error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/system/:id', authenticate, authorize('teacher', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, solution_x, solution_y, solution_z, difficulty } = req.body;
        
        const result = await db.query(
            `UPDATE systems SET 
             a1 = COALESCE($1, a1), b1 = COALESCE($2, b1), c1 = COALESCE($3, c1), d1 = COALESCE($4, d1),
             a2 = COALESCE($5, a2), b2 = COALESCE($6, b2), c2 = COALESCE($7, c2), d2 = COALESCE($8, d2),
             a3 = COALESCE($9, a3), b3 = COALESCE($10, b3), c3 = COALESCE($11, c3), d3 = COALESCE($12, d3),
             solution_x = COALESCE($13, solution_x), solution_y = COALESCE($14, solution_y), solution_z = COALESCE($15, solution_z),
             difficulty = COALESCE($16, difficulty)
             WHERE id = $17 RETURNING *`,
            [a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, solution_x, solution_y, solution_z, difficulty, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'System not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update system error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/system/:id', authenticate, authorize('teacher', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM systems WHERE id = $1', [id]);
        res.json({ message: 'System deleted' });
    } catch (err) {
        console.error('Delete system error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/system/check', authenticate, async (req, res) => {
    try {
        const { system_id, user_x, user_y, user_z } = req.body;
        
        const systemResult = await db.query('SELECT * FROM systems WHERE id = $1', [system_id]);
        if (systemResult.rows.length === 0) {
            return res.status(404).json({ error: 'System not found' });
        }
        
        const system = systemResult.rows[0];
        
        const eq1 = (parseFloat(system.a1) * user_x + parseFloat(system.b1) * user_y + parseFloat(system.c1) * user_z);
        const eq2 = (parseFloat(system.a2) * user_x + parseFloat(system.b2) * user_y + parseFloat(system.c2) * user_z);
        const eq3 = (parseFloat(system.a3) * user_x + parseFloat(system.b3) * user_y + parseFloat(system.c3) * user_z);
        
        const tol = 0.001;
        const isCorrect = 
            Math.abs(eq1 - parseFloat(system.d1)) < tol &&
            Math.abs(eq2 - parseFloat(system.d2)) < tol &&
            Math.abs(eq3 - parseFloat(system.d3)) < tol;
        
        res.json({
            isCorrect,
            equations: [
                { expected: parseFloat(system.d1), calculated: eq1 },
                { expected: parseFloat(system.d2), calculated: eq2 },
                { expected: parseFloat(system.d3), calculated: eq3 }
            ],
            userAnswer: { x: user_x, y: user_y, z: user_z },
            correctAnswer: { x: parseFloat(system.solution_x), y: parseFloat(system.solution_y), z: parseFloat(system.solution_z) }
        });
    } catch (err) {
        console.error('Check system error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/system/random', authenticate, async (req, res) => {
    try {
        const { difficulty } = req.query;
        let query = 'SELECT * FROM systems';
        let params = [];
        
        if (difficulty) {
            query += ' WHERE difficulty = $1';
            params.push(difficulty);
        }
        
        query += ' ORDER BY RANDOM() LIMIT 1';
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No systems found' });
        }
        
        const system = result.rows[0];
        res.json({
            id: system.id,
            a1: system.a1, b1: system.b1, c1: system.c1, d1: system.d1,
            a2: system.a2, b2: system.b2, c2: system.c2, d2: system.d2,
            a3: system.a3, b3: system.b3, c3: system.c3, d3: system.d3,
            difficulty: system.difficulty
        });
    } catch (err) {
        console.error('Random system error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/system/generate', authenticate, authorize('teacher', 'admin'), async (req, res) => {
    const { difficulty = 1 } = req.body;
    let x, y, z;
    switch (parseInt(difficulty)) {
        case 1: x = 1; y = 2; z = 3; break;
        case 2: x = 2; y = 3; z = 1; break;
        case 3: x = 1; y = 1; z = 1; break;
        default: x = 1; y = 1; z = 1;
    }
    
    const a1 = Math.floor(Math.random() * 5) + 1;
    const b1 = Math.floor(Math.random() * 5) + 1;
    const c1 = Math.floor(Math.random() * 5) + 1;
    const d1 = a1 * x + b1 * y + c1 * z;
    
    const a2 = Math.floor(Math.random() * 5) + 1;
    const b2 = Math.floor(Math.random() * 5) + 1;
    const c2 = Math.floor(Math.random() * 5) + 1;
    const d2 = a2 * x + b2 * y + c2 * z;
    
    const a3 = Math.floor(Math.random() * 5) + 1;
    const b3 = Math.floor(Math.random() * 5) + 1;
    const c3 = Math.floor(Math.random() * 5) + 1;
    const d3 = a3 * x + b3 * y + c3 * z;
    
    const result = await db.query(
        `INSERT INTO systems (a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, solution_x, solution_y, solution_z, difficulty, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, x, y, z, difficulty, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
});

// ===================== TESTS ROUTES =====================

app.get('/api/tests', authenticate, async (req, res) => {
    try {
        const now = new Date();
        let query = 'SELECT t.*, u.full_name as created_by_name FROM tests t LEFT JOIN users u ON t.created_by = u.id';
        
        if (req.user.role === 'student') {
            query += ` WHERE (t.start_date IS NULL OR t.start_date <= $1) AND (t.end_date IS NULL OR t.end_date >= $1)`;
        }
        
        query += ' ORDER BY t.id';
        
        const result = await db.query(query, req.user.role === 'student' ? [now] : []);
        res.json(result.rows);
    } catch (err) {
        console.error('Get tests error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/test/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
        if (testResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found' });
        }
        
        const questionsResult = await db.query(
            `SELECT q.*, s.a1, s.b1, s.c1, s.d1, s.a2, s.b2, s.c2, s.d2, s.a3, s.b3, s.c3, s.d3, s.difficulty
             FROM questions q
             JOIN systems s ON q.system_id = s.id
             WHERE q.test_id = $1
             ORDER BY q.order_index`,
            [id]
        );
        
        const questions = questionsResult.rows.map(q => ({
            id: q.id,
            system_id: q.system_id,
            points: q.points,
            order_index: q.order_index,
            difficulty: q.difficulty,
            system: {
                a1: q.a1, b1: q.b1, c1: q.c1, d1: q.d1,
                a2: q.a2, b2: q.b2, c2: q.c2, d2: q.d2,
                a3: q.a3, b3: q.b3, c3: q.c3, d3: q.d3
            }
        }));
        
        res.json({
            test: testResult.rows[0],
            questions,
            totalPoints: questions.reduce((sum, q) => sum + q.points, 0)
        });
    } catch (err) {
        console.error('Get test error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/tests/create', authenticate, authorize('teacher', 'admin'), async (req, res) => {
    try {
        const { title, description, start_date, end_date } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const result = await db.query(
            'INSERT INTO tests (title, description, start_date, end_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, start_date, end_date, req.user.id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create test error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/test/:id', authenticate, authorize('teacher', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, start_date, end_date } = req.body;
        
        const result = await db.query(
            `UPDATE tests SET 
             title = COALESCE($1, title), 
             description = COALESCE($2, description), 
             start_date = $3, 
             end_date = $4
             WHERE id = $5 RETURNING *`,
            [title, description, start_date, end_date, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update test error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/test/:id', authenticate, authorize('teacher', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM tests WHERE id = $1', [id]);
        res.json({ message: 'Test deleted' });
    } catch (err) {
        console.error('Delete test error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/test/:testId/complete', authenticate, async (req, res) => {
    try {
        const { testId } = req.params;
        const { score, max_score } = req.body;
        
        const result = await db.query(
            `INSERT INTO test_results (user_id, test_id, score, max_score) VALUES ($1, $2, $3, $4) 
             ON CONFLICT (user_id, test_id) DO UPDATE SET score = $3, max_score = $4, completed_at = NOW()
             RETURNING *`,
            [req.user.id, testId, score, max_score]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Complete test error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===================== RESULTS ROUTES =====================

app.get('/api/teacher/results', authenticate, authorize('teacher', 'admin'), async (req, res) => {
    try {
        const result = await db.query(
            `SELECT tr.*, u.full_name, u.email, t.title as test_title
             FROM test_results tr
             JOIN users u ON tr.user_id = u.id
             JOIN tests t ON tr.test_id = t.id
             ORDER BY tr.completed_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get results error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===================== ADMIN ROUTES =====================

app.get('/api/admin/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const result = await db.query(
            'SELECT u.*, g.name as group_name FROM users u LEFT JOIN groups g ON u.group_id = g.id ORDER BY u.id'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { email, password, full_name, role, group_id } = req.body;
        
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const password_hash = await bcrypt.hash(password, 10);
        
        const result = await db.query(
            'INSERT INTO users (email, password_hash, full_name, role, group_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, group_id',
            [email, password_hash, full_name, role, group_id || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/admin/users/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { email, full_name, role, group_id } = req.body;
        
        const result = await db.query(
            `UPDATE users SET 
             email = COALESCE($1, email), 
             full_name = COALESCE($2, full_name), 
             role = COALESCE($3, role), 
             group_id = $4
             WHERE id = $5 RETURNING *`,
            [email, full_name, role, group_id, id]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/admin/users/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/groups', authenticate, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM groups ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error('Get groups error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/groups', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name } = req.body;
        const result = await db.query('INSERT INTO groups (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create group error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});
// ===================== UPDATE PROFILE ROUTE =====================

app.put('/api/profile', authenticate, async (req, res) => {
    try {
        const { full_name, phone, bio } = req.body;
        const userId = req.user.id;
        
        console.log('Updating profile for user:', userId);
        console.log('Data:', { full_name, phone, bio });
        
        const result = await db.query(
            `UPDATE users 
             SET full_name = COALESCE($1, full_name),
                 phone = COALESCE($2, phone),
                 bio = COALESCE($3, bio)
             WHERE id = $4 
             RETURNING id, email, full_name, role, phone, bio, created_at`,
            [full_name, phone, bio, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('Profile updated successfully');
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;