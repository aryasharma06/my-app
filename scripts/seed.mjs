import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';

const dir = join(fileURLToPath(import.meta.url), '..', '..');
const db = new Database(join(dir, 'data', 'closet.db'));

const items = [
  { name: 'Linen blazer', type: 'outerwear', color: 'Oatmeal', brand: 'Arket', price: 195, season: 'spring,summer', occasion: 'office,casual', ranking: 5, notes: 'Relaxed fit, slightly oversized.' },
  { name: 'Wide-leg trousers', type: 'bottom', color: 'Camel', brand: 'Zara', price: 59, season: 'all-season', occasion: 'office,casual', ranking: 5, notes: 'High-waisted with a clean drape.' },
  { name: 'Silk slip dress', type: 'dress', color: 'Champagne', brand: 'Reformation', price: 248, season: 'spring,summer', occasion: 'evening,casual', ranking: 4, notes: 'Bias cut, midi length.' },
  { name: 'White button-down', type: 'top', color: 'White', brand: 'Everlane', price: 78, season: 'all-season', occasion: 'office,casual,weekend', ranking: 5, notes: 'Oversized, poplin fabric.' },
  { name: 'Straight-leg jeans', type: 'bottom', color: 'Dark indigo', brand: 'Agolde', price: 198, season: 'autumn,winter', occasion: 'casual,weekend', ranking: 5, notes: 'High rise, ankle length.' },
  { name: 'Cashmere crewneck', type: 'top', color: 'Cream', brand: 'COS', price: 145, season: 'autumn,winter', occasion: 'casual,office', ranking: 4, notes: 'Relaxed fit, soft handle.' },
  { name: 'Leather loafers', type: 'shoes', color: 'Black', brand: 'Sam Edelman', price: 110, season: 'all-season', occasion: 'office,casual', ranking: 5, notes: 'Penny loafer with low block heel.' },
  { name: 'Suede ankle boots', type: 'shoes', color: 'Tan', brand: 'Steve Madden', price: 130, season: 'autumn,winter', occasion: 'casual,weekend', ranking: 4, notes: 'Chelsea style, easy pull-on.' },
  { name: 'Strappy sandals', type: 'shoes', color: 'Nude', brand: 'ALDO', price: 65, season: 'spring,summer', occasion: 'evening,casual', ranking: 3, notes: 'Thin straps, barely-there look.' },
  { name: 'Mini shoulder bag', type: 'bag', color: 'Chocolate', brand: 'Mango', price: 49, season: 'all-season', occasion: 'casual,evening', ranking: 4, notes: 'Structured, gold chain strap.' },
  { name: 'Tote bag', type: 'bag', color: 'Tan', brand: 'Cuyana', price: 195, season: 'all-season', occasion: 'office,weekend', ranking: 5, notes: 'Full-grain leather, roomy interior.' },
  { name: 'Gold hoop earrings', type: 'accessory', color: 'Gold', brand: 'Mejuri', price: 68, season: 'all-season', occasion: 'casual,office,evening', ranking: 5, notes: 'Medium sized, thin tubing.' },
  { name: 'Silk scarf', type: 'accessory', color: 'Burgundy print', brand: 'Unknown', price: 35, season: 'spring,autumn', occasion: 'casual,office', ranking: 3, notes: 'Can be worn in hair or as neck scarf.' },
  { name: 'Wrap midi skirt', type: 'bottom', color: 'Terracotta', brand: 'Anthropologie', price: 88, season: 'spring,summer', occasion: 'casual,weekend,evening', ranking: 4, notes: 'Satin finish, adjustable tie.' },
  { name: 'Ribbed tank top', type: 'top', color: 'Black', brand: 'Skims', price: 38, season: 'spring,summer', occasion: 'casual,weekend', ranking: 4, notes: 'Fitted, great as a base layer.' },
  { name: 'Trench coat', type: 'outerwear', color: 'Camel', brand: 'H&M', price: 120, season: 'spring,autumn', occasion: 'office,casual', ranking: 5, notes: 'Double-breasted, belted waist.' },
  { name: 'Knit cardigan', type: 'top', color: 'Sage green', brand: 'Aritzia', price: 115, season: 'autumn,winter', occasion: 'casual,weekend,office', ranking: 4, notes: 'Longline, open front.' },
  { name: 'Pleated midi skirt', type: 'bottom', color: 'Navy', brand: '& Other Stories', price: 95, season: 'all-season', occasion: 'office,evening', ranking: 4, notes: 'Satin pleats, hits below the knee.' },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO items (image_path, name, type, color, brand, price_estimate, season, occasion, ranking, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const item of items) {
  insert.run('/uploads/placeholder.jpg', item.name, item.type, item.color, item.brand, item.price, item.season, item.occasion, item.ranking, item.notes);
}

console.log(`Seeded ${items.length} items.`);
db.close();
