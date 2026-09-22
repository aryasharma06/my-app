import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM outfit_items WHERE outfit_id = ?').run(id);
  db.prepare('DELETE FROM outfits WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
