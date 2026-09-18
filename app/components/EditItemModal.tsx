'use client';

import { useRef, useState } from 'react';
import { X, FloppyDisk, Spinner, UploadSimple } from '@phosphor-icons/react';

import type { Item } from './ItemCard';
import CheckboxGroup from './CheckboxGroup';

interface Props {
  item: Item;
  onClose: () => void;
  onSave: (updated: Item) => void;
}

const TYPE_OPTIONS = ['top', 'bottom', 'dress', 'shoes', 'bag', 'accessory', 'outerwear', 'jumpsuit'];
const SEASON_OPTIONS = ['spring', 'summer', 'autumn', 'winter', 'all-season'];
const OCCASION_OPTIONS = ['casual', 'office', 'smart casual', 'evening', 'formal', 'weekend', 'brunch', 'party', 'travel', 'beach', 'sport'];
const labelStyle = { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6B8F5E', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 2, border: '0.5px solid #D4DDD0', background: '#F9F9F7', color: '#1A2E1A', fontSize: 13, outline: 'none' };

export default function EditItemModal({ item, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: item.name ?? '',
    type: item.type ?? 'top',
    color: item.color ?? '',
    brand: item.brand ?? '',
    price_estimate: item.price_estimate != null ? String(item.price_estimate) : '',
    season: item.season ?? '',
    occasion: item.occasion ?? '',
    notes: item.notes ?? '',
    product_url: item.product_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(item.product_image_url);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState('');
  const imgFileRef = useRef<HTMLInputElement>(null);

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    setPendingImageUrl('');
    setPreviewImage(URL.createObjectURL(file));
  }

  async function save() {
    setSaving(true);
    try {
      // If a new image was selected, upload it first
      if (pendingImageFile || pendingImageUrl.trim()) {
        const imgForm = new FormData();
        if (pendingImageFile) imgForm.append('file', pendingImageFile);
        else imgForm.append('url', pendingImageUrl.trim());
        await fetch(`/api/items/${item.id}/image`, { method: 'POST', body: imgForm });
      }

      // Save all other fields
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price_estimate: form.price_estimate === '' ? null : Number(form.price_estimate),
          product_url: form.product_url || null,
        }),
      });
      const updated = await res.json();
      onSave(updated);
    } finally {
      setSaving(false);
    }
  }

  const displayImage = previewImage ?? item.image_path;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,26,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded overflow-hidden" style={{ background: '#F9F9F7', border: '0.5px solid #D4DDD0', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header with Save */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '0.5px solid #D4DDD0' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A2E1A' }}>Edit item</span>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium tracking-widest uppercase"
              style={{ background: '#2D5016', color: '#F9F9F7', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? <Spinner size={12} weight="bold" className="animate-spin" /> : <FloppyDisk size={12} weight="duotone" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="p-1" style={{ color: '#6B8F5E' }}>
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Product image */}
          <div>
            <p style={labelStyle}>Product image</p>
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 rounded overflow-hidden" style={{ width: 72, height: 72, background: '#EFF3EC', border: '0.5px solid #D4DDD0' }}>
                {displayImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <button
                  onClick={() => imgFileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium tracking-widest uppercase"
                  style={{ background: '#EFF3EC', color: '#2D5016', border: '0.5px solid #D4DDD0' }}
                >
                  <UploadSimple size={13} weight="duotone" />
                  Upload image
                </button>
                <input
                  style={{ ...inputStyle, fontSize: 12 }}
                  placeholder="Or paste image URL..."
                  value={pendingImageUrl}
                  onChange={e => { setPendingImageUrl(e.target.value); setPendingImageFile(null); if (e.target.value) setPreviewImage(e.target.value); }}
                />
                {(pendingImageFile || pendingImageUrl) && (
                  <p style={{ fontSize: 11, color: '#6B8F5E' }}>Image will be saved when you click Save.</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '0.5px solid #D4DDD0' }} />

          <div>
            <p style={labelStyle}>Name</p>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p style={labelStyle}>Type</p>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <p style={labelStyle}>Color</p>
              <input style={inputStyle} value={form.color} onChange={e => set('color', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p style={labelStyle}>Brand</p>
              <input style={inputStyle} value={form.brand} onChange={e => set('brand', e.target.value)} />
            </div>
            <div>
              <p style={labelStyle}>Est. price (USD)</p>
              <input style={inputStyle} type="number" value={form.price_estimate} onChange={e => set('price_estimate', e.target.value)} />
            </div>
          </div>

          <div>
            <p style={labelStyle}>Season</p>
            <CheckboxGroup options={SEASON_OPTIONS} value={form.season} onChange={v => set('season', v)} />
          </div>

          <div>
            <p style={labelStyle}>Occasion</p>
            <CheckboxGroup options={OCCASION_OPTIONS} value={form.occasion} onChange={v => set('occasion', v)} />
          </div>

          <div>
            <p style={labelStyle}>Notes</p>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div>
            <p style={labelStyle}>Product page URL</p>
            <input style={inputStyle} value={form.product_url} onChange={e => set('product_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </div>
    </div>
  );
}
