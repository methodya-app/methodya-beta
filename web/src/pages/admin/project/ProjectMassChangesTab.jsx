import { useEffect, useState } from 'react';
import { api } from '../../../lib/api.js';
import StateBadge from '../../../components/StateBadge.jsx';

export default function ProjectMassChangesTab({ projectId, readOnly }) {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState('text');
  const [search, setSearch] = useState('');
  const [replace, setReplace] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/projects/${projectId}/documents`).then((d) => setDocuments(d.documents));
  }, [projectId]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const run = async (isPreview) => {
    if (selected.length === 0 || !search) return;
    setBusy(true);
    try {
      const result = await api.post(`/projects/${projectId}/mass-changes`, {
        document_ids: selected,
        mode,
        search,
        replace,
        preview: isPreview,
      });
      setPreview(result);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="paper-card rounded-xl p-4 space-y-3">
        <p className="text-xs text-slate-500">
          Reemplaza texto específico o por expresión regular en los documentos seleccionados de este proyecto.
        </p>
        <div className="flex flex-wrap gap-3">
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="border border-deepViolet/20 rounded-lg p-2 text-sm">
            <option value="text">Texto específico</option>
            <option value="regex">Expresión regular</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 min-w-[160px] border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
          <input
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="Reemplazar por..."
            className="flex-1 min-w-[160px] border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            disabled={readOnly || busy}
            onClick={() => run(true)}
            className="px-4 py-2 rounded-lg bg-deepViolet/10 text-deepViolet text-sm font-semibold disabled:opacity-50"
          >
            Vista previa
          </button>
          <button
            disabled={readOnly || busy}
            onClick={() => run(false)}
            className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold disabled:opacity-50"
          >
            Reemplazar todo
          </button>
        </div>
      </div>

      {preview && (
        <div className="paper-card rounded-xl p-4 text-sm">
          <p className="font-semibold text-deepViolet mb-2">
            {preview.preview ? 'Vista previa' : 'Resultado'}: {preview.documentos_con_coincidencias} de{' '}
            {preview.total_documentos} documentos con coincidencias
          </p>
          <ul className="text-xs space-y-1">
            {preview.detalle
              .filter((d) => d.changed_fields.length > 0)
              .map((d) => (
                <li key={d.document_id}>
                  Documento {d.document_id.slice(0, 8)}... — campos afectados: {d.changed_fields.join(', ')}
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="paper-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-deepViolet/5 text-left text-xs uppercase text-deepViolet/70">
            <tr>
              <th className="p-3"></th>
              <th className="p-3">Código</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-t border-deepViolet/10">
                <td className="p-3">
                  <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} />
                </td>
                <td className="p-3 font-mono text-xs">{d.codigo}</td>
                <td className="p-3"><StateBadge estado={d.estado} /></td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-400">
                  No hay documentos en este proyecto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
