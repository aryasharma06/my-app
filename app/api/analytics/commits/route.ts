import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

function fileToLabel(p: string): string | null {
  if (p.includes('ItemDetailModal'))        return 'item detail popup';
  if (p.includes('outfits/inspire'))        return 'inspiration photo outfit';
  if (p.includes('outfits/match'))          return 'match-a-piece';
  if (p.includes('outfits/suggest'))        return 'AI outfit suggestions';
  if (p.includes('analytics/commits'))      return 'activity chart';
  if (p.includes('outfits/page'))           return 'outfits page';
  if (p.includes('analytics/page'))         return 'analytics page';
  if (p.includes('analytics/route'))        return 'analytics data';
  if (p.includes('ItemCard'))               return 'item cards';
  if (p.includes('EditItemModal'))          return 'edit item';
  if (p.includes('ManualAddModal'))         return 'manual add';
  if (p.includes('LibraryBrowser'))         return 'photo library browser';
  if (p.includes('Navigation'))             return 'navigation';
  if (p.includes('globals.css'))            return 'styling';
  if (p.includes('layout.tsx'))             return 'app layout';
  if (p.includes('app/page.tsx'))           return 'closet page';
  if (p.includes('api/items'))              return 'items API';
  if (p.includes('api/upload'))             return 'photo upload';
  if (p.includes('api/outfits'))            return 'outfits API';
  if (p.includes('api/photos-library'))     return 'photo library';
  if (p.includes('api/reference-photo'))    return 'reference photo';
  if (p.includes('enrich'))                 return 'product enrichment';
  if (p.includes('analyze'))               return 'item analysis';
  if (p.includes('lib/db'))                 return 'database';
  return null;
}

export async function GET() {
  try {
    // One git call: commit date header followed by changed file names
    const raw = execSync(
      'git log --pretty=format:"COMMIT:%ad" --date=short --name-only',
      { cwd: process.cwd(), encoding: 'utf8' }
    );

    const countByDay: Record<string, number> = {};
    const featuresByDay: Record<string, Set<string>> = {};
    let currentDate: string | null = null;

    for (const line of raw.split('\n')) {
      if (line.startsWith('COMMIT:')) {
        currentDate = line.slice(7).trim();
        countByDay[currentDate] = (countByDay[currentDate] || 0) + 1;
        if (!featuresByDay[currentDate]) featuresByDay[currentDate] = new Set();
      } else if (currentDate && line.trim()) {
        const label = fileToLabel(line.trim());
        if (label) featuresByDay[currentDate].add(label);
      }
    }

    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        count: countByDay[key] || 0,
        features: featuresByDay[key] ? Array.from(featuresByDay[key]) : [],
      });
    }

    return NextResponse.json(days);
  } catch {
    return NextResponse.json([]);
  }
}
