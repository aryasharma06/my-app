'use client';

import Image from 'next/image';
import { X, PencilSimple, ArrowSquareOut, Star, CoatHanger, TShirt, Pants, Dress, Sneaker, Handbag, Sparkle } from '@phosphor-icons/react';
import { Item } from './ItemCard';

interface Props {
  item: Item;
  onClose: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
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

function Tag({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        borderRadius: 2,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E' }}>{label}</p>
      <div>{children}</div>
    </div>
  );
}

export default function ItemDetailModal({ item, onClose, onEdit, onToggleFavorite }: Props) {
  const Icon = TYPE_ICONS[item.type] ?? CoatHanger;

  const seasons = item.season ? item.season.split(',').map(s => s.trim()).filter(Boolean) : [];
  const occasions = item.occasion ? item.occasion.split(',').map(s => s.trim()).filter(Boolean) : [];

  const hasProductImage = !!item.product_image_url;
  const hasOriginalImage = item.image_path && item.image_path !== '/uploads/placeholder.jpg';
  const showImage = hasProductImage || hasOriginalImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,26,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative flex rounded overflow-hidden"
        style={{
          background: '#F9F9F7',
          maxWidth: 780,
          width: '100%',
          maxHeight: '90vh',
          boxShadow: '0 24px 60px rgba(26,46,26,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image panel */}
        <div
          className="flex-shrink-0 relative"
          style={{ width: 300, background: '#EFF3EC' }}
        >
          {showImage ? (
            hasProductImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.product_image_url!}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#fff' }}
              />
            ) : (
              <Image
                src={item.image_path}
                alt={item.name}
                fill
                style={{ objectFit: 'cover' }}
                sizes="300px"
              />
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon size={64} weight="duotone" color="#6B8F5E" />
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="flex flex-col flex-1 overflow-y-auto" style={{ padding: '32px 28px' }}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 6 }}>
                {item.type}
              </p>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 400, color: '#1A2E1A', lineHeight: 1.2, marginBottom: 6 }}>
                {item.name}
              </h2>
              {(item.brand && item.brand !== 'Unknown') && (
                <p style={{ fontSize: 13, color: '#6B8F5E' }}>{item.brand}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-sm flex-shrink-0"
              style={{ background: '#EFF3EC', color: '#6B8F5E' }}
              aria-label="Close"
            >
              <X size={14} weight="bold" />
            </button>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5 flex-1">
            {item.price_estimate ? (
              <Row label="Estimated price">
                <p style={{ fontSize: 15, color: '#1A2E1A' }}>${Math.round(item.price_estimate)}</p>
              </Row>
            ) : null}

            {item.color ? (
              <Row label="Color">
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-full flex-shrink-0"
                    style={{ width: 16, height: 16, background: item.color, border: '0.5px solid #D4DDD0' }}
                  />
                  <p style={{ fontSize: 14, color: '#1A2E1A' }}>{item.color}</p>
                </div>
              </Row>
            ) : null}

            {seasons.length > 0 && (
              <Row label="Season">
                <div className="flex flex-wrap gap-1.5">
                  {seasons.map(s => (
                    <Tag key={s} label={s} style={{ background: '#EFF3EC', color: '#2D5016' }} />
                  ))}
                </div>
              </Row>
            )}

            {occasions.length > 0 && (
              <Row label="Occasion">
                <div className="flex flex-wrap gap-1.5">
                  {occasions.map(o => (
                    <Tag key={o} label={o} style={{ background: '#FAE8E2', color: '#C4735A' }} />
                  ))}
                </div>
              </Row>
            )}

            {item.notes ? (
              <Row label="Notes">
                <p style={{ fontSize: 14, color: '#1A2E1A', lineHeight: 1.5 }}>{item.notes}</p>
              </Row>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-8 pt-6" style={{ borderTop: '0.5px solid #D4DDD0' }}>
            <button
              onClick={onToggleFavorite}
              className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
              style={{ background: '#EFF3EC', color: item.is_favorite ? '#C4735A' : '#6B8F5E', border: '0.5px solid #D4DDD0' }}
            >
              <Star size={13} weight={item.is_favorite ? 'fill' : 'regular'} />
              {item.is_favorite ? 'Favorited' : 'Favorite'}
            </button>
            <button
              onClick={() => { onClose(); onEdit(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
              style={{ background: '#EFF3EC', color: '#2D5016', border: '0.5px solid #D4DDD0' }}
            >
              <PencilSimple size={13} weight="duotone" />
              Edit
            </button>
            {item.product_url && (
              <a
                href={item.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase ml-auto"
                style={{ background: '#2D5016', color: '#F9F9F7' }}
              >
                <ArrowSquareOut size={13} weight="duotone" />
                View product
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
