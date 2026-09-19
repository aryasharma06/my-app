import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import getDb from '@/lib/db';

interface DbItem {
  id: number;
  product_image_url: string | null;
  image_path: string | null;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as DbItem | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const imageSource = item.product_image_url || item.image_path;
  if (!imageSource) return NextResponse.json({ error: 'No image' }, { status: 400 });

  let inputBuffer: Buffer;
  if (imageSource.startsWith('/uploads/') || imageSource.startsWith('/public/')) {
    const localPath = imageSource.startsWith('/uploads/')
      ? path.join(process.cwd(), 'public', imageSource)
      : path.join(process.cwd(), imageSource);
    inputBuffer = await readFile(localPath);
  } else {
    const res = await fetch(imageSource, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return NextResponse.json({ error: `Failed to fetch image: HTTP ${res.status}` }, { status: 500 });
    inputBuffer = Buffer.from(await res.arrayBuffer());
  }

  // Dynamic import to avoid edge runtime issues
  const { removeBackground } = await import('@imgly/background-removal-node');

  const blob = new Blob([inputBuffer]);
  const resultBlob = await removeBackground(blob);
  const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());

  const filename = `product-${id}-nobg-${Date.now()}.png`;
  const savePath = path.join(process.cwd(), 'public', 'uploads', filename);
  await writeFile(savePath, resultBuffer);

  const newUrl = `/uploads/${filename}`;
  db.prepare('UPDATE items SET product_image_url = ? WHERE id = ?').run(newUrl, id);

  return NextResponse.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
}
