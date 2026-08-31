const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { paginate, timeSlots } = require('../utils/helpers');

const router = express.Router();

// All routes require auth
router.use(authenticate);

// GET available slots
router.get('/available-slots', (req, res) => {
  const { showroom_id, booking_date } = req.query;
  if (!showroom_id || !booking_date) return res.status(400).json({ message: 'showroom_id and booking_date required' });
  const slots = timeSlots();
  const booked = db.prepare('SELECT time_slot FROM bookings WHERE showroom_id=? AND booking_date=? AND status != ?').all(showroom_id, booking_date, 'cancelled').map(r=>r.time_slot);
  const availableSlots = slots.filter(s => !booked.includes(s));
  res.json({ availableSlots, bookedSlots: booked, allSlots: slots });
});

// GET bookings (own or all if admin via query? But per spec, customer sees own, admin uses /admin/bookings)
router.get('/', (req, res) => {
  const { status, page, limit } = req.query;
  const { page: p, limit: l, offset } = paginate(page, limit);
  let where = []; let params = [];
  // normal users only see own
  if (req.user.role !== 'admin') {
    where.push('b.user_id=?'); params.push(req.user.id);
  }
  if (status) { where.push('b.status=?'); params.push(status); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const count = db.prepare(`SELECT COUNT(*) as c FROM bookings b ${whereSql}`).get(...params).c;
  const bookings = db.prepare(`
    SELECT b.*, v.model as vehicle_model, v.image_url as vehicle_image, v.price as vehicle_price,
           br.name as brand_name, s.name as showroom_name, s.address as showroom_address, s.city as showroom_city,
           u.name as user_name, u.email as user_email
    FROM bookings b
    JOIN vehicles v ON b.vehicle_id=v.id
    JOIN brands br ON v.brand_id=br.id
    JOIN showrooms s ON b.showroom_id=s.id
    JOIN users u ON b.user_id=u.id
    ${whereSql}
    ORDER BY b.booking_date DESC, b.time_slot DESC LIMIT ? OFFSET ?
  `).all(...params, l, offset);
  res.json({ bookings, pagination: { total: count, page: p, limit: l, totalPages: Math.ceil(count/l) } });
});

router.get('/:id', (req, res) => {
  const booking = db.prepare(`
    SELECT b.*, v.model as vehicle_model, v.image_url as vehicle_image, v.price as vehicle_price,
           br.name as brand_name, s.name as showroom_name, s.address as showroom_address, s.city as showroom_city, s.state as showroom_state,
           u.name as user_name, u.email as user_email
    FROM bookings b
    JOIN vehicles v ON b.vehicle_id=v.id
    JOIN brands br ON v.brand_id=br.id
    JOIN showrooms s ON b.showroom_id=s.id
    JOIN users u ON b.user_id=u.id
    WHERE b.id=?
  `).get(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (req.user.role !== 'admin' && booking.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
  res.json({ booking });
});

// POST create booking
router.post('/',
  body('vehicle_id').isInt(),
  body('booking_date').isISO8601(),
  body('time_slot').notEmpty(),
  body('showroom_id').optional().isInt(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    let { vehicle_id, showroom_id, booking_date, time_slot, notes } = req.body;

    // validate vehicle exists and available
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id=?').get(vehicle_id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.status !== 'available') return res.status(400).json({ message: 'Vehicle not available for booking' });

    // auto-assign showroom if not provided: find by brand_id
    if (!showroom_id) {
      const auto = db.prepare('SELECT id FROM showrooms WHERE brand_id=? LIMIT 1').get(vehicle.brand_id);
      if (!auto) return res.status(400).json({ message: 'No showroom found for this vehicle brand. Admin must create one.' });
      showroom_id = auto.id;
    } else {
      // validate showroom brand matches vehicle brand (optional but enforce)
      const showroom = db.prepare('SELECT * FROM showrooms WHERE id=?').get(showroom_id);
      if (!showroom) return res.status(404).json({ message: 'Showroom not found' });
      // allow any, but warn if mismatch - we allow but auto logic preferred
    }

    // validate date not in past
    const today = new Date(); today.setHours(0,0,0,0);
    const bd = new Date(booking_date);
    bd.setHours(0,0,0,0);
    if (bd < today) return res.status(400).json({ message: 'Cannot book past dates' });

    // validate time_slot is valid
    if (!timeSlots().includes(time_slot)) return res.status(400).json({ message: 'Invalid time_slot' });

    // check double booking
    try {
      const r = db.prepare('INSERT INTO bookings (user_id,vehicle_id,showroom_id,booking_date,time_slot,notes) VALUES (?,?,?,?,?,?)')
        .run(req.user.id, vehicle_id, showroom_id, booking_date, time_slot, notes||null);
      const booking = db.prepare('SELECT * FROM bookings WHERE id=?').get(r.lastInsertRowid);
      res.status(201).json({ message: 'Booking created', booking });
    } catch (e) {
      if (e.message.includes('UNIQUE')) {
        const existsVehicle = db.prepare('SELECT id FROM bookings WHERE vehicle_id=? AND showroom_id=? AND booking_date=? AND time_slot=? AND status!=?').get(vehicle_id, showroom_id, booking_date, time_slot, 'cancelled');
        if (existsVehicle) return res.status(409).json({ message: 'This time slot is already booked for this vehicle/showroom' });
        const existsUser = db.prepare('SELECT id FROM bookings WHERE user_id=? AND booking_date=? AND time_slot=? AND status!=?').get(req.user.id, booking_date, time_slot, 'cancelled');
        if (existsUser) return res.status(409).json({ message: 'You already have a booking at this date/time' });
        return res.status(409).json({ message: 'Booking conflict - slot already taken' });
      }
      throw e;
    }
  }
);

// PUT update status
router.put('/:id',
  body('status').isIn(['pending','approved','completed','cancelled']),
  (req, res) => {
    const booking = db.prepare('SELECT * FROM bookings WHERE id=?').get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // customer can only cancel own, admin can set any
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    const { status } = req.body;
    if (req.user.role !== 'admin') {
      // customers only allowed to cancel
      if (status !== 'cancelled') return res.status(403).json({ message: 'Customers can only cancel bookings' });
      if (booking.status === 'completed') return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }
    // status flow validation
    const validTransitions = {
      pending: ['approved','cancelled'],
      approved: ['completed','cancelled'],
      completed: [],
      cancelled: []
    };
    // admin also follows but allow pending->cancelled etc. We'll enforce unless admin wants force? Keep strict.
    if (booking.status !== status && !validTransitions[booking.status].includes(status)) {
      // allow admin to override? For now return error
      // but allow cancelled from any pending/approved
      if (!(booking.status === 'pending' && status === 'cancelled') && !(booking.status === 'approved' && status === 'cancelled') ) {
        // Check if same status
        if (booking.status !== status) {
          // For simplicity, allow if admin, otherwise error
          if (req.user.role !== 'admin') {
            return res.status(400).json({ message: `Invalid status transition ${booking.status} -> ${status}` });
          }
        }
      }
    }
    db.prepare('UPDATE bookings SET status=? WHERE id=?').run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM bookings WHERE id=?').get(req.params.id);
    res.json({ message: 'Booking updated', booking: updated });
  }
);

router.delete('/:id', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id=?').get(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (req.user.role !== 'admin' && booking.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
  db.prepare('DELETE FROM bookings WHERE id=?').run(req.params.id);
  res.json({ message: 'Booking deleted' });
});

module.exports = router;
