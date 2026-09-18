'use client';

import { useRef, useState } from 'react';
import { X, Spinner, UploadSimple, Plus } from '@phosphor-icons/react';
import type { Item } from './ItemCard';
import CheckboxGroup from './CheckboxGroup';

interface Props {
  onClose: () => void;
  onAdd: (item: Item) => void;
}

const TYPE_OPTIONS = ['top', 'bottom', 'dress', 'shoes', 'bag', 'accessory', 'outerwear', 'jumpsuit'];
const SEASON_OPTIONS = ['spring', 'summer', 'autumn', 'winter', 'all-season'];
const OCCASION_OPTIONS = ['casual', 'office', 'evening', 'weekend', 'sport'];
const labelStyle = { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6B8F5E', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 2, border: '0.5px solid #D4DDD0', background: '#F9F9F7', color: '#1A2E1A', fontSize: 13, outline: 'none' };

export default function ManualAddModal({ onClose, onAdd }: Props) {
  const [form, setForm] = useState({
    name: '',
    type: 'top',
    color: '',
    brand: '',
    price_estimate: '',
    season: '',
    occasion: '',
    notes: '',
    product_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState('');
  const imgFileRef = useRef<HTMLInputElement>(null);

  function set(field: string, value: string) {
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
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Create the item
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price_estimate: form.price_estimate === '' ? null : Number(form.price_estimate),
          product_url: form.product_url || null,
          product_image_url: pendingImageUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create item.');
      const newItem: Item = await res.json();

      // If a file was selected, upload it as the product image
      if (pendingImageFile) {
        const imgForm = new FormData();
        imgForm.append('file', pendingImageFile);
        const imgRes = await fetch(`/api/items/${newItem.id}/image`, { method: 'POST', body: imgForm });
        if (imgRes.ok) {
          const updated: Item = await imgRes.json();
          onAdd(updated);
          return;
        }
      }

      onAdd(newItem);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,26,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded overflow-hidden" style={{ background: '#F9F9F7', border: '0.5px solid #D4DDD0', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '0.5px solid #D4DDD0' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A2E1A' }}>Add item manually</span>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium tracking-widest uppercase"
              style={{ background: '#2D5016', color: '#F9F9F7', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? <Spinner size={12} weight="bold" className="animate-spin" /> : <Plus size={12} weight="bold" />}
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button onClick={onClose} className="p-1" style={{ color: '#6B8F5E' }}>
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">

          {error && (
            <div className="px-4 py-3 rounded-sm" style={{ background: '#FAE8E2', border: '0.5px solid #C4735A' }}>
              <p style={{ fontSize: 13, color: '#C4735A' }}>{error}</p>
            </div>
          )}

          {/* Product image */}
          <div>
            <p style={labelStyle}>Product image <span style={{ color: '#D4DDD0', fontWeight: 400 }}>(optional)</span></p>
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 rounded overflow-hidden flex items-center justify-center" style={{ width: 72, height: 72, background: '#EFF3EC', border: '0.5px solid #D4DDD0' }}>
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <UploadSimple size={20} weight="duotone" color="#D4DDD0" />
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
                  onChange={e => {
                    setPendingImageUrl(e.target.value);
                    setPendingImageFile(null);
                    setPreviewImage(e.target.value || null);
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '0.5px solid #D4DDD0' }} />

          <div>
            <p style={labelStyle}>Name <span style={{ color: '#C4735A' }}>*</span></p>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. White linen shirt" />
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
              <input style={inputStyle} value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g. White, Navy" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p style={labelStyle}>Brand</p>
              <input style={inputStyle} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Zara" />
            </div>
            <div>
              <p style={labelStyle}>Est. price (USD)</p>
              <input style={inputStyle} type="number" value={form.price_estimate} onChange={e => set('price_estimate', e.target.value)} placeholder="e.g. 45" />
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
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything worth remembering about this piece..." />
          </div>

          <div>
            <p style={labelStyle}>Product page URL</p>
            <input style={inputStyle} value={form.product_url} onChange={e => set('product_url', e.target.value)} placeholder="https://..." />
          </div>

          <p style={{ fontSize: 11, color: '#6B8F5E', marginTop: -8 }}>
            Items without a product image will appear in the unmatched log below your closet.
          </p>
        </div>
      </div>
    </div>
  );
}
