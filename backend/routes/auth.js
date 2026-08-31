const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}

// Register
router.post('/register',
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/).withMessage('Password must contain uppercase, lowercase and number'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const { name, email, password, phone, address } = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const hash = bcrypt.hashSync(password, 12);
    const result = db.prepare('INSERT INTO users (name,email,password,role,phone,address) VALUES (?,?,?,?,?,?)').run(name, email, hash, 'customer', phone || null, address || null);
    const user = db.prepare('SELECT id,name,email,role,phone,address,created_at FROM users WHERE id=?').get(result.lastInsertRowid);
    const token = signToken(user);
    res.status(201).json({ message: 'Registered successfully', user, token });
  }
);

// Login
router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid credentials' });
    const safe = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address, created_at: user.created_at };
    const token = signToken(safe);
    res.json({ message: 'Login successful', user: safe, token });
  }
);

router.get('/profile', authenticate, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,phone,address,created_at FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

router.put('/profile', authenticate,
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  (req, res) => {
    const { name, phone, address } = req.body;
    const fields = []; const vals = [];
    if (name !== undefined) { fields.push('name=?'); vals.push(name); }
    if (phone !== undefined) { fields.push('phone=?'); vals.push(phone); }
    if (address !== undefined) { fields.push('address=?'); vals.push(address); }
    if (!fields.length) return res.status(400).json({ message: 'No fields to update' });
    vals.push(req.user.id);
    db.prepare(`UPDATE users SET ${fields.join(',')} WHERE id=?`).run(...vals);
    const user = db.prepare('SELECT id,name,email,role,phone,address,created_at FROM users WHERE id=?').get(req.user.id);
    res.json({ message: 'Profile updated', user });
  }
);

router.put('/change-password', authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const { currentPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(400).json({ message: 'Current password incorrect' });
    const hash = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, req.user.id);
    res.json({ message: 'Password changed successfully' });
  }
);

module.exports = router;
