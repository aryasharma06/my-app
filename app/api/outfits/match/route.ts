import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import getDb from '@/lib/db';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { anchorItemId, wantType, occasion } = await req.json();
  if (!anchorItemId || !wantType) {
    return NextResponse.json({ error: 'Missing anchorItemId or wantType' }, { status: 400 });
  }

  const db = getDb();
  const allItems = db.prepare('SELECT * FROM items ORDER BY ranking DESC').all() as {
    id: number; name: string; type: string; color: string; brand: string;
    season: string; occasion: string; ranking: number;
  }[];

  const anchor = allItems.find(i => i.id === anchorItemId);
  if (!anchor) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const candidates = allItems.filter(i => i.type === wantType && i.id !== anchorItemId);
  if (!candidates.length) {
    return NextResponse.json({ error: `No ${wantType} items in your closet yet.` }, { status: 400 });
  }

  const candidateList = candidates.map(i =>
    `ID ${i.id}: ${i.name} (${i.color}${i.brand && i.brand !== 'Unknown' ? ', ' + i.brand : ''}, seasons: ${i.season || 'all'}, occasions: ${i.occasion || 'any'})`
  ).join('\n');

  const message = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `A user wants to wear: "${anchor.name}" (${anchor.type}, ${anchor.color}, seasons: ${anchor.season || 'all'}).
They need something to go with it for: ${occasion?.trim() || 'a general occasion'}.

From the list below, pick the top 3 best matching ${wantType}s. Consider color harmony, occasion fit, and overall cohesion.

Available ${wantType}s:
${candidateList}

Return ONLY a JSON array of up to 3 objects, each with:
- "itemId": the item ID (number)
- "reason": one sentence on why this pairs well

No extra text, just the JSON array.`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return NextResponse.json({ error: 'Could not find matches' }, { status: 500 });

  const parsed = JSON.parse(arrayMatch[0]) as { itemId: number; reason: string }[];
  const results = parsed
    .map(p => ({ item: allItems.find(i => i.id === p.itemId), reason: p.reason }))
    .filter(r => r.item);

  return NextResponse.json(results);
}
