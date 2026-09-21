'use client';

import { useEffect, useState } from 'react';
import { ChartPie, Tag, Sun, Briefcase, X, Palette } from '@phosphor-icons/react';
import Image from 'next/image';
import { Item } from '../components/ItemCard';

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

type FilterKey = 'type' | 'brand' | 'season' | 'occasion' | 'color';

interface DrillDownConfig {
  title: string;
  accentColor: string;
  data: Record<string, number>;
  filterKey: FilterKey;
}

function Bar({ label, count, max, color, swatch }: { label: string; count: number; max: number; color: string; swatch?: string }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  const barColor = swatch ?? color;
  return (
    <div className="flex items-center gap-2.5">
      {swatch && (
        <div className="flex-shrink-0 rounded-full" style={{ width: 10, height: 10, background: swatch, border: '0.5px solid rgba(0,0,0,0.12)' }} />
      )}
      <span style={{ fontSize: 12, color: '#6B8F5E', minWidth: 80, textTransform: 'capitalize' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#EFF3EC' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span style={{ fontSize: 12, color: '#1A2E1A', minWidth: 24, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

function Section({ icon, title, data, color, useSwatches, onClick }: {
  icon: React.ReactNode; title: string; data: Record<string, number>; color: string; useSwatches?: boolean; onClick: () => void;
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = sorted[0]?.[1] ?? 1;
  return (
    <button
      onClick={onClick}
      className="rounded p-5 flex flex-col gap-4 text-left w-full transition-all"
      style={{ background: '#fff', border: '0.5px solid #D4DDD0', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#D4DDD0')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B8F5E', fontWeight: 500 }}>{title}</span>
        </div>
        <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4DDD0' }}>View all</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {sorted.map(([k, v]) => <Bar key={k} label={k} count={v} max={max} color={color} swatch={useSwatches ? k : undefined} />)}
      </div>
    </button>
  );
}

function DrillDownModal({ config, items, onClose }: { config: DrillDownConfig; items: Item[]; onClose: () => void }) {
  const sorted = Object.entries(config.data).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;
  const [selected, setSelected] = useState<string>(sorted[0]?.[0] ?? '');

  const filteredItems = items.filter(item => {
    const val = item[config.filterKey as keyof Item] as string | undefined;
    if (config.filterKey === 'season' || config.filterKey === 'occasion') {
      return (val || '').split(',').map(s => s.trim()).includes(selected);
    }
    return String(val || 'Unknown').trim() === selected;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(26,46,26,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded overflow-hidden"
        style={{ background: '#F9F9F7', width: '100%', maxWidth: 800, maxHeight: '85vh', boxShadow: '0 24px 60px rgba(26,46,26,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: '0.5px solid #D4DDD0' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#1A2E1A', fontWeight: 400 }}>
            {config.title}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-sm"
            style={{ background: '#EFF3EC' }}
            aria-label="Close"
          >
            <X size={13} weight="bold" color="#6B8F5E" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: full bar list */}
          <div className="overflow-y-auto p-4 flex flex-col gap-1" style={{ width: 220, borderRight: '0.5px solid #D4DDD0', flexShrink: 0 }}>
            {sorted.map(([k, v]) => {
              const pct = Math.round((v / max) * 100);
              const isSelected = k === selected;
              return (
                <button
                  key={k}
                  onClick={() => setSelected(k)}
                  className="flex flex-col gap-1.5 px-3 py-2.5 rounded-sm text-left w-full transition-all"
                  style={{
                    background: isSelected ? '#EFF3EC' : 'transparent',
                    border: `0.5px solid ${isSelected ? config.accentColor : 'transparent'}`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {config.filterKey === 'color' && (
                        <div className="flex-shrink-0 rounded-full" style={{ width: 10, height: 10, background: k, border: '0.5px solid rgba(0,0,0,0.12)' }} />
                      )}
                      <span style={{ fontSize: 12, color: isSelected ? '#1A2E1A' : '#6B8F5E', textTransform: 'capitalize', fontWeight: isSelected ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {k}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: config.accentColor, flexShrink: 0 }}>{v}</span>
                  </div>
                  <div className="h-1 rounded-full w-full" style={{ background: '#EFF3EC' }}>
                    <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: config.filterKey === 'color' ? k : (isSelected ? config.accentColor : '#D4DDD0') }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: item thumbnails */}
          <div className="flex-1 overflow-y-auto p-5">
            <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 14 }}>
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} — <span style={{ textTransform: 'capitalize' }}>{selected}</span>
            </p>
            {filteredItems.length === 0 ? (
              <p style={{ fontSize: 13, color: '#D4DDD0' }}>No items found.</p>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                {filteredItems.map(item => {
                  const hasProductImg = !!item.product_image_url;
                  const hasOrigImg = item.image_path && item.image_path !== '/uploads/placeholder.jpg';
                  return (
                    <div key={item.id}>
                      <div className="relative rounded-sm overflow-hidden" style={{ aspectRatio: '3/4', background: '#EFF3EC' }}>
                        {hasProductImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product_image_url!}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#fff' }}
                          />
                        ) : hasOrigImg ? (
                          <Image src={item.image_path} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="110px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ChartPie size={24} weight="duotone" color="#D4DDD0" />
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 12, color: '#1A2E1A', lineHeight: 1.3 }}>
                        {item.name}
                      </p>
                      {item.brand && item.brand !== 'Unknown' && (
                        <p style={{ fontSize: 10, color: '#6B8F5E' }}>{item.brand}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [drillDown, setDrillDown] = useState<DrillDownConfig | null>(null);

  useEffect(() => {
    fetch('/api/analytics').then((r) => r.json()).then(setData);
    fetch('/api/items').then((r) => r.json()).then(setItems);
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

  const sections: (DrillDownConfig & { icon: React.ReactNode; useSwatches?: boolean })[] = [
    { title: 'By type', accentColor: '#2D5016', data: data.byType, filterKey: 'type', icon: <ChartPie size={16} weight="duotone" color="#6B8F5E" /> },
    { title: 'By season', accentColor: '#4A7A28', data: data.bySeason, filterKey: 'season', icon: <Sun size={16} weight="duotone" color="#6B8F5E" /> },
    { title: 'By occasion', accentColor: '#C4735A', data: data.byOccasion, filterKey: 'occasion', icon: <Briefcase size={16} weight="duotone" color="#6B8F5E" /> },
    { title: 'By brand', accentColor: '#6B8F5E', data: data.byBrand, filterKey: 'brand', icon: <Tag size={16} weight="duotone" color="#6B8F5E" /> },
    { title: 'By color', accentColor: '#6B8F5E', data: data.byColor, filterKey: 'color', useSwatches: true, icon: <Palette size={16} weight="duotone" color="#6B8F5E" /> },
  ];

  return (
    <div>
      {drillDown && (
        <DrillDownModal
          config={drillDown}
          items={items}
          onClose={() => setDrillDown(null)}
        />
      )}

      <div className="mb-8">
        <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 6 }}>
          Your collection
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#1A2E1A', lineHeight: 1 }}>
          Analytics
        </h1>
      </div>

      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        <div className="rounded p-5" style={{ background: '#fff', border: '0.5px solid #D4DDD0' }}>
          <div className="flex items-center gap-2 mb-2">
            <ChartPie size={18} weight="duotone" color="#2D5016" />
            <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E' }}>Total pieces</span>
          </div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#1A2E1A', fontWeight: 400 }}>{data.count}</p>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {sections.map(({ icon, title, accentColor, data: sectionData, filterKey, useSwatches }) => (
          <Section
            key={title}
            icon={icon}
            title={title}
            data={sectionData}
            color={accentColor}
            useSwatches={useSwatches}
            onClick={() => setDrillDown({ title, accentColor, data: sectionData, filterKey })}
          />
        ))}
      </div>
    </div>
  );
}
