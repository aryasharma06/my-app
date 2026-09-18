'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CoatHanger, GridFour, Swatches, ChartPie } from '@phosphor-icons/react';

const links = [
  { href: '/', label: 'Closet', Icon: GridFour },
  { href: '/outfits', label: 'Outfits', Icon: Swatches },
  { href: '/analytics', label: 'Analytics', Icon: ChartPie },
];

export default function Navigation() {
  const path = usePathname();
  return (
    <header className="border-b border-border sticky top-0 z-50" style={{ background: '#F9F9F7' }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <CoatHanger size={22} weight="duotone" color="#2D5016" />
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: '#1A2E1A' }}>
            My Closet
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-medium tracking-widest uppercase transition-colors"
                style={{
                  background: active ? '#EFF3EC' : 'transparent',
                  color: active ? '#2D5016' : '#6B8F5E',
                }}
              >
                <Icon size={16} weight="duotone" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
