import { useMemo, useState } from 'react';

// Modal de selección de "Párrafo predefinido" (tipo de campo del punto 2.1.1
// del documento de la beta), filtrable por tags y con buscador de texto.
export default function ParagraphPickerModal({ open, onClose, paragraphs, allowedTags, onSelect }) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');

  const filtered = useMemo(() => {
    let list = paragraphs || [];
    if (allowedTags?.length) {
      list = list.filter((p) => p.tags?.some((t) => allowedTags.includes(t)));
    }
    if (activeTag) list = list.filter((p) => p.tags?.includes(activeTag));
    if (search.trim()) {
      list = list.filter((p) => p.texto.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [paragraphs, allowedTags, activeTag, search]);

  const availableTags = useMemo(() => {
    const base = allowedTags?.length ? allowedTags : [...new Set((paragraphs || []).flatMap((p) => p.tags || []))];
    return base;
  }, [paragraphs, allowedTags]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-deepViolet/10 flex items-center justify-between">
          <h3 className="font-display font-bold text-deepViolet">Seleccionar párrafo predefinido</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="p-3 space-y-2 border-b border-deepViolet/10">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por texto..."
            className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTag('')}
                className={`text-xs px-2 py-1 rounded-full ${!activeTag ? 'bg-deepViolet text-white' : 'bg-slate-100'}`}
              >
                Todos
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`text-xs px-2 py-1 rounded-full ${activeTag === tag ? 'bg-deepViolet text-white' : 'bg-slate-100'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="overflow-y-auto custom-scrollbar p-3 space-y-2 flex-1">
          {filtered.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">Sin párrafos que coincidan.</p>
          )}
          {filtered.map((p) => (
            <button
              key={p._id}
              onClick={() => {
                onSelect(p.texto);
                onClose();
              }}
              className="w-full text-left p-3 rounded-lg border border-deepViolet/10 hover:border-cognitiveTeal hover:bg-cognitiveTeal-light/40 transition"
            >
              <p className="text-sm text-slate-700 line-clamp-3">{p.texto}</p>
              <div className="flex gap-1 mt-1">
                {p.tags?.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-warmAmber-light text-warmAmber-hover">
                    {t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
