const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  // Also check backend/database.sqlite path
  let schema;
  if (fs.existsSync(path.join(__dirname, '../schema.sql'))) {
    schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
  } else if (fs.existsSync(path.join(__dirname, '../../database/schema.sql'))) {
    schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
  } else {
    // inline schema fallback
    schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')),
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL CHECK(category IN ('car','bike')),
      logo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL,
      model TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('car','bike')),
      price REAL NOT NULL,
      image_url TEXT,
      horsepower INTEGER,
      engine TEXT,
      fuel_type TEXT,
      transmission TEXT,
      mileage TEXT,
      top_speed TEXT,
      colors TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','unavailable','maintenance')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS showrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand_id INTEGER,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      opening_time TEXT DEFAULT '09:00:00',
      closing_time TEXT DEFAULT '18:00:00',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      showroom_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','completed','cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (showroom_id) REFERENCES showrooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
      UNIQUE(vehicle_id, showroom_id, booking_date, time_slot),
      UNIQUE(user_id, booking_date, time_slot)
    );
    `;
  }
  db.exec(schema);
  console.log('Database schema initialized');
}

module.exports = { db, initDb };
