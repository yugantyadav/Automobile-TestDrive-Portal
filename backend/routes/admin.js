const express = require('express');
const { db } = require('../config/db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { paginate } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate, authorizeAdmin);

router.get('/dashboard', (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const customers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='customer'").get().c;
  const vehicles = db.prepare('SELECT COUNT(*) as c FROM vehicles').get().c;
  const showrooms = db.prepare('SELECT COUNT(*) as c FROM showrooms').get().c;
  const bookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
  const pending = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status='pending'").get().c;
  const approved = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status='approved'").get().c;
  const completed = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status='completed'").get().c;
  const cancelled = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status='cancelled'").get().c;
  const recentBookings = db.prepare(`
    SELECT b.*, v.model as vehicle_model, br.name as brand_name, s.name as showroom_name, u.name as user_name
    FROM bookings b
    JOIN vehicles v ON b.vehicle_id=v.id
    JOIN brands br ON v.brand_id=br.id
    JOIN showrooms s ON b.showroom_id=s.id
    JOIN users u ON b.user_id=u.id
    ORDER BY b.created_at DESC LIMIT 5
  `).all();
  const brandInventory = db.prepare(`
    SELECT br.name as brand, COUNT(v.id) as count FROM brands br LEFT JOIN vehicles v ON v.brand_id=br.id GROUP BY br.id
  `).all();
  res.json({ users, customers, vehicles, showrooms, bookings, pending, approved, completed, cancelled, recentBookings, brandInventory });
});

router.get('/users', (req, res) => {
  const { role, search, page, limit } = req.query;
  const { page: p, limit: l, offset } = paginate(page, limit);
  let where=[]; let params=[];
  if (role) { where.push('role=?'); params.push(role); }
  if (search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`,`%${search}%`); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const count = db.prepare(`SELECT COUNT(*) as c FROM users ${whereSql}`).get(...params).c;
  const users = db.prepare(`SELECT id,name,email,role,phone,address,created_at FROM users ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, l, offset);
  res.json({ users, pagination: { total: count, page: p, limit: l, totalPages: Math.ceil(count/l) } });
});

router.get('/bookings', (req, res) => {
  const { status, page, limit } = req.query;
  const { page: p, limit: l, offset } = paginate(page, limit);
  let where=[]; let params=[];
  if (status) { where.push('b.status=?'); params.push(status); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const count = db.prepare(`SELECT COUNT(*) as c FROM bookings b ${whereSql}`).get(...params).c;
  const bookings = db.prepare(`
    SELECT b.*, v.model as vehicle_model, v.image_url as vehicle_image, br.name as brand_name, s.name as showroom_name, u.name as user_name, u.email as user_email
    FROM bookings b
    JOIN vehicles v ON b.vehicle_id=v.id
    JOIN brands br ON v.brand_id=br.id
    JOIN showrooms s ON b.showroom_id=s.id
    JOIN users u ON b.user_id=u.id
    ${whereSql}
    ORDER BY b.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, l, offset);
  res.json({ bookings, pagination: { total: count, page: p, limit: l, totalPages: Math.ceil(count/l) } });
});

router.get('/inventory', (req, res) => {
  const brandInventory = db.prepare(`SELECT br.name as brand, br.category, COUNT(v.id) as count FROM brands br LEFT JOIN vehicles v ON v.brand_id=br.id GROUP BY br.id`).all();
  const priceRanges = db.prepare(`SELECT MIN(price) as minPrice, MAX(price) as maxPrice, AVG(price) as avgPrice FROM vehicles`).get();
  const fuelTypes = db.prepare(`SELECT fuel_type as fuel, COUNT(*) as count FROM vehicles GROUP BY fuel_type`).all();
  res.json({ brandInventory, priceRanges, fuelTypes });
});

router.put('/users/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'User not found' });
  const allowed = ['name','email','role','phone','address'];
  const sets=[]; const vals=[];
  for (const k of allowed) if (req.body[k]!==undefined){ sets.push(`${k}=?`); vals.push(req.body[k]); }
  if (!sets.length) return res.status(400).json({ message: 'No fields' });
  vals.push(req.params.id);
  try {
    db.prepare(`UPDATE users SET ${sets.join(',')} WHERE id=?`).run(...vals);
  } catch(e){
    if (e.message.includes('UNIQUE')) return res.status(409).json({ message: 'Email already exists' });
    throw e;
  }
  const user = db.prepare('SELECT id,name,email,role,phone,address,created_at FROM users WHERE id=?').get(req.params.id);
  res.json({ message: 'User updated', user });
});

router.delete('/users/:id', (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ message: 'Cannot delete yourself' });
  const r = db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
});

module.exports = router;
