import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM items').all() as {
    type: string; brand: string; color: string;
    season: string; occasion: string; price_estimate: number; ranking: number;
  }[];

  const count = items.length;
  const totalValue = items.reduce((s, i) => s + (i.price_estimate || 0), 0);
  const avgRanking = count ? items.reduce((s, i) => s + (i.ranking || 0), 0) / count : 0;

  const byType = tally(items, 'type');
  const byBrand = tally(items, 'brand');
  const byColor = tally(items, 'color');

  const bySeason: Record<string, number> = {};
  const byOccasion: Record<string, number> = {};
  for (const item of items) {
    for (const s of (item.season || '').split(',').map((x: string) => x.trim()).filter(Boolean))
      bySeason[s] = (bySeason[s] || 0) + 1;
    for (const o of (item.occasion || '').split(',').map((x: string) => x.trim()).filter(Boolean))
      byOccasion[o] = (byOccasion[o] || 0) + 1;
  }

  return NextResponse.json({ count, totalValue, avgRanking, byType, byBrand, byColor, bySeason, byOccasion });
}

function tally(items: { [key: string]: unknown }[], key: string): Record<string, number> {
  return items.reduce((acc: Record<string, number>, item) => {
    const val = String(item[key] || 'Unknown').trim();
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}
