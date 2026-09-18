'use client';

import { useEffect, useState } from 'react';
import { Swatches, Plus, X, Sparkle, Spinner, Check } from '@phosphor-icons/react';
import ItemCard, { Item } from '../components/ItemCard';
import Image from 'next/image';

interface Outfit {
  id: number;
  name: string;
  items: Item[];
  created_at: string;
}

interface Suggestion {
  name: string;
  reason: string;
  items: Item[];
}

function OutfitStrip({ outfit }: { outfit: { name: string; items: Item[] } }) {
  return (
    <div className="rounded overflow-hidden" style={{ border: '0.5px solid #D4DDD0', background: '#fff' }}>
      <div className="px-5 py-4 flex items-baseline gap-3" style={{ borderBottom: '0.5px solid #D4DDD0' }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A2E1A' }}>{outfit.name}</span>
        <span style={{ fontSize: 11, color: '#6B8F5E', letterSpacing: '0.06em' }}>{outfit.items.length} pieces</span>
      </div>
      <div className="flex gap-3 p-4 overflow-x-auto">
        {outfit.items.map((item) => (
          <div key={item.id} className="flex-shrink-0 w-28">
            <div className="relative w-28 rounded overflow-hidden" style={{ aspectRatio: '3/4', background: '#EFF3EC' }}>
              {item.image_path && item.image_path !== '/uploads/placeholder.jpg' ? (
                <Image src={item.image_path} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="112px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Swatches size={28} weight="duotone" color="#6B8F5E" />
                </div>
              )}
            </div>
            <p className="mt-1.5" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 13, color: '#1A2E1A', lineHeight: 1.3 }}>{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OutfitsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [outfitName, setOutfitName] = useState('');
  const [building, setBuilding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [suggestionError, setSuggestionError] = useState('');
  const [savingSuggestion, setSavingSuggestion] = useState(false);
  const [savedSuggestion, setSavedSuggestion] = useState(false);

  useEffect(() => {
    fetch('/api/items').then((r) => r.json()).then(setItems);
    fetch('/api/outfits').then((r) => r.json()).then(setOutfits);
  }, []);

  function toggleItem(id: number) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function saveManualOutfit() {
    if (!outfitName.trim() || !selected.length) return;
    setSaving(true);
    await fetch('/api/outfits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: outfitName, itemIds: selected }),
    });
    const updated = await fetch('/api/outfits').then((r) => r.json());
    setOutfits(updated);
    setSelected([]);
    setOutfitName('');
    setBuilding(false);
    setSaving(false);
  }

  async function generateSuggestion() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setSuggestion(null);
    setSuggestionError('');
    setSavedSuggestion(false);
    try {
      const res = await fetch('/api/outfits/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: prompt }),
      });
      const data = await res.json();
      if (data.error) { setSuggestionError(data.error); return; }
      setSuggestion(data);
    } catch {
      setSuggestionError('Something went wrong. Check your API key in .env.local.');
    } finally {
      setGenerating(false);
    }
  }

  async function saveSuggestion() {
    if (!suggestion) return;
    setSavingSuggestion(true);
    await fetch('/api/outfits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: suggestion.name, itemIds: suggestion.items.map((i) => i.id) }),
    });
    const updated = await fetch('/api/outfits').then((r) => r.json());
    setOutfits(updated);
    setSavedSuggestion(true);
    setSavingSuggestion(false);
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 6 }}>
            {outfits.length} outfits
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#1A2E1A', lineHeight: 1 }}>
            Outfits
          </h1>
        </div>
        <button
          onClick={() => { setBuilding((b) => !b); setSuggestion(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
          style={{ background: building ? '#EFF3EC' : '#2D5016', color: building ? '#2D5016' : '#F9F9F7' }}
        >
          {building ? <X size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
          {building ? 'Cancel' : 'New outfit'}
        </button>
      </div>

      {/* AI outfit generator */}
      <div className="mb-8 rounded-sm p-5" style={{ background: '#EFF3EC', border: '0.5px solid #D4DDD0' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkle size={16} weight="duotone" color="#2D5016" />
          <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2D5016', fontWeight: 500 }}>
            Build an outfit with AI
          </span>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Describe what you need, e.g. a relaxed Sunday brunch look"
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setSuggestion(null); setSavedSuggestion(false); }}
            onKeyDown={(e) => e.key === 'Enter' && generateSuggestion()}
            className="flex-1 px-4 py-2.5 rounded-sm text-sm outline-none"
            style={{ background: '#fff', border: '0.5px solid #D4DDD0', color: '#1A2E1A' }}
          />
          <button
            onClick={generateSuggestion}
            disabled={generating || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
            style={{ background: '#2D5016', color: '#F9F9F7', opacity: (!prompt.trim() || generating) ? 0.5 : 1 }}
          >
            {generating ? <Spinner size={14} weight="bold" className="animate-spin" /> : <Sparkle size={14} weight="duotone" />}
            {generating ? 'Thinking...' : 'Suggest'}
          </button>
        </div>

        {suggestionError && (
          <p className="mt-3" style={{ fontSize: 13, color: '#C4735A' }}>{suggestionError}</p>
        )}

        {suggestion && (
          <div className="mt-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A2E1A', marginBottom: 4 }}>{suggestion.name}</p>
                <p style={{ fontSize: 13, color: '#6B8F5E', lineHeight: 1.6 }}>{suggestion.reason}</p>
              </div>
              <button
                onClick={saveSuggestion}
                disabled={savingSuggestion || savedSuggestion}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium tracking-widest uppercase"
                style={{
                  background: savedSuggestion ? '#EFF3EC' : '#2D5016',
                  color: savedSuggestion ? '#2D5016' : '#F9F9F7',
                  opacity: savingSuggestion ? 0.6 : 1,
                }}
              >
                {savingSuggestion ? <Spinner size={13} weight="bold" className="animate-spin" /> : <Check size={13} weight="bold" />}
                {savedSuggestion ? 'Saved' : 'Save outfit'}
              </button>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
              {suggestion.items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual outfit builder */}
      {building && (
        <div className="mb-8 p-6 rounded-sm" style={{ background: '#fff', border: '0.5px solid #D4DDD0' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 16 }}>
            Select pieces manually
          </p>
          <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} selectable selected={selected.includes(item.id)} onSelect={() => toggleItem(item.id)} />
            ))}
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Outfit name"
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-sm text-sm outline-none"
              style={{ background: '#F9F9F7', border: '0.5px solid #D4DDD0', color: '#1A2E1A' }}
            />
            <button
              onClick={saveManualOutfit}
              disabled={!outfitName.trim() || !selected.length || saving}
              className="px-5 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
              style={{ background: '#2D5016', color: '#F9F9F7', opacity: (!outfitName.trim() || !selected.length) ? 0.4 : 1 }}
            >
              {saving ? 'Saving...' : `Save (${selected.length} pieces)`}
            </button>
          </div>
        </div>
      )}

      {outfits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Swatches size={48} weight="duotone" color="#D4DDD0" />
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#6B8F5E', fontWeight: 300 }}>
            No saved outfits yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {outfits.map((outfit) => (
            <OutfitStrip key={outfit.id} outfit={outfit} />
          ))}
        </div>
      )}
    </div>
  );
}
