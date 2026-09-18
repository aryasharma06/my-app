import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const LIBRARY = join(homedir(), 'Pictures', 'Photos Library.photoslibrary', 'originals');
const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif']);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '0');
  const limit = 60;

  try {
    const buckets = await readdir(LIBRARY);
    const allFiles: { path: string; mtime: number; name: string }[] = [];

    await Promise.all(
      buckets.map(async (bucket) => {
        const bucketPath = join(LIBRARY, bucket);
        try {
          const files = await readdir(bucketPath);
          await Promise.all(
            files.map(async (file) => {
              const ext = '.' + file.split('.').pop()!.toLowerCase();
              if (!SUPPORTED.has(ext)) return;
              const filePath = join(bucketPath, file);
              try {
                const s = await stat(filePath);
                allFiles.push({ path: filePath, mtime: s.mtimeMs, name: file });
              } catch {}
            })
          );
        } catch {}
      })
    );

    allFiles.sort((a, b) => b.mtime - a.mtime);
    const total = allFiles.length;
    const slice = allFiles.slice(page * limit, (page + 1) * limit);

    return NextResponse.json({
      total,
      page,
      files: slice.map((f) => ({
        name: f.name,
        path: Buffer.from(f.path).toString('base64'),
        mtime: f.mtime,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Cannot access Photos library. Make sure Terminal has Full Disk Access.' }, { status: 403 });
  }
}
