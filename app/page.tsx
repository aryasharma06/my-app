'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Spinner, FunnelSimple, Images, UserCircle, CheckCircle, ListBullets, ArrowClockwise, PencilSimple, PlusCircle } from '@phosphor-icons/react';
import Image from 'next/image';
import ItemCard, { Item } from './components/ItemCard';
import LibraryBrowser from './components/LibraryBrowser';
import EditItemModal from './components/EditItemModal';
import ManualAddModal from './components/ManualAddModal';

const TYPE_FILTERS = ['All', 'Favorites', 'top', 'bottom', 'dress', 'shoes', 'bag', 'outerwear'];

interface UploadState {
  phase: 'idle' | 'analyzing' | 'found' | 'enriching' | 'done';
  photoIndex: number;
  photoTotal: number;
  foundCount: number;
  enrichDone: number;
  enrichTotal: number;
  error: string;
}

const IDLE: UploadState = { phase: 'idle', photoIndex: 0, photoTotal: 0, foundCount: 0, enrichDone: 0, enrichTotal: 0, error: '' };

function ProgressBar({ state }: { state: UploadState }) {
  if (state.phase === 'idle') return null;

  let label = '';
  let fill = 0;
  let done = false;

  if (state.phase === 'analyzing') {
    label = state.photoTotal > 1
      ? `Analyzing photo ${state.photoIndex} of ${state.photoTotal}...`
      : 'Analyzing photo...';
    fill = state.photoTotal > 1 ? (state.photoIndex - 1) / state.photoTotal * 50 : 15;
  } else if (state.phase === 'found') {
    label = `Found ${state.foundCount} item${state.foundCount !== 1 ? 's' : ''}. Searching for products...`;
    fill = 55;
  } else if (state.phase === 'enriching') {
    const pct = state.enrichTotal > 0 ? state.enrichDone / state.enrichTotal : 0;
    label = `Finding products... ${state.enrichDone} of ${state.enrichTotal}`;
    fill = 55 + pct * 45;
  } else if (state.phase === 'done') {
    label = `Done. Added ${state.foundCount} item${state.foundCount !== 1 ? 's' : ''}.`;
    fill = 100;
    done = true;
  }

  if (state.error) {
    return (
      <div className="mb-6 px-4 py-3 rounded-sm" style={{ background: '#FAE8E2', border: '0.5px solid #C4735A' }}>
        <p style={{ fontSize: 13, color: '#C4735A' }}>{state.error}</p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-sm overflow-hidden" style={{ border: '0.5px solid #D4DDD0', background: '#fff' }}>
      <div className="px-4 py-3 flex items-center gap-3">
        {done
          ? <CheckCircle size={15} weight="duotone" color="#2D5016" />
          : <Spinner size={15} weight="bold" color="#2D5016" className="animate-spin" />}
        <span style={{ fontSize: 13, color: '#1A2E1A' }}>{label}</span>
      </div>
      <div style={{ height: 3, background: '#EFF3EC' }}>
        <div
          style={{
            height: '100%',
            width: `${fill}%`,
            background: done ? '#6B8F5E' : '#2D5016',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function ClosetPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState('All');
  const [uploadState, setUploadState] = useState<UploadState>(IDLE);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [refPhoto, setRefPhoto] = useState<string | null>(null);
  const [enrichingIds, setEnrichingIds] = useState<Set<number>>(new Set());
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showLog, setShowLog] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<HTMLInputElement>(null);

  async function loadItems() {
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    loadItems();
    fetch('/api/reference-photo').then(r => r.json()).then(d => setRefPhoto(d.path ?? null));
  }, []);

  async function handleRefPhotoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/reference-photo', { method: 'POST', body: form });
    const data = await res.json();
    setRefPhoto(data.path ?? null);
    if (refFileRef.current) refFileRef.current.value = '';
  }

  async function enrichItem(id: number, onDone?: () => void) {
    setEnrichingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/items/${id}/enrich`, { method: 'POST' });
      const updated = await res.json();
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } finally {
      setEnrichingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      onDone?.();
    }
  }

  async function analyzeItem(id: number) {
    setEnrichingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/items/${id}/analyze`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => prev.map(i => i.id === id ? updated : i));
      }
    } finally {
      setEnrichingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setUploadState({ ...IDLE, phase: 'analyzing', photoIndex: 1, photoTotal: files.length });

    const newItems: Item[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadState(s => ({ ...s, phase: 'analyzing', photoIndex: i + 1 }));
        const form = new FormData();
        form.append('file', files[i]);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        const found: Item[] = data.items ?? (data.id ? [data] : []);
        newItems.push(...found);
        setItems(prev => {
          const ids = new Set(prev.map(x => x.id));
          return [...prev, ...found.filter(x => !ids.has(x.id))];
        });
      }
    } catch {
      setUploadState(s => ({ ...s, error: 'Something went wrong. Check your API key in .env.local.' }));
      return;
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }

    if (!newItems.length) {
      setUploadState(IDLE);
      return;
    }

    setUploadState(s => ({ ...s, phase: 'enriching', foundCount: newItems.length, enrichTotal: newItems.length, enrichDone: 0 }));

    let done = 0;
    await Promise.all(newItems.map(item =>
      enrichItem(item.id, () => {
        done++;
        setUploadState(s => ({ ...s, enrichDone: done }));
      })
    ));

    setUploadState(s => ({ ...s, phase: 'done', enrichDone: s.enrichTotal }));
    setTimeout(() => setUploadState(IDLE), 3000);
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    uploadFiles(Array.from(e.target.files ?? []));
  }

  async function handleLibraryImport(paths: string[]) {
    setShowLibrary(false);
    setUploadState({ ...IDLE, phase: 'analyzing', photoIndex: 1, photoTotal: paths.length });

    const newItems: Item[] = [];
    try {
      for (let i = 0; i < paths.length; i++) {
        setUploadState(s => ({ ...s, phase: 'analyzing', photoIndex: i + 1 }));
        const res = await fetch(`/api/photos-library/image?path=${paths[i]}`);
        if (!res.ok) throw new Error('Could not read photo');
        const blob = await res.blob();
        const file = new File([blob], `photo-${i}.jpg`, { type: 'image/jpeg' });
        const form = new FormData();
        form.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: form });
        if (!uploadRes.ok) throw new Error('Upload failed');
        const data = await uploadRes.json();
        const found: Item[] = data.items ?? (data.id ? [data] : []);
        newItems.push(...found);
        setItems(prev => {
          const ids = new Set(prev.map(x => x.id));
          return [...prev, ...found.filter(x => !ids.has(x.id))];
        });
      }
    } catch {
      setUploadState(s => ({ ...s, error: 'Something went wrong. Check your API key in .env.local.' }));
      return;
    }

    if (!newItems.length) {
      setUploadState(IDLE);
      return;
    }

    setUploadState(s => ({ ...s, phase: 'enriching', foundCount: newItems.length, enrichTotal: newItems.length, enrichDone: 0 }));

    let done = 0;
    await Promise.all(newItems.map(item =>
      enrichItem(item.id, () => {
        done++;
        setUploadState(s => ({ ...s, enrichDone: done }));
      })
    ));

    setUploadState(s => ({ ...s, phase: 'done', enrichDone: s.enrichTotal }));
    setTimeout(() => setUploadState(IDLE), 3000);
  }

  async function handleToggleFavorite(id: number) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newVal = item.is_favorite ? 0 : 1;
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_favorite: newVal } : i));
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: newVal }),
    });
  }

  async function handleDelete(id: number) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleSaveEdit(updated: Item) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setEditingItem(null);
  }

  function handleManualAdd(newItem: Item) {
    setItems(prev => [newItem, ...prev]);
    setShowManualAdd(false);
    if (newItem.product_image_url) {
      analyzeItem(newItem.id);
    }
  }

  const matched = items.filter(i => i.product_image_url);
  const unmatched = items.filter(i => !i.product_image_url && !enrichingIds.has(i.id));
  const filtered = filter === 'All' ? matched
    : filter === 'Favorites' ? matched.filter(i => i.is_favorite)
    : matched.filter(i => i.type === filter);
  const isUploading = uploadState.phase !== 'idle';

  return (
    <div>
      {showLibrary && (
        <LibraryBrowser
          onClose={() => setShowLibrary(false)}
          onImport={handleLibraryImport}
        />
      )}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}
      {showManualAdd && (
        <ManualAddModal
          onClose={() => setShowManualAdd(false)}
          onAdd={handleManualAdd}
        />
      )}

      <div className="flex items-end justify-between mb-8">
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B8F5E', marginBottom: 6 }}>
            {items.length} pieces
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#1A2E1A', lineHeight: 1 }}>
            My Closet
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
          <input ref={refFileRef} type="file" accept="image/*" className="hidden" onChange={handleRefPhotoInput} />
          <button
            onClick={() => refFileRef.current?.click()}
            title={refPhoto ? 'Change your reference photo' : 'Set your photo so AI knows who you are'}
            className="flex items-center gap-2 px-3 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
            style={{ background: '#EFF3EC', color: '#2D5016', border: '0.5px solid #D4DDD0' }}
          >
            {refPhoto ? (
              <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <Image src={refPhoto} alt="Your photo" fill style={{ objectFit: 'cover' }} sizes="20px" />
              </div>
            ) : (
              <UserCircle size={14} weight="duotone" />
            )}
            {refPhoto ? 'Your photo' : 'Set your photo'}
          </button>
          <button
            onClick={() => setShowManualAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
            style={{ background: '#EFF3EC', color: '#2D5016', border: '0.5px solid #D4DDD0' }}
          >
            <PlusCircle size={14} weight="duotone" />
            Add manually
          </button>
          <button
            onClick={() => setShowLibrary(true)}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
            style={{ background: '#EFF3EC', color: '#2D5016', border: '0.5px solid #D4DDD0', opacity: isUploading ? 0.5 : 1 }}
          >
            <Images size={14} weight="duotone" />
            Browse library
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-medium tracking-widest uppercase"
            style={{ background: '#2D5016', color: '#F9F9F7', opacity: isUploading ? 0.6 : 1 }}
          >
            {isUploading ? <Spinner size={14} weight="bold" className="animate-spin" /> : <Camera size={14} weight="duotone" />}
            {isUploading ? 'Working...' : 'Upload photo'}
          </button>
        </div>
      </div>

      <ProgressBar state={uploadState} />

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <FunnelSimple size={14} weight="duotone" color="#6B8F5E" />
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-3 py-1 rounded-sm text-xs font-medium tracking-wider uppercase transition-colors"
            style={{ background: filter === t ? '#2D5016' : '#EFF3EC', color: filter === t ? '#F9F9F7' : '#6B8F5E' }}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 && unmatched.length === 0 && enrichingIds.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Camera size={48} weight="duotone" color="#D4DDD0" />
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#6B8F5E', fontWeight: 300 }}>
            {items.length === 0 ? 'Upload your first piece to get started' : 'No items in this category'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {filtered.map((item) => (
            <div key={item.id} className="group">
              <ItemCard
                item={item}
                enriching={enrichingIds.has(item.id)}
                onDelete={() => handleDelete(item.id)}
                onEdit={() => setEditingItem(item)}
                onRefresh={() => enrichItem(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Unmatched items log */}
      {unmatched.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setShowLog(s => !s)}
            className="flex items-center gap-2 mb-3"
          >
            <ListBullets size={14} weight="duotone" color="#6B8F5E" />
            <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B8F5E' }}>
              {unmatched.length} item{unmatched.length !== 1 ? 's' : ''} without a product image
            </span>
            <span style={{ fontSize: 11, color: '#D4DDD0' }}>{showLog ? '▲' : '▼'}</span>
          </button>

          {showLog && (
            <div className="rounded-sm overflow-hidden" style={{ border: '0.5px solid #D4DDD0' }}>
              {unmatched.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: i === 0 ? 'none' : '0.5px solid #D4DDD0', background: '#fff' }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ background: '#EFF3EC', color: '#2D5016', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2 }}>
                      {item.type}
                    </span>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#1A2E1A' }}>{item.name}</span>
                    {item.color && <span style={{ fontSize: 11, color: '#6B8F5E' }}>{item.color}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => enrichItem(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium tracking-widest uppercase"
                      style={{ background: '#EFF3EC', color: '#2D5016' }}
                      title="Search again"
                    >
                      <ArrowClockwise size={12} weight="duotone" />
                      Retry
                    </button>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium tracking-widest uppercase"
                      style={{ background: '#EFF3EC', color: '#2D5016' }}
                      title="Set image manually"
                    >
                      <PencilSimple size={12} weight="duotone" />
                      Set image
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ fontSize: 11, color: '#C4735A', padding: '4px 6px' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
