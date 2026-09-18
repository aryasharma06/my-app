import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import getDb from '@/lib/db';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const savePath = path.join(process.cwd(), 'public', 'uploads', filename);

    await writeFile(savePath, buffer);

    const base64 = buffer.toString('base64');
    const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    const db = getDb();
    const refRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('reference_photo') as { value: string } | undefined;
    const refPath = refRow?.value ? path.join(process.cwd(), 'public', refRow.value) : null;

    let refBase64: string | null = null;
    let refMediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
    if (refPath) {
      try {
        const refBuffer = await readFile(refPath);
        refBase64 = refBuffer.toString('base64');
        const refExt = refPath.split('.').pop()?.toLowerCase();
        if (refExt === 'png') refMediaType = 'image/png';
      } catch {}
    }

    const personContext = refBase64
      ? 'The first image is a reference photo of the person whose clothing you are analyzing. In the second image, focus ONLY on the clothing worn by the person who matches the reference photo. Ignore all other people entirely.'
      : 'If multiple people appear, focus on the most prominent or central person.';

    const contentBlocks: Anthropic.MessageParam['content'] = [];
    if (refBase64) {
      contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: refMediaType, data: refBase64 } });
    }
    contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
    contentBlocks.push({
      type: 'text',
      text: `${personContext}

List EVERY clothing item and accessory worn by that person. Return ONLY a JSON array where each element has:
- name: short descriptive name (e.g. "Black ruffle cap-sleeve top")
- type: one of [top, bottom, dress, shoes, bag, accessory, outerwear, jumpsuit]
- color: primary color(s), comma-separated
- brand: brand name if visible, otherwise "Unknown"
- price_estimate: estimated retail price in USD as a number
- season: one or more of [spring, summer, autumn, winter, all-season], comma-separated
- occasion: one or more of [casual, office, evening, weekend, sport], comma-separated
- ranking: versatility score 1-5
- notes: one short sentence about the item

Return ONLY valid JSON array, no other text. Example: [{"name":"...","type":"top",...}, {"name":"...","type":"bottom",...}]`,
    });

    const message = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: contentBlocks }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in Claude response');

    const all: Record<string, unknown>[] = JSON.parse(jsonMatch[0]);
    const analyses = all.filter((a) => a.type !== 'accessory');
    if (!Array.isArray(analyses) || analyses.length === 0) throw new Error('Empty analysis');

    const items = analyses.map((analysis) => {
      const result = db.prepare(`
        INSERT INTO items (image_path, name, type, color, brand, price_estimate, season, occasion, ranking, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `/uploads/${filename}`,
        analysis.name,
        analysis.type,
        analysis.color,
        analysis.brand,
        analysis.price_estimate,
        analysis.season,
        analysis.occasion,
        analysis.ranking,
        analysis.notes,
      );
      return db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
