const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  let { city, state, brand_id } = req.query;
  let where = []; let params = [];
  if (city) { where.push('city=?'); params.push(city); }
  if (state) { where.push('state=?'); params.push(state); }
  if (brand_id) { where.push('brand_id=?'); params.push(brand_id); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`SELECT s.*, b.name as brand_name FROM showrooms s LEFT JOIN brands b ON s.brand_id=b.id ${whereSql} ORDER BY s.name`).all(...params);
  res.json({ showrooms: rows });
});

router.get('/cities', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT city FROM showrooms ORDER BY city').all();
  res.json({ cities: rows.map(r=>r.city) });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT s.*, b.name as brand_name FROM showrooms s LEFT JOIN brands b ON s.brand_id=b.id WHERE s.id=?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Showroom not found' });
  res.json({ showroom: row });
});

router.post('/', authenticate, authorizeAdmin,
  body('name').trim().notEmpty(),
  body('address').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, brand_id, address, city, state, phone, email, opening_time, closing_time } = req.body;
    const r = db.prepare(`INSERT INTO showrooms (name,brand_id,address,city,state,phone,email,opening_time,closing_time) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(name, brand_id||null, address, city, state, phone||null, email||null, opening_time||'09:00:00', closing_time||'18:00:00');
    const showroom = db.prepare('SELECT * FROM showrooms WHERE id=?').get(r.lastInsertRowid);
    res.status(201).json({ message: 'Showroom created', showroom });
  }
);

router.put('/:id', authenticate, authorizeAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM showrooms WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Showroom not found' });
  const allowed = ['name','brand_id','address','city','state','phone','email','opening_time','closing_time'];
  const sets=[]; const vals=[];
  for (const k of allowed) if (req.body[k]!==undefined){ sets.push(`${k}=?`); vals.push(req.body[k]); }
  if (!sets.length) return res.status(400).json({ message: 'No fields to update' });
  vals.push(req.params.id);
  db.prepare(`UPDATE showrooms SET ${sets.join(',')} WHERE id=?`).run(...vals);
  const showroom = db.prepare('SELECT * FROM showrooms WHERE id=?').get(req.params.id);
  res.json({ message: 'Showroom updated', showroom });
});

router.delete('/:id', authenticate, authorizeAdmin, (req, res) => {
  const r = db.prepare('DELETE FROM showrooms WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ message: 'Showroom not found' });
  res.json({ message: 'Showroom deleted' });
});

module.exports = router;
