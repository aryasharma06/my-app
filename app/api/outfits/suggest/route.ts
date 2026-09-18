import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import getDb from '@/lib/db';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { description } = await req.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: 'No description provided' }, { status: 400 });
  }

  const db = getDb();
  const items = db.prepare('SELECT * FROM items ORDER BY ranking DESC').all() as {
    id: number; name: string; type: string; color: string; brand: string;
    price_estimate: number; season: string; occasion: string; ranking: number; notes: string;
  }[];

  if (!items.length) {
    return NextResponse.json({ error: 'Your closet is empty. Add some items first.' }, { status: 400 });
  }

  const itemList = items.map((i) =>
    `ID ${i.id}: ${i.name} (${i.type}, ${i.color}, ${i.brand}, seasons: ${i.season}, occasions: ${i.occasion}, ranking: ${i.ranking}/5)`
  ).join('\n');

  const message = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a personal stylist. The user wants: "${description}"

Here are the items in their closet:
${itemList}

Pick a cohesive outfit from these items. Choose one item per category where it makes sense (e.g. one top, one bottom, one pair of shoes, optionally a bag or accessory or outerwear). Prioritize higher-ranked items and items that suit the occasion and season described.

Return ONLY a JSON object with:
- "itemIds": array of selected item IDs (numbers)
- "name": a short outfit name (e.g. "Monday meeting look")
- "reason": one or two plain sentences explaining why these pieces work together

No extra text, just the JSON.`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: 'Could not generate outfit suggestion' }, { status: 500 });

  const suggestion = JSON.parse(match[0]);
  const selectedItems = items.filter((i) => suggestion.itemIds.includes(i.id));

  return NextResponse.json({
    name: suggestion.name,
    reason: suggestion.reason,
    items: selectedItems,
  });
}
