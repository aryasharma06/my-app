'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, Spinner, Check } from '@phosphor-icons/react';

interface Photo {
  name: string;
  path: string;
  mtime: number;
}

interface Props {
  onClose: () => void;
  onImport: (paths: string[]) => void;
}

export default function LibraryBrowser({ onClose, onImport }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/photos-library?page=${p}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setPhotos(data.files);
      setTotal(data.total);
      setPage(p);
    } catch {
      setError('Could not load photos library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(0); }, [load]);

  function toggle(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  async function handleImport() {
    if (!selected.size) return;
    setImporting(true);
    onImport([...selected]);
  }

  const totalPages = Math.ceil(total / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(26,46,26,0.5)' }}>
      <div className="flex flex-col rounded-sm overflow-hidden shadow-2xl" style={{ background: '#F9F9F7', width: '90vw', maxWidth: 900, height: '85vh' }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '0.5px solid #D4DDD0' }}>
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#1A2E1A' }}>Photos Library</p>
            <p style={{ fontSize: 11, color: '#6B8F5E', letterSpacing: '0.06em' }}>{total.toLocaleString()} photos, most recent first</p>
          </div>
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium tracking-widest uppercase"
                style={{ background: '#2D5016', color: '#F9F9F7', opacity: importing ? 0.6 : 1 }}
              >
                {importing
                  ? <Spinner size={13} weight="bold" className="animate-spin" />
                  : <Check size={13} weight="bold" />}
                {importing ? 'Analyzing...' : `Add ${selected.size} photo${selected.size > 1 ? 's' : ''}`}
              </button>
            )}
            <button onClick={onClose} style={{ color: '#6B8F5E' }}>
              <X size={20} weight="regular" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ fontSize: 14, color: '#C4735A', textAlign: 'center', maxWidth: 400 }}>{error}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner size={28} weight="regular" color="#6B8F5E" className="animate-spin" />
            </div>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
              {photos.map((photo) => {
                const isSelected = selected.has(photo.path);
                return (
                  <div
                    key={photo.path}
                    onClick={() => toggle(photo.path)}
                    className="relative rounded-sm overflow-hidden cursor-pointer"
                    style={{
                      aspectRatio: '1',
                      border: isSelected ? '2.5px solid #2D5016' : '0.5px solid #D4DDD0',
                    }}
                  >
                    <img
                      src={`/api/photos-library/image?path=${photo.path}`}
                      alt={photo.name}
                      className="w-full h-full"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(45,80,22,0.25)' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#2D5016' }}>
                          <Check size={14} weight="bold" color="#F9F9F7" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '0.5px solid #D4DDD0' }}>
            <button
              onClick={() => load(page - 1)}
              disabled={page === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium tracking-wider uppercase"
              style={{ background: '#EFF3EC', color: '#2D5016', opacity: page === 0 ? 0.3 : 1 }}
            >
              <ArrowLeft size={13} weight="bold" /> Prev
            </button>
            <span style={{ fontSize: 12, color: '#6B8F5E' }}>Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium tracking-wider uppercase"
              style={{ background: '#EFF3EC', color: '#2D5016', opacity: page >= totalPages - 1 ? 0.3 : 1 }}
            >
              Next <ArrowRight size={13} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
