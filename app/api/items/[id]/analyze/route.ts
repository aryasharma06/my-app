import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import getDb from '@/lib/db';

interface DbItem {
  id: number;
  color: string;
  product_image_url: string | null;
}

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

function nearestColorName(r: number, g: number, b: number): string {
  let best = 'Unknown';
  let minDist = Infinity;
  for (const [name, [cr, cg, cb]] of Object.entries(FASHION_COLORS)) {
    const dist = 2 * (r - cr) ** 2 + 4 * (g - cg) ** 2 + 3 * (b - cb) ** 2;
    if (dist < minDist) { minDist = dist; best = name; }
  }
  return best;
}

async function extractColors(imageUrl: string): Promise<string> {
  let inputBuffer: Buffer;

  if (imageUrl.startsWith('/uploads/')) {
    inputBuffer = await readFile(path.join(process.cwd(), 'public', imageUrl));
  } else {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    inputBuffer = Buffer.from(await res.arrayBuffer());
  }

  // Resize to 50x50 and get raw RGB pixels — sharp handles AVIF, WebP, HEIF, JPEG, PNG, etc.
  const { data } = await sharp(inputBuffer)
    .resize(50, 50, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Count pixels per named color
  const counts: Record<string, number> = {};
  for (let i = 0; i < data.length; i += 3) {
    const name = nearestColorName(data[i], data[i + 1], data[i + 2]);
    counts[name] = (counts[name] ?? 0) + 1;
  }

  // Top 2 colors by pixel frequency, deduplicated
  const topColors = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);

  return topColors.join(', ');
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as DbItem | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!item.product_image_url) return NextResponse.json({ error: 'No image' }, { status: 400 });
  if (item.color?.trim()) return NextResponse.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));

  try {
    const color = await extractColors(item.product_image_url);
    if (color) db.prepare('UPDATE items SET color = ? WHERE id = ?').run(color, id);
  } catch (err) {
    console.error('[analyze] color extraction failed:', err);
  }

  return NextResponse.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
}
