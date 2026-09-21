import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import getDb from '@/lib/db';

const client = new Anthropic();

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('image') as File | null;
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mediaType = (SUPPORTED_TYPES.includes(file.type) ? file.type : 'image/jpeg') as
    'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

  const db = getDb();
  const items = db.prepare('SELECT * FROM items ORDER BY ranking DESC').all() as {
    id: number; name: string; type: string; color: string; brand: string;
    season: string; occasion: string; ranking: number;
  }[];

  if (!items.length) {
    return NextResponse.json({ error: 'Your closet is empty. Add some items first.' }, { status: 400 });
  }

  const itemList = items.map(i =>
    `ID ${i.id}: ${i.name} (${i.type}, ${i.color}${i.brand && i.brand !== 'Unknown' ? ', ' + i.brand : ''}, seasons: ${i.season || 'all'}, occasions: ${i.occasion || 'any'})`
  ).join('\n');

  const message = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        {
          type: 'text',
          text: `This is an inspiration outfit photo. Analyze its aesthetic: the color palette, silhouette, formality, and overall vibe.

Then, from the closet below, pick the closest matching outfit. Choose one item per role (one top, one bottom, shoes, and optionally outerwear or an accessory). Prioritize color harmony and matching the vibe over exact item matches.

Closet items:
${itemList}

Return ONLY a JSON object with:
- "itemIds": array of selected item IDs (numbers)
- "name": a short, evocative outfit name (3-5 words)
- "reason": 1-2 sentences on how this captures the inspiration look

No extra text, just the JSON.`,
        },
      ],
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: 'Could not generate suggestion' }, { status: 500 });

  const parsed = JSON.parse(match[0]);
  const selectedItems = items.filter(i => (parsed.itemIds as number[]).includes(i.id));

  return NextResponse.json({ name: parsed.name, reason: parsed.reason, items: selectedItems });
}
