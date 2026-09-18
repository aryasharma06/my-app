import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('reference_photo') as { value: string } | undefined;
  return NextResponse.json({ path: row?.value ?? null });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get('reference_photo') as { value: string } | undefined;
  if (existing?.value) {
    const old = path.join(process.cwd(), 'public', existing.value);
    await unlink(old).catch(() => {});
  }

  const bytes = await file.arrayBuffer();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `reference-${Date.now()}.${ext}`;
  await writeFile(path.join(process.cwd(), 'public', 'uploads', filename), Buffer.from(bytes));

  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('reference_photo', `/uploads/${filename}`);
  return NextResponse.json({ path: `/uploads/${filename}` });
}
