const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { paginate } = require('../utils/helpers');

const router = express.Router();

// GET /api/reviews?vehicle_id=&booking_id=&user_id=&page=&limit=
router.get('/', (req, res) => {
  const { vehicle_id, booking_id, user_id, page, limit } = req.query;
  const { page: p, limit: l, offset } = paginate(page, limit);
  let where = []; let params = [];
  if (vehicle_id) { where.push('r.vehicle_id=?'); params.push(vehicle_id); }
  if (booking_id) { where.push('r.booking_id=?'); params.push(booking_id); }
  if (user_id) { where.push('r.user_id=?'); params.push(user_id); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const count = db.prepare(`SELECT COUNT(*) as c FROM reviews r ${whereSql}`).get(...params).c;
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, v.model as vehicle_model, br.name as brand_name
    FROM reviews r
    JOIN users u ON r.user_id=u.id
    JOIN vehicles v ON r.vehicle_id=v.id
    JOIN brands br ON v.brand_id=br.id
    ${whereSql}
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, l, offset);
  // average for vehicle if filtered
  let avg = null;
  if (vehicle_id) {
    const a = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE vehicle_id=?').get(vehicle_id);
    avg = { avg: a.avg ? Number(a.avg.toFixed(1)) : null, count: a.cnt };
  }
  res.json({ reviews, avg, pagination: { total: count, page: p, limit: l, totalPages: Math.ceil(count/l) } });
});

// GET /api/reviews/vehicle/:id/summary  -> avg rating
router.get('/vehicle/:id/summary', (req, res) => {
  const a = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE vehicle_id=?').get(req.params.id);
  const recent = db.prepare(`
    SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id=u.id
    WHERE r.vehicle_id=? ORDER BY r.created_at DESC LIMIT 3
  `).all(req.params.id);
  res.json({ vehicle_id: req.params.id, avg: a.avg ? Number(a.avg.toFixed(1)) : null, count: a.cnt, recent });
});

// POST /api/reviews  (auth required)
router.post('/', authenticate,
  body('vehicle_id').isInt(),
  body('rating').isInt({min:1,max:5}),
  body('booking_id').optional().isInt(),
  body('comment').optional().isString().trim().isLength({max:500}),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { vehicle_id, booking_id, rating, comment } = req.body;
    const vehicle = db.prepare('SELECT id FROM vehicles WHERE id=?').get(vehicle_id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (booking_id) {
      const booking = db.prepare('SELECT * FROM bookings WHERE id=?').get(booking_id);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not your booking' });
      if (booking.status !== 'completed' && req.user.role !== 'admin') return res.status(400).json({ message: 'Can only review completed bookings' });
      if (booking.vehicle_id !== parseInt(vehicle_id)) return res.status(400).json({ message: 'Vehicle does not match booking' });
    }
    try {
      const r = db.prepare('INSERT INTO reviews (user_id, vehicle_id, booking_id, rating, comment) VALUES (?,?,?,?,?)')
        .run(req.user.id, vehicle_id, booking_id||null, rating, comment||null);
      const review = db.prepare('SELECT * FROM reviews WHERE id=?').get(r.lastInsertRowid);
      res.status(201).json({ message: 'Review submitted', review });
    } catch(e){
      if(e.message.includes('UNIQUE')) return res.status(409).json({ message: 'You already reviewed this booking' });
      throw e;
    }
  }
);

router.delete('/:id', authenticate, (req, res) => {
  const review = db.prepare('SELECT * FROM reviews WHERE id=?').get(req.params.id);
  if(!review) return res.status(404).json({ message: 'Review not found' });
  if(review.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
  db.prepare('DELETE FROM reviews WHERE id=?').run(req.params.id);
  res.json({ message: 'Review deleted' });
});

module.exports = router;
