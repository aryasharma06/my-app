import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import getDb from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const fields = ['name', 'type', 'color', 'brand', 'price_estimate', 'season', 'occasion', 'ranking', 'notes', 'product_image_url', 'product_url'];
  const updates = fields.filter(f => f in body);
  if (!updates.length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  const set = updates.map(f => `${f} = ?`).join(', ');
  const values = [...updates.map(f => body[f]), id];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.prepare(`UPDATE items SET ${set} WHERE id = ?`) as any).run(...values);
  return NextResponse.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as { image_path: string } | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const filePath = path.join(process.cwd(), 'public', item.image_path);
    await unlink(filePath);
  } catch {}

  db.prepare('DELETE FROM items WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
