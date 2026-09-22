import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  try {
    const raw = execSync('git log --format="%ad" --date=short', {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    const counts: Record<string, number> = {};
    for (const line of raw.trim().split('\n').filter(Boolean)) {
      counts[line] = (counts[line] || 0) + 1;
    }

    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: counts[key] || 0 });
    }

    return NextResponse.json(days);
  } catch {
    return NextResponse.json([]);
  }
}
