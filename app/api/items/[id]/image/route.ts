import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import getDb from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const url = form.get('url') as string | null;

  let localPath: string | null = null;

  if (file) {
    const bytes = await file.arrayBuffer();
    const buf = Buffer.from(bytes);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `product-${id}-${Date.now()}.${ext}`;
    await writeFile(path.join(process.cwd(), 'public', 'uploads', filename), buf);
    localPath = `/uploads/${filename}`;
  } else if (url) {
    // Download the pasted URL locally so it always works
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') ?? 'image/jpeg';
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        const filename = `product-${id}-${Date.now()}.${ext}`;
        await writeFile(path.join(process.cwd(), 'public', 'uploads', filename), Buffer.from(await res.arrayBuffer()));
        localPath = `/uploads/${filename}`;
      }
    } catch {}
    // Fall back to the raw URL if download fails
    if (!localPath) localPath = url;
  }

  if (!localPath) return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });

  db.prepare('UPDATE items SET product_image_url = ? WHERE id = ?').run(localPath, id);
  return NextResponse.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
}
