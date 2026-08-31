# ATDP — Automobile Test Drive & Showroom Booking Portal

Full-stack portal for browsing vehicles and booking test drives in **Navi Mumbai, Maharashtra, India**. Prices in **INR**, showrooms auto-assigned by brand, 9 daily time slots.

Inspired by **Aston Martin design system** — racing-green palette, cinematic photography, light display typography (weight 300), phasing preloader.

## Features
- 24 vehicles across 10 brands (Maruti to Mercedes-Benz) with real photos & Navi Mumbai on-road pricing
- 10 brand-linked showrooms (Vashi, Nerul, Kharghar, Airoli, Belapur, Seawoods, etc.)
- JWT auth (customer/admin), bcrypt hashing, role-based access
- Booking wizard: auto-showroom, future dates only, real-time slot availability, no double-booking
- Customer dashboard + Admin dashboard (Charts, inventory, user & booking management)
- Preloader phasing animation: car logo + ATDP, 1s visible then 1s fade (Aston Martin-like)

## Tech Stack
- **Frontend:** HTML5, CSS3 (Aston Martin tokens), Vanilla JS, Font Awesome, Chart.js
- **Backend:** Node.js + Express + SQLite (better-sqlite3), JWT, bcryptjs, express-validator, helmet, morgan, rate-limit
- **Database:** SQLite — 5 tables: users, brands, vehicles, showrooms, bookings

## Quick Start

### Backend
```bash
cd backend
npm install
node seed.js   # seeds 10 brands, 10 showrooms, 24 vehicles, 2 users
node server.js # http://localhost:5000
```

### Frontend
Served statically by backend at `http://localhost:5000/` — or open `frontend/index.html` via `npx serve`.

## Demo Credentials
- Customer: `john@example.com / John@123`
- Admin: `admin@autoportal.com / Admin@123`

## API
- `POST /api/auth/register` `POST /api/auth/login` `GET /api/auth/profile`
- `GET /api/vehicles?category=&brand_id=&search=&page=&limit=` `GET /api/vehicles/:id` `GET /api/vehicles/brands`
- `GET /api/showrooms` `GET /api/bookings/available-slots?showroom_id=&booking_date=` `POST /api/bookings`
- `GET /api/admin/dashboard` `GET /api/admin/users` `GET /api/admin/bookings`

## Design System
See `design1.md` — Aston Martin tokens (colors, typography, spacing, components) fully implemented in `frontend/css/styles.css`.

## Structure
```
AUTOMOBILE/
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── routes/{auth,vehicles,showrooms,bookings,admin}.js
│   ├── seed.js
│   └── package.json
└── frontend/
    ├── index.html, vehicles.html, vehicle.html, login.html, register.html, dashboard.html, admin.html
    ├── css/styles.css
    └── js/{api.js,app.js}
```

© 2026 ATDP — Navi Mumbai • INR • 09:00–18:00
