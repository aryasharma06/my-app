'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TrashSimple, TShirt, Pants, Dress, Sneaker, Handbag, Sparkle, CoatHanger, PencilSimple, Spinner, ArrowSquareOut, ArrowClockwise, Star } from '@phosphor-icons/react';

export interface Item {
  id: number;
  image_path: string;
  product_image_url: string | null;
  product_url: string | null;
  is_favorite: number;
  name: string;
  type: string;
  color: string;
  brand: string;
  price_estimate: number;
  season: string;
  occasion: string;
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
  onToggleFavorite?: () => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  top: TShirt,
  shirt: TShirt,
  sweater: CoatHanger,
  bottom: Pants,
  dress: Dress,
  jumpsuit: Dress,
  shoes: Sneaker,
  bag: Handbag,
  accessory: Sparkle,
  outerwear: CoatHanger,
};

const BADGE: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '3px 0',
  borderRadius: 2,
  width: 72,
  textAlign: 'center',
  display: 'inline-block',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

function Placeholder({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type] ?? CoatHanger;
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#EFF3EC' }}>
      <Icon size={40} weight="duotone" color="#6B8F5E" />
    </div>
  );
}

export default function ItemCard({ item, enriching, selectable, selected, onSelect, onDelete, onEdit, onRefresh, onToggleFavorite }: Props) {
  const [imgError, setImgError] = useState(false);
  const [productImgError, setProductImgError] = useState(false);

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

        {/* Star button — always visible, top-left */}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="absolute top-2 left-2 p-1.5 rounded-sm"
            style={{ background: 'rgba(255,255,255,0.85)' }}
            aria-label={item.is_favorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star
              size={14}
              weight={item.is_favorite ? 'fill' : 'regular'}
              color={item.is_favorite ? '#C4735A' : '#D4DDD0'}
            />
          </button>
        )}

        {/* Action buttons — top-right, visible on hover */}
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

      <div className="p-3 flex flex-col justify-between" style={{ height: 96 }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#1A2E1A', fontWeight: 400, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</p>
          <p style={{ fontSize: 11, color: '#6B8F5E', marginTop: 2 }}>
            {[
              item.brand && item.brand !== 'Unknown' ? item.brand : null,
              item.price_estimate ? `Est. $${Math.round(item.price_estimate)}` : null,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex gap-1">
          {firstSeason && (
            <span style={{ ...BADGE, background: '#EFF3EC', color: '#2D5016' }}>{firstSeason}</span>
          )}
          {firstOccasion && (
            <span style={{ ...BADGE, background: '#FAE8E2', color: '#C4735A' }}>{firstOccasion}</span>
          )}
        </div>
      </div>
    </div>
  );
}
