import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { Vibrant } from 'node-vibrant/node';
import getDb from '@/lib/db';

interface DbItem {
  id: number;
  color: string;
  season: string;
  occasion: string;
  product_image_url: string | null;
}

// Fashion-relevant color names with representative RGB values
const FASHION_COLORS: Record<string, [number, number, number]> = {
  'Black':       [15,  15,  15],
  'White':       [245, 245, 245],
  'Off-White':   [250, 248, 240],
  'Cream':       [255, 248, 220],
  'Beige':       [215, 200, 185],
  'Light Grey':  [200, 200, 200],
  'Grey':        [128, 128, 128],
  'Dark Grey':   [64,  64,  64],
  'Silver':      [192, 192, 192],
  'Navy':        [26,  35,  126],
  'Blue':        [25,  100, 190],
  'Light Blue':  [100, 180, 245],
  'Sky Blue':    [135, 206, 235],
  'Teal':        [0,   130, 120],
  'Red':         [200, 40,  40],
  'Coral':       [255, 110, 80],
  'Pink':        [240, 100, 160],
  'Light Pink':  [255, 185, 200],
  'Burgundy':    [130, 20,  60],
  'Green':       [50,  130, 55],
  'Olive':       [130, 120, 30],
  'Khaki':       [185, 178, 120],
  'Yellow':      [250, 200, 30],
  'Orange':      [230, 100, 20],
  'Purple':      [110, 30,  155],
  'Lavender':    [200, 180, 220],
  'Brown':       [100, 65,  50],
  'Tan':         [210, 180, 140],
  'Camel':       [195, 155, 100],
  'Gold':        [215, 175, 50],
};

function nearestColorName(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  let best = 'Unknown';
  let minDist = Infinity;

  for (const [name, [cr, cg, cb]] of Object.entries(FASHION_COLORS)) {
    // Weighted distance — human vision is most sensitive to green, least to blue
    const dist = Math.sqrt(2 * (r - cr) ** 2 + 4 * (g - cg) ** 2 + 3 * (b - cb) ** 2);
    if (dist < minDist) { minDist = dist; best = name; }
  }

  return best;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as DbItem | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!item.product_image_url) return NextResponse.json({ error: 'No image to analyze' }, { status: 400 });

  if (item.color?.trim()) {
    return NextResponse.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
  }

  try {
    const imageSrc = item.product_image_url.startsWith('/uploads/')
      ? path.join(process.cwd(), 'public', item.product_image_url)
      : item.product_image_url;

    const palette = await Vibrant.from(imageSrc).getPalette();

    // Rank swatches by how many pixels they represent
    const swatches = Object.values(palette)
      .filter(Boolean)
      .sort((a, b) => (b!.population ?? 0) - (a!.population ?? 0));

    const colorNames = swatches
      .map(s => nearestColorName(s!.hex))
      .filter((name, i, arr) => arr.indexOf(name) === i) // deduplicate
      .slice(0, 2);

    if (colorNames.length > 0) {
      db.prepare('UPDATE items SET color = ? WHERE id = ?').run(colorNames.join(', '), id);
    }
  } catch (err) {
    console.error('[analyze] color extraction failed:', err);
  }

  return NextResponse.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
}
