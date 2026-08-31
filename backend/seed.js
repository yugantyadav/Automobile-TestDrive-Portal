const bcrypt = require('bcryptjs');
const { db, initDb } = require('./config/db');

initDb();

// Clear existing
db.exec(`DELETE FROM bookings; DELETE FROM vehicles; DELETE FROM showrooms; DELETE FROM brands; DELETE FROM users;`);
// Reset autoincrement
try{ db.exec(`DELETE FROM sqlite_sequence;`);}catch{}

// Brands
const brands = [
  { name: 'Maruti Suzuki', category: 'car', logo_url: 'https://logo.clearbit.com/marutisuzuki.com' },
  { name: 'Hyundai', category: 'car', logo_url: 'https://logo.clearbit.com/hyundai.com' },
  { name: 'Tata Motors', category: 'car', logo_url: 'https://logo.clearbit.com/tatamotors.com' },
  { name: 'Mahindra', category: 'car', logo_url: 'https://logo.clearbit.com/mahindra.com' },
  { name: 'Honda', category: 'car', logo_url: 'https://logo.clearbit.com/honda.com' },
  { name: 'Toyota', category: 'car', logo_url: 'https://logo.clearbit.com/toyota.com' },
  { name: 'Kia', category: 'car', logo_url: 'https://logo.clearbit.com/kia.com' },
  { name: 'MG Motor', category: 'car', logo_url: 'https://logo.clearbit.com/mgmotor.co.in' },
  { name: 'BMW', category: 'car', logo_url: 'https://logo.clearbit.com/bmw.com' },
  { name: 'Mercedes-Benz', category: 'car', logo_url: 'https://logo.clearbit.com/mercedes-benz.com' },
];

const brandIds = {};
for (const b of brands) {
  const r = db.prepare('INSERT INTO brands (name,category,logo_url) VALUES (?,?,?)').run(b.name, b.category, b.logo_url);
  brandIds[b.name] = r.lastInsertRowid;
}

// Showrooms - Navi Mumbai locations
const showrooms = [
  { name: 'Maruti Suzuki Nexa - Vashi', brand: 'Maruti Suzuki', address: 'Plot No. 12, Sector 17, Vashi', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2784 1122', email: 'vashi@nexa-maruti.co.in' },
  { name: 'Hyundai Showroom - Nerul', brand: 'Hyundai', address: 'Inorbit Mall Road, Sector 30, Nerul', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2770 3344', email: 'nerul@hyundai.co.in' },
  { name: 'Tata Motors - Kharghar', brand: 'Tata Motors', address: 'Central Park Road, Sector 21, Kharghar', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2774 5566', email: 'kharghar@tatamotors.co.in' },
  { name: 'Mahindra - Airoli', brand: 'Mahindra', address: 'Thane-Belapur Road, Airoli', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2789 7788', email: 'airoli@mahindra.co.in' },
  { name: 'Honda Cars - Panvel', brand: 'Honda', address: 'Old Mumbai-Pune Highway, Panvel', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2745 9900', email: 'panvel@honda.co.in' },
  { name: 'Toyota - CBD Belapur', brand: 'Toyota', address: 'Sector 15, CBD Belapur', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2757 1234', email: 'belapur@toyota.co.in' },
  { name: 'Kia Motors - Kopar Khairane', brand: 'Kia', address: 'Plot 45, Sector 19, Kopar Khairane', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2754 8888', email: 'koparkhairane@kia.co.in' },
  { name: 'MG Motor - Seawoods', brand: 'MG Motor', address: 'Seawoods Grand Central, Sector 40, Seawoods', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2778 1111', email: 'seawoods@mgmotor.co.in' },
  { name: 'BMW - Turbhe', brand: 'BMW', address: 'BMW Showroom, Turbhe MIDC, Navi Mumbai', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2788 9999', email: 'turbhe@bmw.co.in' },
  { name: 'Mercedes-Benz - Vashi Plaza', brand: 'Mercedes-Benz', address: 'Vashi Plaza, Sector 17, Vashi', city: 'Navi Mumbai', state: 'Maharashtra', phone: '+91 22 2783 7777', email: 'vashi@mercedes.co.in' },
];

for (const s of showrooms) {
  db.prepare('INSERT INTO showrooms (name,brand_id,address,city,state,phone,email) VALUES (?,?,?,?,?,?,?)')
    .run(s.name, brandIds[s.brand], s.address, s.city, s.state, s.phone, s.email);
}

// Vehicles with Navi Mumbai pricing in Rupees - using Unsplash / real image URLs
const vehicles = [
  // Maruti
  { brand: 'Maruti Suzuki', model: 'Swift ZXi Plus', category: 'car', price: 899000, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800', horsepower: 89, engine: '1.2L K-Series Petrol', fuel_type: 'Petrol', transmission: 'Manual', mileage: '22.38 km/l', top_speed: '165 km/h', colors: ['Pearl Arctic White','Metallic Magma Grey','Solid Fire Red'], description: 'India’s favourite hatchback, now more premium with floating roof and refined K12 engine. Perfect for Navi Mumbai city traffic.' },
  { brand: 'Maruti Suzuki', model: 'Baleno Alpha', category: 'car', price: 985000, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', horsepower: 89, engine: '1.2L Dual Jet', fuel_type: 'Petrol', transmission: 'Automatic (AMT)', mileage: '22.94 km/l', top_speed: '170 km/h', colors: ['Nexa Blue','Lux Beige','Grandeur Grey'], description: 'Premium hatchback with 9-inch infotainment and heads-up display.' },
  { brand: 'Maruti Suzuki', model: 'Brezza ZXi', category: 'car', price: 1149000, image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', horsepower: 103, engine: '1.5L K15C Smart Hybrid', fuel_type: 'Petrol', transmission: 'Automatic', mileage: '19.89 km/l', top_speed: '170 km/h', colors: ['Sizzling Red','Brave Khaki','Splendid Silver'], description: 'Compact SUV with sunroof and 360 view camera, ideal for family drives on Palm Beach Road.' },
  // Hyundai
  { brand: 'Hyundai', model: 'i20 Asta Opt', category: 'car', price: 1125000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', horsepower: 82, engine: '1.2L Kappa Petrol', fuel_type: 'Petrol', transmission: 'IVT', mileage: '19.65 km/l', top_speed: '172 km/h', colors: ['Fiery Red','Starry Night','Typhoon Silver'], description: 'Feature-loaded premium hatch with Bose sound and wireless charger.' },
  { brand: 'Hyundai', model: 'Creta SX Opt Knight', category: 'car', price: 1785000, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800', horsepower: 115, engine: '1.5L CRDi Diesel', fuel_type: 'Diesel', transmission: 'Automatic', mileage: '18.5 km/l', top_speed: '175 km/h', colors: ['Knight Black','Titan Grey','Atlas White'], description: 'Best-selling SUV in Navi Mumbai with panoramic sunroof and ADAS.' },
  { brand: 'Hyundai', model: 'Verna SX Turbo', category: 'car', price: 1549000, image_url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800', horsepower: 158, engine: '1.5L Turbo GDi', fuel_type: 'Petrol', transmission: 'DCT', mileage: '18 km/l', top_speed: '210 km/h', colors: ['Abyss Black','Atlas White','Fiery Red'], description: 'Sedan with ventilated seats and Level 2 ADAS.' },
  // Tata
  { brand: 'Tata Motors', model: 'Nexon Fearless Plus', category: 'car', price: 1399000, image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', horsepower: 118, engine: '1.2L Revotron Turbo', fuel_type: 'Petrol', transmission: 'Automatic (DCA)', mileage: '17 km/l', top_speed: '180 km/h', colors: ['Fearless Purple','Calgary White','Daytona Grey'], description: '5-star GNCAP safety SUV, made in India for Indian roads.' },
  { brand: 'Tata Motors', model: 'Harrier Fearless Dark', category: 'car', price: 2449000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', horsepower: 167, engine: '2.0L Kryotec Diesel', fuel_type: 'Diesel', transmission: 'Automatic', mileage: '16.8 km/l', top_speed: '195 km/h', colors: ['Oberon Black','Sunlit Yellow'], description: 'Flagship SUV with ADAS and JBL audio, commanding presence on Navi Mumbai highways.' },
  { brand: 'Tata Motors', model: 'Punch Accomplished', category: 'car', price: 899000, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800', horsepower: 87, engine: '1.2L Revotron', fuel_type: 'Petrol', transmission: 'AMT', mileage: '18.8 km/l', top_speed: '165 km/h', colors: ['Tornado Blue','Tropical Mist','Meteor Bronze'], description: 'Micro-SUV with high ground clearance for monsoon flooding resilience.' },
  // Mahindra
  { brand: 'Mahindra', model: 'Thar LX Hard Top', category: 'car', price: 1695000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', horsepower: 150, engine: '2.2L mHawk Diesel', fuel_type: 'Diesel', transmission: 'Automatic 4WD', mileage: '15.2 km/l', top_speed: '155 km/h', colors: ['Rocky Beige','Mystic Copper','Napoli Black'], description: 'Lifestyle off-roader with convertible top, perfect for weekend getaways to Alibaug.' },
  { brand: 'Mahindra', model: 'XUV700 AX7L', category: 'car', price: 2499000, image_url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800', horsepower: 197, engine: '2.0L mStallion Turbo', fuel_type: 'Petrol', transmission: 'Automatic', mileage: '13 km/l', top_speed: '200 km/h', colors: ['Midnight Black','Everest White','Electric Blue'], description: 'Tech-packed 7-seater with AdrenoX and Sony 3D sound.' },
  { brand: 'Mahindra', model: 'Scorpio N Z8L', category: 'car', price: 1999000, image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', horsepower: 172, engine: '2.2L mHawk', fuel_type: 'Diesel', transmission: 'Automatic 4x4', mileage: '15 km/l', top_speed: '185 km/h', colors: ['Deep Forest','Red Rage','Dazzling Silver'], description: 'Big daddy of SUVs with commanding road presence.' },
  // Honda
  { brand: 'Honda', model: 'City ZX CVT', category: 'car', price: 1595000, image_url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800', horsepower: 119, engine: '1.5L i-VTEC', fuel_type: 'Petrol', transmission: 'CVT', mileage: '18.4 km/l', top_speed: '190 km/h', colors: ['Radiant Red','Platinum White','Modern Steel'], description: 'Sedan benchmark with Honda Sensing ADAS and sunroof.' },
  { brand: 'Honda', model: 'Elevate ZX', category: 'car', price: 1615000, image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', horsepower: 119, engine: '1.5L i-VTEC', fuel_type: 'Petrol', transmission: 'CVT', mileage: '16.92 km/l', top_speed: '180 km/h', colors: ['Golden Brown','Meteoroid Grey','Lunar Silver'], description: 'Honda’s new SUV with 360 camera and spacious cabin.' },
  // Toyota
  { brand: 'Toyota', model: 'Fortuner 4x4 Legender', category: 'car', price: 4525000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', horsepower: 201, engine: '2.8L Diesel', fuel_type: 'Diesel', transmission: 'Automatic 4WD', mileage: '14.24 km/l', top_speed: '190 km/h', colors: ['White Pearl','Attitude Black','Sparkling Black Crystal'], description: 'Legendary Fortuner with premium Legender styling, trusted across Maharashtra.' },
  { brand: 'Toyota', model: 'Innova Hycross ZX(O)', category: 'car', price: 3049000, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800', horsepower: 183, engine: '2.0L Hybrid', fuel_type: 'Hybrid', transmission: 'eCVT', mileage: '21.1 km/l', top_speed: '180 km/h', colors: ['Super White','Sparkling Black','Silver Metallic'], description: 'Premium MPV hybrid with captain seats and panoramic roof.' },
  // Kia
  { brand: 'Kia', model: 'Seltos GTX Plus', category: 'car', price: 1995000, image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', horsepower: 158, engine: '1.5L Turbo GDi', fuel_type: 'Petrol', transmission: 'DCT', mileage: '17 km/l', top_speed: '200 km/h', colors: ['Aurora Black Pearl','Gravity Grey','Sparkling Silver'], description: 'Smart SUV with Bose and panoramic sunroof, top choice in Navi Mumbai.' },
  { brand: 'Kia', model: 'Sonet X Line', category: 'car', price: 1419000, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', horsepower: 118, engine: '1.0L Turbo', fuel_type: 'Petrol', transmission: 'iMT', mileage: '18.2 km/l', top_speed: '175 km/h', colors: ['Matte Graphite','Aurora Black','Intense Red'], description: 'Compact SUV with premium matte finish and ventilated seats.' },
  // MG
  { brand: 'MG Motor', model: 'Hector Sharp Pro', category: 'car', price: 2250000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', horsepower: 141, engine: '1.5L Turbo Petrol', fuel_type: 'Petrol', transmission: 'CVT', mileage: '14 km/l', top_speed: '195 km/h', colors: ['Candy White','Starry Black','Aurora Silver'], description: 'Internet inside SUV with 14-inch screen and ADAS.' },
  { brand: 'MG Motor', model: 'Astor Savvy Pro', category: 'car', price: 1825000, image_url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800', horsepower: 138, engine: '1.3L Turbo', fuel_type: 'Petrol', transmission: 'Automatic', mileage: '15 km/l', top_speed: '190 km/h', colors: ['Tuxedo Black','Glaze Red','Aurora Silver'], description: 'India’s first AI inside car with personal assistant.' },
  // BMW
  { brand: 'BMW', model: '3 Series 330Li', category: 'car', price: 6290000, image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', horsepower: 255, engine: '2.0L TwinPower Turbo', fuel_type: 'Petrol', transmission: 'Automatic', mileage: '15.5 km/l', top_speed: '250 km/h', colors: ['Alpine White','Black Sapphire','Portimao Blue'], description: 'Long wheelbase luxury sedan with sheer driving pleasure.' },
  { brand: 'BMW', model: 'X1 sDrive18i', category: 'car', price: 4890000, image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', horsepower: 134, engine: '1.5L TwinPower', fuel_type: 'Petrol', transmission: 'DCT', mileage: '16.3 km/l', top_speed: '205 km/h', colors: ['Alpine White','Phytonic Blue','Space Silver'], description: 'Compact luxury SAV with panoramic roof and Harman Kardon.' },
  // Mercedes
  { brand: 'Mercedes-Benz', model: 'C-Class C300', category: 'car', price: 6155000, image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', horsepower: 255, engine: '2.0L Turbo Petrol', fuel_type: 'Petrol', transmission: 'Automatic 9G', mileage: '14 km/l', top_speed: '250 km/h', colors: ['Obsidian Black','Selenite Grey','Cavansite Blue'], description: 'Baby S-Class with MBUX and Burmester sound, ultimate luxury in Navi Mumbai.' },
  { brand: 'Mercedes-Benz', model: 'GLA 220d', category: 'car', price: 5125000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', horsepower: 187, engine: '2.0L Diesel', fuel_type: 'Diesel', transmission: 'Automatic 8G', mileage: '17 km/l', top_speed: '219 km/h', colors: ['Cosmos Black','Mountain Grey','Polar White'], description: 'Compact luxury SUV with Mercedes me connected tech.' },
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

console.log('Seed complete');
console.log('Brands:', brands.length);
console.log('Showrooms:', showrooms.length);
console.log('Vehicles:', vehicles.length);
console.log('Admin: admin@autoportal.com / Admin@123');
console.log('Customer: john@example.com / John@123');
