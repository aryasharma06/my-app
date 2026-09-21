'use client';

import { useEffect, useRef, useState } from 'react';
import { Swatches, Plus, X, Sparkle, Spinner, Check, Image as ImageIcon, ArrowsLeftRight } from '@phosphor-icons/react';
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

interface MatchResult {
  item: Item;
  reason: string;
}

type AIMode = 'describe' | 'inspire' | 'match';

const ITEM_TYPES = ['shirt', 'sweater', 'bottom', 'dress', 'jumpsuit', 'shoes', 'bag', 'accessory', 'outerwear'];

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

function SaveButton({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onSave}
      disabled={saving || saved}
      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium tracking-widest uppercase"
      style={{ background: saved ? '#EFF3EC' : '#2D5016', color: saved ? '#2D5016' : '#F9F9F7', opacity: saving ? 0.6 : 1 }}
    >
      {saving ? <Spinner size={13} weight="bold" className="animate-spin" /> : <Check size={13} weight="bold" />}
      {saved ? 'Saved' : 'Save outfit'}
    </button>
  );
}

export default function OutfitsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [outfitName, setOutfitName] = useState('');
  const [building, setBuilding] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI section
  const [aiMode, setAiMode] = useState<AIMode>('describe');

  // Describe mode
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [suggestionError, setSuggestionError] = useState('');
  const [savingSuggestion, setSavingSuggestion] = useState(false);
  const [savedSuggestion, setSavedSuggestion] = useState(false);

  // Inspire mode
  const inspireFileRef = useRef<HTMLInputElement>(null);
  const [inspireFile, setInspireFile] = useState<File | null>(null);
  const [inspirePreview, setInspirePreview] = useState<string | null>(null);
  const [inspiring, setInspiring] = useState(false);
  const [inspireResult, setInspireResult] = useState<Suggestion | null>(null);
  const [inspireError, setInspireError] = useState('');
  const [savingInspire, setSavingInspire] = useState(false);
  const [savedInspire, setSavedInspire] = useState(false);

  // Match mode
  const [anchorItemId, setAnchorItemId] = useState<number | ''>('');
  const [wantType, setWantType] = useState('shirt');
  const [matchOccasion, setMatchOccasion] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null);
  const [matchError, setMatchError] = useState('');

  useEffect(() => {
    fetch('/api/items').then((r) => r.json()).then(setItems);
    fetch('/api/outfits').then((r) => r.json()).then(setOutfits);
  }, []);

  function switchMode(mode: AIMode) {
    setAiMode(mode);
    setSuggestion(null);
    setSuggestionError('');
    setInspireResult(null);
    setInspireError('');
    setMatchResults(null);
    setMatchError('');
  }

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

  function handleInspireFile(file: File) {
    setInspireFile(file);
    setInspireResult(null);
    setSavedInspire(false);
    const reader = new FileReader();
    reader.onload = (e) => setInspirePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function generateInspireOutfit() {
    if (!inspireFile) return;
    setInspiring(true);
    setInspireResult(null);
    setInspireError('');
    setSavedInspire(false);
    try {
      const form = new FormData();
      form.append('image', inspireFile);
      const res = await fetch('/api/outfits/inspire', { method: 'POST', body: form });
      const data = await res.json();
      if (data.error) { setInspireError(data.error); return; }
      setInspireResult(data);
    } catch {
      setInspireError('Something went wrong. Check your API key in .env.local.');
    } finally {
      setInspiring(false);
    }
  }

  async function saveInspireOutfit() {
    if (!inspireResult) return;
    setSavingInspire(true);
    await fetch('/api/outfits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: inspireResult.name, itemIds: inspireResult.items.map(i => i.id) }),
    });
    const updated = await fetch('/api/outfits').then((r) => r.json());
    setOutfits(updated);
    setSavedInspire(true);
    setSavingInspire(false);
  }

  async function generateMatch() {
    if (!anchorItemId) return;
    setMatching(true);
    setMatchResults(null);
    setMatchError('');
    try {
      const res = await fetch('/api/outfits/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anchorItemId, wantType, occasion: matchOccasion }),
      });
      const data = await res.json();
      if (data.error) { setMatchError(data.error); return; }
      setMatchResults(data);
    } catch {
      setMatchError('Something went wrong. Check your API key in .env.local.');
    } finally {
      setMatching(false);
    }
  }

  const anchorItem = items.find(i => i.id === anchorItemId);
  const itemsByType = ITEM_TYPES.reduce<Record<string, Item[]>>((acc, type) => {
    const group = items.filter(i => i.type === type);
    if (group.length) acc[type] = group;
    return acc;
  }, {});

  const tabStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '6px 14px',
    borderRadius: 2,
    fontWeight: 500,
    background: active ? '#2D5016' : 'transparent',
    color: active ? '#F9F9F7' : '#6B8F5E',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

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

      {/* AI outfit section */}
      <div className="mb-8 rounded-sm" style={{ background: '#EFF3EC', border: '0.5px solid #D4DDD0' }}>
        {/* Header + tabs */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #D4DDD0' }}>
          <div className="flex items-center gap-2">
            <Sparkle size={16} weight="duotone" color="#2D5016" />
            <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2D5016', fontWeight: 500 }}>
              Build an outfit with AI
            </span>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-sm" style={{ background: 'rgba(255,255,255,0.5)' }}>
            <button style={tabStyle(aiMode === 'describe')} onClick={() => switchMode('describe')}>
              Describe
            </button>
            <button style={tabStyle(aiMode === 'inspire')} onClick={() => switchMode('inspire')}>
              <span className="flex items-center gap-1.5"><ImageIcon size={11} weight="duotone" />Inspiration photo</span>
            </button>
            <button style={tabStyle(aiMode === 'match')} onClick={() => switchMode('match')}>
              <span className="flex items-center gap-1.5"><ArrowsLeftRight size={11} weight="duotone" />Match a piece</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Describe tab */}
          {aiMode === 'describe' && (
            <>
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
              {suggestionError && <p className="mt-3" style={{ fontSize: 13, color: '#C4735A' }}>{suggestionError}</p>}
              {suggestion && (
                <div className="mt-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A2E1A', marginBottom: 4 }}>{suggestion.name}</p>
                      <p style={{ fontSize: 13, color: '#6B8F5E', lineHeight: 1.6 }}>{suggestion.reason}</p>
                    </div>
                    <SaveButton onSave={saveSuggestion} saving={savingSuggestion} saved={savedSuggestion} />
                  </div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                    {suggestion.items.map((item) => <ItemCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Inspire tab */}
          {aiMode === 'inspire' && (
            <>
              <input
                ref={inspireFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleInspireFile(f); }}
              />
              <div className="flex gap-5 items-start">
                {/* Upload zone */}
                <div
                  onClick={() => inspireFileRef.current?.click()}
                  className="flex-shrink-0 flex flex-col items-center justify-center rounded-sm overflow-hidden cursor-pointer transition-all"
                  style={{
                    width: 180, height: 240, background: inspirePreview ? 'transparent' : '#fff',
                    border: inspirePreview ? 'none' : '1.5px dashed #D4DDD0',
                    position: 'relative',
                  }}
                >
                  {inspirePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inspirePreview} alt="Inspiration" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }} />
                  ) : (
                    <>
                      <ImageIcon size={28} weight="duotone" color="#D4DDD0" />
                      <p className="mt-2" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B8F5E' }}>
                        Upload photo
                      </p>
                    </>
                  )}
                </div>

                {/* Right side */}
                <div className="flex flex-col gap-3 flex-1">
                  {inspirePreview && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => inspireFileRef.current?.click()}
                        className="px-3 py-2 rounded-sm text-xs font-medium tracking-wider uppercase"
                        style={{ background: '#fff', color: '#6B8F5E', border: '0.5px solid #D4DDD0' }}
                      >
                        Change photo
                      </button>
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: '#6B8F5E', lineHeight: 1.6 }}>
                    Upload a photo from Pinterest, Instagram, or anywhere else. Claude will analyze the style and build the closest possible outfit from your closet.
                  </p>
                  <button
                    onClick={generateInspireOutfit}
                    disabled={inspiring || !inspireFile}
                    className="self-start flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
                    style={{ background: '#2D5016', color: '#F9F9F7', opacity: (!inspireFile || inspiring) ? 0.5 : 1 }}
                  >
                    {inspiring ? <Spinner size={14} weight="bold" className="animate-spin" /> : <Sparkle size={14} weight="duotone" />}
                    {inspiring ? 'Analyzing...' : 'Build outfit from photo'}
                  </button>
                </div>
              </div>

              {inspireError && <p className="mt-4" style={{ fontSize: 13, color: '#C4735A' }}>{inspireError}</p>}

              {inspireResult && (
                <div className="mt-5" style={{ borderTop: '0.5px solid #D4DDD0', paddingTop: 20 }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A2E1A', marginBottom: 4 }}>{inspireResult.name}</p>
                      <p style={{ fontSize: 13, color: '#6B8F5E', lineHeight: 1.6 }}>{inspireResult.reason}</p>
                    </div>
                    <SaveButton onSave={saveInspireOutfit} saving={savingInspire} saved={savedInspire} />
                  </div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                    {inspireResult.items.map((item) => <ItemCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Match tab */}
          {aiMode === 'match' && (
            <>
              <div className="flex flex-col gap-5">
                {/* Anchor item */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 10 }}>
                    I want to wear...
                  </p>
                  {items.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#6B8F5E' }}>No items in your closet yet.</p>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {items.map(item => {
                        const isSelected = item.id === anchorItemId;
                        const hasImg = item.image_path && item.image_path !== '/uploads/placeholder.jpg';
                        return (
                          <button
                            key={item.id}
                            onClick={() => setAnchorItemId(item.id)}
                            className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-sm p-1.5 transition-all"
                            style={{
                              background: isSelected ? '#2D5016' : '#fff',
                              border: isSelected ? '2px solid #2D5016' : '0.5px solid #D4DDD0',
                              width: 80,
                            }}
                          >
                            <div className="relative w-full rounded-sm overflow-hidden" style={{ aspectRatio: '3/4', background: '#EFF3EC' }}>
                              {hasImg ? (
                                <Image src={item.image_path} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="80px" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Swatches size={18} weight="duotone" color={isSelected ? '#F9F9F7' : '#6B8F5E'} />
                                </div>
                              )}
                            </div>
                            <p style={{ fontSize: 10, color: isSelected ? '#F9F9F7' : '#1A2E1A', lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>
                              {item.name.length > 18 ? item.name.slice(0, 16) + '…' : item.name}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Want type */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 10 }}>
                    Find me a...
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {ITEM_TYPES.filter(t => t !== anchorItem?.type).map(type => (
                      <button
                        key={type}
                        onClick={() => setWantType(type)}
                        className="px-3 py-1.5 rounded-sm text-xs font-medium tracking-wider uppercase"
                        style={{
                          background: wantType === type ? '#2D5016' : '#fff',
                          color: wantType === type ? '#F9F9F7' : '#6B8F5E',
                          border: wantType === type ? '0.5px solid #2D5016' : '0.5px solid #D4DDD0',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Occasion */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 10 }}>
                    For...
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. a job interview, a casual Friday, a dinner date"
                    value={matchOccasion}
                    onChange={e => setMatchOccasion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generateMatch()}
                    className="w-full px-4 py-2.5 rounded-sm text-sm outline-none"
                    style={{ background: '#fff', border: '0.5px solid #D4DDD0', color: '#1A2E1A' }}
                  />
                </div>

                <button
                  onClick={generateMatch}
                  disabled={matching || !anchorItemId}
                  className="self-start flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
                  style={{ background: '#2D5016', color: '#F9F9F7', opacity: (!anchorItemId || matching) ? 0.5 : 1 }}
                >
                  {matching ? <Spinner size={14} weight="bold" className="animate-spin" /> : <ArrowsLeftRight size={14} weight="duotone" />}
                  {matching ? 'Finding matches...' : 'Find matches'}
                </button>
              </div>

              {matchError && <p className="mt-4" style={{ fontSize: 13, color: '#C4735A' }}>{matchError}</p>}

              {matchResults && matchResults.length > 0 && (
                <div className="mt-5" style={{ borderTop: '0.5px solid #D4DDD0', paddingTop: 20 }}>
                  <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 16 }}>
                    {matchResults.length} match{matchResults.length !== 1 ? 'es' : ''} for your {anchorItem?.name}
                  </p>
                  <div className="flex gap-4 flex-wrap">
                    {matchResults.map(({ item, reason }) => (
                      <div key={item.id} style={{ width: 160 }}>
                        <ItemCard item={item} />
                        <p className="mt-2" style={{ fontSize: 12, color: '#6B8F5E', lineHeight: 1.5 }}>{reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Manual outfit builder */}
      {building && (
        <div className="mb-8 p-6 rounded-sm" style={{ background: '#fff', border: '0.5px solid #D4DDD0' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 16 }}>
            Select pieces manually
          </p>
          {Object.entries(itemsByType).map(([type, typeItems]) => (
            <div key={type} className="mb-5">
              <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 8 }}>{type}</p>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {typeItems.map((item) => (
                  <ItemCard key={item.id} item={item} selectable selected={selected.includes(item.id)} onSelect={() => toggleItem(item.id)} />
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-3 items-center mt-2">
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
