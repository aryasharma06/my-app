'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TrashSimple, TShirt, Pants, Dress, Sneaker, Handbag, Sparkle, CoatHanger, PencilSimple, Spinner, ArrowSquareOut, ArrowClockwise } from '@phosphor-icons/react';

export interface Item {
  id: number;
  image_path: string;
  product_image_url: string | null;
  product_url: string | null;
  name: string;
  type: string;
  color: string;
  brand: string;
  price_estimate: number;
  season: string;
  occasion: string;
  ranking: number;
  notes: string;
}

interface Props {
  item: Item;
  enriching?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onRefresh?: () => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  top: TShirt,
  bottom: Pants,
  dress: Dress,
  jumpsuit: Dress,
  shoes: Sneaker,
  bag: Handbag,
  accessory: Sparkle,
  outerwear: CoatHanger,
};

function Placeholder({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type] ?? CoatHanger;
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#EFF3EC' }}>
      <Icon size={40} weight="duotone" color="#6B8F5E" />
    </div>
  );
}

export default function ItemCard({ item, enriching, selectable, selected, onSelect, onDelete, onEdit, onRefresh }: Props) {
  const [imgError, setImgError] = useState(false);
  const [productImgError, setProductImgError] = useState(false);

  const stars = Array.from({ length: 5 }, (_, i) => i < item.ranking ? '★' : '☆').join('');
  const firstOccasion = item.occasion?.split(',')[0]?.trim();
  const firstSeason = item.season?.split(',')[0]?.trim();

  const hasProductImage = item.product_image_url && !productImgError;
  const hasOriginalImage = item.image_path && item.image_path !== '/uploads/placeholder.jpg' && !imgError;

  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className="rounded overflow-hidden flex flex-col transition-all"
      style={{
        background: '#fff',
        border: selected ? '2px solid #2D5016' : '0.5px solid #D4DDD0',
        cursor: selectable ? 'pointer' : 'default',
      }}
    >
      <div className="relative" style={{ aspectRatio: '3/4', background: '#EFF3EC' }}>
        {hasProductImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.product_image_url!}
            alt={item.name}
            onError={() => setProductImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#fff' }}
          />
        ) : hasOriginalImage ? (
          <Image
            src={item.image_path}
            alt={item.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <Placeholder type={item.type} />
        )}

        {enriching && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(249,249,247,0.85)' }}>
            <Spinner size={20} weight="bold" color="#2D5016" className="animate-spin" />
            <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B8F5E' }}>Finding product</span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRefresh && !enriching && (
            <button
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}
              className="p-1.5 rounded-sm"
              style={{ background: 'rgba(255,255,255,0.9)' }}
              aria-label="Search for product image"
              title="Find product image"
            >
              <ArrowClockwise size={13} weight="duotone" color="#2D5016" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-sm"
              style={{ background: 'rgba(255,255,255,0.9)' }}
              aria-label="Edit item"
            >
              <PencilSimple size={13} weight="duotone" color="#2D5016" />
            </button>
          )}
          {item.product_url && (
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-sm"
              style={{ background: 'rgba(255,255,255,0.9)' }}
              aria-label="View product"
            >
              <ArrowSquareOut size={13} weight="duotone" color="#2D5016" />
            </a>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-sm"
              style={{ background: 'rgba(255,255,255,0.9)' }}
              aria-label="Delete item"
            >
              <TrashSimple size={13} weight="duotone" color="#C4735A" />
            </button>
          )}
        </div>

        {selected && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(45,80,22,0.15)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#2D5016' }}>
              <span style={{ color: '#fff', fontSize: 14 }}>✓</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#1A2E1A', fontWeight: 400 }}>{item.name}</p>
        <p style={{ fontSize: 11, color: '#6B8F5E' }}>
          {item.brand !== 'Unknown' ? item.brand : ''}{item.brand !== 'Unknown' && item.price_estimate ? ' · ' : ''}
          {item.price_estimate ? `Est. $${Math.round(item.price_estimate)}` : ''}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {firstSeason && (
              <span style={{ background: '#EFF3EC', color: '#2D5016', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2 }}>
                {firstSeason}
              </span>
            )}
            {firstOccasion && (
              <span style={{ background: '#FAE8E2', color: '#C4735A', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2 }}>
                {firstOccasion}
              </span>
            )}
          </div>
          <span style={{ color: '#C4735A', fontSize: 11, letterSpacing: 1 }}>{stars}</span>
        </div>
      </div>
    </div>
  );
}
