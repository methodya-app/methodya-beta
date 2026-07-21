import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api.js';

export default function ProjectFormsTab({ projectId, readOnly }) {
  const [forms, setForms] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [formsData, typesData] = await Promise.all([
      api.get(`/forms?project_id=${projectId}`),
      api.get('/document-types'),
    ]);
    setForms(formsData.forms);
    setDocTypes(typesData.document_types);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const createForm = async (e) => {
    e.preventDefault();
    await api.post('/forms', {
      project_id: projectId,
      titulo,
      document_type_id: documentTypeId || null,
      sections: [{ id: `sec_${Date.now()}`, titulo: 'Información general', fields: [] }],
    });
    setTitulo('');
    setDocumentTypeId('');
    setShowForm(false);
    load();
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold"
          >
            + Nuevo formulario
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={createForm} className="paper-card rounded-xl p-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Título del formulario</label>
            <input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo de documento</label>
            <select
              value={documentTypeId}
              onChange={(e) => setDocumentTypeId(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            >
              <option value="">Sin especificar</option>
              {docTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-deepViolet text-white text-sm font-semibold">
            Crear
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {forms.map((f) => (
            <Link
              key={f._id}
              to={`/admin/formularios/${f._id}`}
              className="paper-card rounded-xl p-4 hover:border-cognitiveTeal transition block"
            >
              <p className="font-semibold text-deepViolet">{f.titulo}</p>
              <p className="text-xs text-slate-500 mt-1">
                {f.sections?.length || 0} sección(es) ·{' '}
                {f.sections?.reduce((acc, s) => acc + s.fields.length, 0) || 0} campo(s)
              </p>
            </Link>
          ))}
          {forms.length === 0 && <p className="text-slate-400 text-sm">Aún no hay formularios en este proyecto.</p>}
        </div>
      )}
    </div>
  );
}
