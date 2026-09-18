import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const outfits = db.prepare('SELECT * FROM outfits ORDER BY created_at DESC').all() as { id: number; name: string; created_at: string }[];
  const result = outfits.map((outfit) => {
    const items = db.prepare(`
      SELECT items.* FROM items
      JOIN outfit_items ON items.id = outfit_items.item_id
      WHERE outfit_items.outfit_id = ?
    `).all(outfit.id);
    return { ...outfit, items };
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { name, itemIds } = await req.json();
  if (!name || !itemIds?.length) {
    return NextResponse.json({ error: 'Name and items required' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare('INSERT INTO outfits (name) VALUES (?)').run(name);
  const outfitId = result.lastInsertRowid;

  const insertItem = db.prepare('INSERT INTO outfit_items (outfit_id, item_id) VALUES (?, ?)');
  for (const itemId of itemIds) insertItem.run(outfitId, itemId);

  const outfit = db.prepare('SELECT * FROM outfits WHERE id = ?').get(outfitId);
  return NextResponse.json(outfit);
}
