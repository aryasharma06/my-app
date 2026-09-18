'use client';

import { useState } from 'react';
import { X, FloppyDisk, Spinner } from '@phosphor-icons/react';

interface Item {
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
  onClose: () => void;
  onSave: (updated: Item) => void;
}

const TYPE_OPTIONS = ['top', 'bottom', 'dress', 'shoes', 'bag', 'accessory', 'outerwear', 'jumpsuit'];
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
    ranking: item.ranking ?? 3,
    notes: item.notes ?? '',
    product_image_url: item.product_image_url ?? '',
    product_url: item.product_url ?? '',
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price_estimate: form.price_estimate === '' ? null : Number(form.price_estimate),
        ranking: Number(form.ranking),
        product_image_url: form.product_image_url || null,
        product_url: form.product_url || null,
      }),
    });
    const updated = await res.json();
    setSaving(false);
    onSave(updated);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,46,26,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded overflow-hidden" style={{ background: '#F9F9F7', border: '0.5px solid #D4DDD0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '0.5px solid #D4DDD0' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A2E1A' }}>Edit item</span>
          <button onClick={onClose} style={{ color: '#6B8F5E' }}>
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p style={labelStyle}>Season</p>
              <input style={inputStyle} value={form.season} onChange={e => set('season', e.target.value)} placeholder="e.g. spring, summer" />
            </div>
            <div>
              <p style={labelStyle}>Occasion</p>
              <input style={inputStyle} value={form.occasion} onChange={e => set('occasion', e.target.value)} placeholder="e.g. casual, office" />
            </div>
          </div>

          <div>
            <p style={labelStyle}>Ranking (1-5)</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => set('ranking', n)}
                  style={{
                    width: 36, height: 36, borderRadius: 2, border: '0.5px solid #D4DDD0',
                    background: form.ranking >= n ? '#2D5016' : '#EFF3EC',
                    color: form.ranking >= n ? '#F9F9F7' : '#6B8F5E',
                    fontSize: 14,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={labelStyle}>Notes</p>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div style={{ borderTop: '0.5px solid #D4DDD0', paddingTop: 16 }}>
            <p style={{ ...labelStyle, marginBottom: 12 }}>Product data (from web search)</p>
            <div className="flex flex-col gap-3">
              <div>
                <p style={labelStyle}>Product image URL</p>
                <input style={inputStyle} value={form.product_image_url} onChange={e => set('product_image_url', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <p style={labelStyle}>Product page URL</p>
                <input style={inputStyle} value={form.product_url} onChange={e => set('product_url', e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '0.5px solid #D4DDD0' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm text-xs font-medium tracking-widest uppercase"
            style={{ background: '#EFF3EC', color: '#2D5016' }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-sm text-xs font-medium tracking-widest uppercase"
            style={{ background: '#2D5016', color: '#F9F9F7', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <Spinner size={13} weight="bold" className="animate-spin" /> : <FloppyDisk size={13} weight="duotone" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
