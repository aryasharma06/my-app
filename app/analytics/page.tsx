'use client';

import { useEffect, useState } from 'react';
import { ChartPie, Tag, Sun, Briefcase, CurrencyDollar, Star } from '@phosphor-icons/react';


interface Analytics {
  count: number;
  totalValue: number;
  avgRanking: number;
  byType: Record<string, number>;
  byBrand: Record<string, number>;
  byColor: Record<string, number>;
  bySeason: Record<string, number>;
  byOccasion: Record<string, number>;
}

function Bar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span style={{ fontSize: 12, color: '#6B8F5E', minWidth: 90, textTransform: 'capitalize' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#EFF3EC' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, color: '#1A2E1A', minWidth: 24, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

function Section({ icon, title, data, color }: { icon: React.ReactNode; title: string; data: Record<string, number>; color: string }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = sorted[0]?.[1] ?? 1;
  return (
    <div className="rounded p-5 flex flex-col gap-4" style={{ background: '#fff', border: '0.5px solid #D4DDD0' }}>
      <div className="flex items-center gap-2">
        {icon}
        <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B8F5E', fontWeight: 500 }}>{title}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {sorted.map(([k, v]) => <Bar key={k} label={k} count={v} max={max} color={color} />)}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch('/api/analytics').then((r) => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center py-24">
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#6B8F5E', fontWeight: 300 }}>Loading...</p>
    </div>
  );

  if (data.count === 0) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <ChartPie size={48} weight="duotone" color="#D4DDD0" />
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#6B8F5E', fontWeight: 300 }}>
        Add items to your closet to see analytics.
      </p>
    </div>
  );

  const stats = [
    { label: 'Total pieces', value: data.count, icon: <ChartPie size={18} weight="duotone" color="#2D5016" /> },
    { label: 'Estimated value', value: `$${Math.round(data.totalValue).toLocaleString()}`, icon: <CurrencyDollar size={18} weight="duotone" color="#2D5016" /> },
    { label: 'Average rating', value: `${data.avgRanking.toFixed(1)} / 5`, icon: <Star size={18} weight="duotone" color="#2D5016" /> },
  ];

  return (
    <div>
      <div className="mb-8">
        <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 6 }}>
          Your collection
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#1A2E1A', lineHeight: 1 }}>
          Analytics
        </h1>
      </div>

      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="rounded p-5" style={{ background: '#fff', border: '0.5px solid #D4DDD0' }}>
            <div className="flex items-center gap-2 mb-2">{icon}
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E' }}>{label}</span>
            </div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#1A2E1A', fontWeight: 400 }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        <Section icon={<ChartPie size={16} weight="duotone" color="#6B8F5E" />} title="By type" data={data.byType} color="#2D5016" />
        <Section icon={<Sun size={16} weight="duotone" color="#6B8F5E" />} title="By season" data={data.bySeason} color="#4A7A28" />
        <Section icon={<Briefcase size={16} weight="duotone" color="#6B8F5E" />} title="By occasion" data={data.byOccasion} color="#F2B5A0" />
        <Section icon={<Tag size={16} weight="duotone" color="#6B8F5E" />} title="By brand" data={data.byBrand} color="#6B8F5E" />
      </div>
    </div>
  );
}
