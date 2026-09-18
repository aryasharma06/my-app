import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, unlink } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encoded = searchParams.get('path');
  if (!encoded) return NextResponse.json({ error: 'No path' }, { status: 400 });

  const filePath = Buffer.from(encoded, 'base64').toString('utf8');
  const ext = filePath.split('.').pop()!.toLowerCase();

  try {
    if (ext === 'heic' || ext === 'heif') {
      const tmpPath = join(tmpdir(), `closet-${Date.now()}.jpg`);
      await execAsync(`sips -s format jpeg "${filePath}" --out "${tmpPath}"`);
      const data = await readFile(tmpPath);
      await unlink(tmpPath).catch(() => {});
      return new NextResponse(data, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600' } });
    }

    const data = await readFile(filePath);
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return new NextResponse(data, { headers: { 'Content-Type': mime, 'Cache-Control': 'private, max-age=3600' } });
  } catch {
    return NextResponse.json({ error: 'Could not read image' }, { status: 500 });
  }
}
