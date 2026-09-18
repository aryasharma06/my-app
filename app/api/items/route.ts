import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { name, type, color, brand, price_estimate, season, occasion, notes, product_url, product_image_url } = body;

  const result = db.prepare(`
    INSERT INTO items (image_path, name, type, color, brand, price_estimate, season, occasion, notes, product_url, product_image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '',
    name ?? '',
    type ?? 'top',
    color ?? '',
    brand ?? '',
    price_estimate != null ? Number(price_estimate) : null,
    season ?? '',
    occasion ?? '',
    notes ?? '',
    product_url || null,
    product_image_url || null,
  );

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(item, { status: 201 });
}
