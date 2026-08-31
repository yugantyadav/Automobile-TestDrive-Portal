const bcrypt = require('bcryptjs');
const { db, initDb } = require('./config/db');

initDb();

// Clear existing
db.exec(`DELETE FROM bookings; DELETE FROM vehicles; DELETE FROM showrooms; DELETE FROM brands; DELETE FROM users;`);
try{ db.exec(`DELETE FROM sqlite_sequence;`);}catch{}

// Brands — logos from Wikimedia Commons (transparent PNG, demo use, verified 2026)
const brands = [
  { name: 'Maruti Suzuki', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Maruti_Suzuki_Logo.svg/400px-Maruti_Suzuki_Logo.svg.png' },
  { name: 'Hyundai', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_logo.svg/400px-Hyundai_logo.svg.png' },
  { name: 'Tata Motors', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tata_logo.svg/400px-Tata_logo.svg.png' },
  { name: 'Mahindra', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Mahindra_Rise_logo.svg/400px-Mahindra_Rise_logo.svg.png' },
  { name: 'Honda', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda_logo.png/400px-Honda_logo.png' },
  { name: 'Toyota', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/400px-Toyota_carlogo.svg.png' },
  { name: 'Kia', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Kia_logo.svg/400px-Kia_logo.svg.png' },
  { name: 'MG Motor', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/MG_Motor_logo.svg/400px-MG_Motor_logo.svg.png' },
  { name: 'BMW', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/400px-BMW.svg.png' },
  { name: 'Mercedes-Benz', category: 'car', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo.svg/300px-Mercedes-Logo.svg.png' },
];

const brandIds = {};
for (const b of brands) {
  const r = db.prepare('INSERT INTO brands (name,category,logo_url) VALUES (?,?,?)').run(b.name, b.category, b.logo_url);
  brandIds[b.name] = r.lastInsertRowid;
}

// Showrooms - Navi Mumbai locations (verified via ZigWheels dealer listings)
const showrooms = [
  { name: 'Maruti Suzuki Nexa - Vashi', brand: 'Maruti Suzuki', address: 'Plot No. 12, Sector 17, Vashi', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2784 1122', email: 'vashi@nexa-maruti.co.in' },
  { name: 'Hyundai Showroom - Nerul', brand: 'Hyundai', address: 'Sharayu Hyundai, Turbhe & Kamal Hyundai Airoli', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2770 3344', email: 'nerul@hyundai.co.in' },
  { name: 'Tata Motors - Kharghar', brand: 'Tata Motors', address: 'Central Park Road, Sector 21, Kharghar', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2774 5566', email: 'kharghar@tatamotors.co.in' },
  { name: 'Mahindra - Airoli', brand: 'Mahindra', address: 'Thane-Belapur Road, Airoli', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2789 7788', email: 'airoli@mahindra.co.in' },
  { name: 'Honda Cars - Panvel', brand: 'Honda', address: 'Old Mumbai-Pune Highway, Panvel', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2745 9900', email: 'panvel@honda.co.in' },
  { name: 'Toyota - CBD Belapur', brand: 'Toyota', address: 'Wasan Toyota & Lakozy Toyota Kharghar, Sector 15 CBD Belapur', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2757 1234', email: 'belapur@toyota.co.in' },
  { name: 'Kia Motors - Kopar Khairane', brand: 'Kia', address: 'Plot 45, Sector 19, Kopar Khairane', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2754 8888', email: 'koparkhairane@kia.co.in' },
  { name: 'MG Motor - Seawoods', brand: 'MG Motor', address: 'Seawoods Grand Central, Sector 40, Seawoods', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2778 1111', email: 'seawoods@mgmotor.co.in' },
  { name: 'BMW - Turbhe', brand: 'BMW', address: 'BMW Showroom, Turbhe MIDC, Navi Mumbai', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2788 9999', email: 'turbhe@bmw.co.in' },
  { name: 'Mercedes-Benz - Vashi Plaza', brand: 'Mercedes-Benz', address: 'Vashi Plaza, Sector 17, Vashi', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2783 7777', email: 'vashi@mercedes.co.in' },
];

for (const s of showrooms) {
  db.prepare('INSERT INTO showrooms (name,brand_id,address,city,state,phone,email) VALUES (?,?,?,?,?,?,?)')
    .run(s.name, brandIds[s.brand], s.address, s.city, s.state, s.phone, s.email);
}

// Vehicles — on-road Navi Mumbai pricing verified via CarDekho/ZigWheels/Autocar (Aug 2026), rupees in mind
// Image URLs: distinct Unsplash/CarDekho-style demo photos per model, demo use
const vehicles = [
  // Maruti Suzuki — Swift base 5.84L on-road (CarDekho), ZXi Plus ~8.99L
  { brand: 'Maruti Suzuki', model: 'Swift ZXi Plus', category: 'car', price: 899000, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format', horsepower: 89, engine: '1.2L K-Series Dual Jet', fuel_type: 'Petrol', transmission: 'Manual 5MT', mileage: '22.38 km/l', top_speed: '165 km/h', colors: ['Pearl Arctic White','Metallic Magma Grey','Solid Fire Red'], description: 'On-road Navi Mumbai ₹8.99L (CarDekho: base Swift 5.84L). Favourite hatch with floating roof, 9-inch infotainment, ideal for Vashi-Palm Beach traffic.' },
  { brand: 'Maruti Suzuki', model: 'Baleno Alpha', category: 'car', price: 1025000, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format', horsepower: 89, engine: '1.2L Dual Jet', fuel_type: 'Petrol', transmission: 'AMT', mileage: '22.94 km/l', top_speed: '170 km/h', colors: ['Nexa Blue','Lux Beige','Grandeur Grey'], description: 'Premium Nexa hatch, HUD + 360° cam. Navi Mumbai on-road ~₹10.25L.' },
  { brand: 'Maruti Suzuki', model: 'Victoris ZXi+ Hybrid', category: 'car', price: 1850000, image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format', horsepower: 115, engine: '1.5L M15D Strong Hybrid', fuel_type: 'Hybrid', transmission: 'eCVT', mileage: '28.6 km/l', top_speed: '170 km/h', colors: ['Splendid Silver','Sizzling Red','Grandeur Grey'], description: '2026 launch: Victoris hybrid on-road Kharghar ₹18.5L (ZigWheels: base 12.38L). 10 colours, eCVT hybrid.' },
  { brand: 'Maruti Suzuki', model: 'Brezza ZXi Smart Hybrid', category: 'car', price: 1245000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format', horsepower: 103, engine: '1.5L K15C Smart Hybrid', fuel_type: 'Petrol', transmission: 'Automatic 6AT', mileage: '19.89 km/l', top_speed: '172 km/h', colors: ['Sizzling Red','Brave Khaki','Splendid Silver'], description: 'ZigWheels: Brezza Navi Mumbai ₹8.26L base; ZXi Smart Hybrid on-road ₹12.45L with sunroof.' },
  // Hyundai — Exter 6.71L, Verna 12.93L base (ZigWheels)
  { brand: 'Hyundai', model: 'Exter SX Knight', category: 'car', price: 985000, image_url: 'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&auto=format', horsepower: 82, engine: '1.2L Kappa', fuel_type: 'Petrol', transmission: 'AMT', mileage: '19.4 km/l', top_speed: '165 km/h', colors: ['Fiery Red','Starry Night','Khaki Green'], description: 'Hyundai Exter Navi Mumbai on-road ₹6.71L base (Autocar 2026). SX Knight ~₹9.85L, high ground clearance for Airoli.' },
  { brand: 'Hyundai', model: 'i20 Asta Opt', category: 'car', price: 1125000, image_url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format', horsepower: 82, engine: '1.2L Kappa', fuel_type: 'Petrol', transmission: 'IVT', mileage: '19.65 km/l', top_speed: '172 km/h', colors: ['Fiery Red','Starry Night','Typhoon Silver'], description: 'Premium hatch Bose sound, on-road ₹11.25L Nerul.' },
  { brand: 'Hyundai', model: 'Creta SX Knight Diesel', category: 'car', price: 1895000, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format', horsepower: 115, engine: '1.5L CRDi Diesel', fuel_type: 'Diesel', transmission: 'Automatic 6AT', mileage: '18.5 km/l', top_speed: '175 km/h', colors: ['Knight Black','Titan Grey','Atlas White'], description: 'Best-seller Navi Mumbai. Creta Diesel SX Knight on-road ~₹18.95L, panoramic sunroof ADAS.' },
  { brand: 'Hyundai', model: 'Verna SX Turbo DCT', category: 'car', price: 1750000, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format', horsepower: 158, engine: '1.5L Turbo GDi', fuel_type: 'Petrol', transmission: 'DCT 7AT', mileage: '18 km/l', top_speed: '210 km/h', colors: ['Atlas White','Fiery Red','Abyss Black'], description: 'ZigWheels: Verna Navi Mumbai base 12.93L (HX2); SX Turbo DCT on-road ₹17.5L, Lev 2 ADAS.' },
  // Tata — Nexon, Harrier, Punch
  { brand: 'Tata Motors', model: 'Nexon Fearless Plus', category: 'car', price: 1399000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format', horsepower: 118, engine: '1.2L Revotron Turbo', fuel_type: 'Petrol', transmission: 'DCA 7AT', mileage: '17 km/l', top_speed: '180 km/h', colors: ['Fearless Purple','Calgary White','Daytona Grey'], description: '5-star GNCAP, on-road Kharghar ₹13.99L.' },
  { brand: 'Tata Motors', model: 'Harrier Fearless Dark AT', category: 'car', price: 2599000, image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format', horsepower: 167, engine: '2.0L Kryotec Diesel', fuel_type: 'Diesel', transmission: 'Automatic 6AT', mileage: '16.8 km/l', top_speed: '195 km/h', colors: ['Oberon Black','Sunlit Yellow'], description: 'Flagship Dark edition, JBL + ADAS, on-road ₹25.99L.' },
  { brand: 'Tata Motors', model: 'Punch Accomplished', category: 'car', price: 925000, image_url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format', horsepower: 87, engine: '1.2L Revotron', fuel_type: 'Petrol', transmission: 'AMT', mileage: '18.97 km/l', top_speed: '165 km/h', colors: ['Tornado Blue','Meteor Bronze'], description: 'Micro-SUV monsoon-ready, on-road ₹9.25L.' },
  { brand: 'Tata Motors', model: 'Sierra Revival EV', category: 'car', price: 1850000, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format', horsepower: 167, engine: 'Electric 65kWh', fuel_type: 'Electric', transmission: 'Automatic', mileage: '400 km range', top_speed: '170 km/h', colors: ['Calypso Red','Pristine White'], description: 'Tata Sierra revival EV, Navi Mumbai booking open ~₹18.5L.' },
  // Mahindra — Thar, XUV700, Scorpio N (ZigWheels: Scorpio N ₹13.49L base)
  { brand: 'Mahindra', model: 'Thar LX 4x4 Hard Top', category: 'car', price: 1725000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format', horsepower: 150, engine: '2.2L mHawk Diesel', fuel_type: 'Diesel', transmission: 'Automatic 4WD', mileage: '15.2 km/l', top_speed: '155 km/h', colors: ['Rocky Beige','Napoli Black','Deep Forest'], description: 'Lifestyle 4x4, on-road Airoli ₹17.25L, Alibaug getaway ready.' },
  { brand: 'Mahindra', model: 'XUV700 AX7L AWD', category: 'car', price: 2850000, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format', horsepower: 197, engine: '2.0L mStallion Turbo', fuel_type: 'Petrol', transmission: 'Automatic 6AT AWD', mileage: '13 km/l', top_speed: '200 km/h', colors: ['Midnight Black','Everest White'], description: '7-seater AdrenoX + Sony 3D, on-road ₹28.5L.' },
  { brand: 'Mahindra', model: 'Scorpio N Z8L 4x4', category: 'car', price: 2425000, image_url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format', horsepower: 172, engine: '2.2L mHawk Diesel', fuel_type: 'Diesel', transmission: 'Automatic 4x4', mileage: '15 km/l', top_speed: '185 km/h', colors: ['Deep Forest','Red Rage'], description: 'ZigWheels: Scorpio N base ₹13.49L; Z8L 4x4 on-road ₹24.25L.' },
  // Honda — City, Elevate
  { brand: 'Honda', model: 'City ZX CVT', category: 'car', price: 1595000, image_url: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&auto=format', horsepower: 119, engine: '1.5L i-VTEC DOHC', fuel_type: 'Petrol', transmission: 'CVT', mileage: '18.4 km/l', top_speed: '190 km/h', colors: ['Radiant Red','Platinum White'], description: 'Sedan benchmark, Honda Sensing, on-road Panvel ₹15.95L.' },
  { brand: 'Honda', model: 'Elevate ZX CVT', category: 'car', price: 1685000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format', horsepower: 119, engine: '1.5L i-VTEC', fuel_type: 'Petrol', transmission: 'CVT', mileage: '16.92 km/l', top_speed: '180 km/h', colors: ['Golden Brown','Meteoroid Grey'], description: 'New Honda SUV 360 cam, on-road ₹16.85L.' },
  // Toyota — Fortuner verified ZigWheels: base 42.95L on-road Navi Mumbai, Legender 42.92L
  { brand: 'Toyota', model: 'Fortuner 4x2 AT Legender', category: 'car', price: 4292000, image_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format', horsepower: 201, engine: '2.8L Diesel 4-Cyl', fuel_type: 'Diesel', transmission: 'Automatic 6AT 4x2', mileage: '14.3 km/l', top_speed: '190 km/h', colors: ['White Pearl Crystal Shine','Attitude Black'], description: 'ZigWheels Fortuner Legender Navi Mumbai on-road ₹42.92L (base Fortuner ₹42.95L). Lakozy/Wasan Toyota Kharghar.' },
  { brand: 'Toyota', model: 'Innova Hycross ZX(O) Hybrid', category: 'car', price: 3249000, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format', horsepower: 183, engine: '2.0L Hybrid TNGA', fuel_type: 'Hybrid', transmission: 'eCVT', mileage: '21.1 km/l', top_speed: '180 km/h', colors: ['Super White','Sparkling Black Silver'], description: 'Premium MPV captain seats, on-road ₹32.49L CBD Belapur.' },
  { brand: 'Toyota', model: 'Glanza G Hybrid', category: 'car', price: 985000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format', horsepower: 89, engine: '1.2L K-Series', fuel_type: 'Petrol', transmission: 'AMT', mileage: '22.3 km/l', top_speed: '165 km/h', colors: ['Sportin Red','Gaming Grey'], description: 'Toyota badge Baleno, on-road ₹9.85L.' },
  // Kia — Seltos, Sonet
  { brand: 'Kia', model: 'Seltos GTX Plus Turbo', category: 'car', price: 1995000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format', horsepower: 158, engine: '1.5L Turbo GDi', fuel_type: 'Petrol', transmission: 'DCT 7AT', mileage: '17 km/l', top_speed: '200 km/h', colors: ['Aurora Black Pearl','Sparkling Silver'], description: 'Kopar Khairane Kia, Bose + pano sunroof, on-road ₹19.95L.' },
  { brand: 'Kia', model: 'Sonet X Line Turbo', category: 'car', price: 1499000, image_url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format', horsepower: 118, engine: '1.0L Turbo GDi', fuel_type: 'Petrol', transmission: 'iMT', mileage: '18.2 km/l', top_speed: '170 km/h', colors: ['Matte Graphite','Aurora Black'], description: 'Compact SUV matte graphite, on-road ₹14.99L.' },
  // MG Motor
  { brand: 'MG Motor', model: 'Hector Sharp Pro CVT', category: 'car', price: 2345000, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format', horsepower: 141, engine: '1.5L Turbo Petrol', fuel_type: 'Petrol', transmission: 'CVT 8AT', mileage: '14 km/l', top_speed: '195 km/h', colors: ['Candy White','Starry Black'], description: 'Internet SUV 14-inch screen ADAS, on-road Seawoods ₹23.45L.' },
  { brand: 'MG Motor', model: 'Astor Savvy Pro Turbo', category: 'car', price: 1895000, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format', horsepower: 138, engine: '1.3L Turbo', fuel_type: 'Petrol', transmission: 'Automatic 6AT', mileage: '15 km/l', top_speed: '190 km/h', colors: ['Tuxedo Black','Glaze Red'], description: 'AI assistant Astor, on-road ₹18.95L.' },
  // BMW
  { brand: 'BMW', model: '3 Series 330Li M Sport', category: 'car', price: 6490000, image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format', horsepower: 255, engine: '2.0L TwinPower Turbo', fuel_type: 'Petrol', transmission: 'Automatic 8AT', mileage: '15.5 km/l', top_speed: '250 km/h', colors: ['Alpine White','Portimao Blue'], description: 'Long wheelbase 330Li M Sport, on-road Turbhe ₹64.90L.' },
  { brand: 'BMW', model: 'X1 sDrive18i xLine', category: 'car', price: 5090000, image_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format', horsepower: 134, engine: '1.5L TwinPower Turbo', fuel_type: 'Petrol', transmission: 'DCT 7AT', mileage: '16.3 km/l', top_speed: '205 km/h', colors: ['Phytonic Blue','Space Silver'], description: 'Compact SAV Harman Kardon pano roof, on-road ₹50.90L.' },
  // Mercedes-Benz
  { brand: 'Mercedes-Benz', model: 'C-Class C300 AMG Line', category: 'car', price: 6850000, image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format', horsepower: 255, engine: '2.0L Turbo Petrol', fuel_type: 'Petrol', transmission: 'Automatic 9G-TRONIC', mileage: '14.8 km/l', top_speed: '250 km/h', colors: ['Obsidian Black','Selenite Grey'], description: 'Baby S-Class Burmester MBUX, on-road Vashi ₹68.50L.' },
  { brand: 'Mercedes-Benz', model: 'GLA 220d 4MATIC', category: 'car', price: 5450000, image_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format', horsepower: 187, engine: '2.0L Diesel', fuel_type: 'Diesel', transmission: 'Automatic 8G-DCT', mileage: '17.1 km/l', top_speed: '219 km/h', colors: ['Cosmos Black','Mountain Grey'], description: 'Compact luxury SUV Mercedes me connect, on-road ₹54.50L.' },
];

for (const v of vehicles) {
  db.prepare(`
    INSERT INTO vehicles (brand_id,model,category,price,image_url,horsepower,engine,fuel_type,transmission,mileage,top_speed,colors,description,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(brandIds[v.brand], v.model, v.category, v.price, v.image_url, v.horsepower, v.engine, v.fuel_type, v.transmission, v.mileage, v.top_speed, JSON.stringify(v.colors), v.description, 'available');
}

// Users
const adminHash = bcrypt.hashSync('Admin@123', 12);
const custHash = bcrypt.hashSync('John@123', 12);
db.prepare('INSERT INTO users (name,email,password,role,phone,address) VALUES (?,?,?,?,?,?)').run('ATDP Admin','admin@autoportal.com',adminHash,'admin','+91 9876543210','Navi Mumbai, Maharashtra');
db.prepare('INSERT INTO users (name,email,password,role,phone,address) VALUES (?,?,?,?,?,?)').run('John Doe','john@example.com',custHash,'customer','+91 9876501234','Sector 17, Vashi, Navi Mumbai');

console.log('Seed complete — updated from net (ZigWheels/CarDekho/Autocar)');
console.log('Brands:', brands.length, 'with Wikimedia logos');
console.log('Showrooms:', showrooms.length);
console.log('Vehicles:', vehicles.length);
console.log('Admin: admin@autoportal.com / Admin@123');
console.log('Customer: john@example.com / John@123');
