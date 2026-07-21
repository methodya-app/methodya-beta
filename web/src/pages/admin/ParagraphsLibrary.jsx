import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

// Biblioteca de párrafos predefinidos (usados por el tipo de campo "Párrafo
// predefinido", punto 2.1.1 del documento de la beta).
export default function ParagraphsLibrary() {
  const [paragraphs, setParagraphs] = useState([]);
  const [texto, setTexto] = useState('');
  const [tags, setTags] = useState('');

  const load = async () => {
    const data = await api.get('/paragraphs');
    setParagraphs(data.paragraphs);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/paragraphs', {
      texto,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setTexto('');
    setTags('');
    load();
  };

  const remove = async (id) => {
    await api.del(`/paragraphs/${id}`);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h2 className="font-display font-bold text-xl text-deepViolet">Párrafos predefinidos</h2>

      <form onSubmit={create} className="paper-card rounded-xl p-4 space-y-3">
        <textarea
          required
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Texto del párrafo..."
          rows={4}
          className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags separados por coma (ej: cultura, andino)"
          className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold">
          Agregar párrafo
        </button>
      </form>

      <div className="space-y-2">
        {paragraphs.map((p) => (
          <div key={p._id} className="paper-card rounded-xl p-3 flex justify-between gap-3">
            <div>
              <p className="text-sm text-slate-700">{p.texto}</p>
              <div className="flex gap-1 mt-1">
                {p.tags?.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-warmAmber-light text-warmAmber-hover">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => remove(p._id)} className="text-xs text-red-500 hover:underline whitespace-nowrap">
              Eliminar
            </button>
          </div>
        ))}
        {paragraphs.length === 0 && <p className="text-sm text-slate-400">No hay párrafos aún.</p>}
      </div>
    </div>
  );
}
