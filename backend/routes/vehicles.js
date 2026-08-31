const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { paginate } = require('../utils/helpers');

const router = express.Router();

// GET /api/vehicles/brands -> must be before /:id
router.get('/brands', (req, res) => {
  const brands = db.prepare('SELECT * FROM brands ORDER BY name').all();
  res.json({ brands });
});

// POST /api/vehicles/brands
router.post('/brands', authenticate, authorizeAdmin,
  body('name').trim().notEmpty(),
  body('category').isIn(['car','bike']),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const { name, category, logo_url } = req.body;
    try {
      const r = db.prepare('INSERT INTO brands (name,category,logo_url) VALUES (?,?,?)').run(name, category, logo_url || null);
      const brand = db.prepare('SELECT * FROM brands WHERE id=?').get(r.lastInsertRowid);
      res.status(201).json({ message: 'Brand created', brand });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(409).json({ message: 'Brand already exists' });
      throw e;
    }
  }
);

// GET /api/vehicles
router.get('/', (req, res) => {
  let { category, brand_id, min_price, max_price, status, search, page, limit } = req.query;
  const { page: p, limit: l, offset } = paginate(page, limit);
  let where = []; let params = [];
  if (category) { where.push('v.category=?'); params.push(category); }
  if (brand_id) { where.push('v.brand_id=?'); params.push(brand_id); }
  if (min_price) { where.push('v.price>=?'); params.push(Number(min_price)); }
  if (max_price) { where.push('v.price<=?'); params.push(Number(max_price)); }
  if (status) { where.push('v.status=?'); params.push(status); }
  if (search) { where.push('(v.model LIKE ? OR b.name LIKE ?)'); params.push(`%${search}%`,`%${search}%`); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const count = db.prepare(`SELECT COUNT(*) as c FROM vehicles v JOIN brands b ON v.brand_id=b.id ${whereSql}`).get(...params).c;
  const vehicles = db.prepare(`
    SELECT v.*, b.name as brand_name, b.logo_url as brand_logo
    FROM vehicles v JOIN brands b ON v.brand_id=b.id
    ${whereSql}
    ORDER BY v.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, l, offset);
  // parse colors JSON
  vehicles.forEach(v=>{
    try{ v.colors = JSON.parse(v.colors); }catch{ v.colors = v.colors ? [v.colors] : []; }
  });
  res.json({ vehicles, pagination: { total: count, page: p, limit: l, totalPages: Math.ceil(count/l) } });
});

// GET /api/vehicles/:id
router.get('/:id', (req, res) => {
  const v = db.prepare(`
    SELECT v.*, b.name as brand_name, b.logo_url as brand_logo FROM vehicles v
    JOIN brands b ON v.brand_id=b.id WHERE v.id=?
  `).get(req.params.id);
  if (!v) return res.status(404).json({ message: 'Vehicle not found' });
  try{ v.colors = JSON.parse(v.colors); }catch{ v.colors = v.colors ? [v.colors] : []; }
  // find auto showroom
  const showroom = db.prepare('SELECT * FROM showrooms WHERE brand_id=? LIMIT 1').get(v.brand_id);
  v.auto_showroom = showroom || null;
  res.json({ vehicle: v });
});

// POST /api/vehicles
router.post('/', authenticate, authorizeAdmin,
  body('brand_id').isInt(),
  body('model').trim().notEmpty(),
  body('category').isIn(['car','bike']),
  body('price').isFloat({ gt: 0 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { brand_id, model, category, price, image_url, horsepower, engine, fuel_type, transmission, mileage, top_speed, colors, description, status } = req.body;
    const brand = db.prepare('SELECT id FROM brands WHERE id=?').get(brand_id);
    if (!brand) return res.status(400).json({ message: 'Invalid brand_id' });
    const colorsStr = colors ? (typeof colors === 'string' ? colors : JSON.stringify(colors)) : null;
    const r = db.prepare(`
      INSERT INTO vehicles (brand_id,model,category,price,image_url,horsepower,engine,fuel_type,transmission,mileage,top_speed,colors,description,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(brand_id, model, category, price, image_url||null, horsepower||null, engine||null, fuel_type||null, transmission||null, mileage||null, top_speed||null, colorsStr, description||null, status||'available');
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id=?').get(r.lastInsertRowid);
    res.status(201).json({ message: 'Vehicle created', vehicle });
  }
);

// PUT /api/vehicles/:id
router.put('/:id', authenticate, authorizeAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM vehicles WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Vehicle not found' });
  const allowed = ['brand_id','model','category','price','image_url','horsepower','engine','fuel_type','transmission','mileage','top_speed','colors','description','status'];
  const sets = []; const vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      let v = req.body[k];
      if (k==='colors' && v && typeof v !== 'string') v = JSON.stringify(v);
      sets.push(`${k}=?`); vals.push(v);
    }
  }
  if (!sets.length) return res.status(400).json({ message: 'No fields to update' });
  vals.push(req.params.id);
  db.prepare(`UPDATE vehicles SET ${sets.join(',')} WHERE id=?`).run(...vals);
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id=?').get(req.params.id);
  res.json({ message: 'Vehicle updated', vehicle });
});

// DELETE
router.delete('/:id', authenticate, authorizeAdmin, (req, res) => {
  const r = db.prepare('DELETE FROM vehicles WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ message: 'Vehicle not found' });
  res.json({ message: 'Vehicle deleted' });
});

module.exports = router;
