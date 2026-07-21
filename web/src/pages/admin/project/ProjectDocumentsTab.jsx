import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api.js';
import StateBadge from '../../../components/StateBadge.jsx';

function usersByRole(projectUsers, role) {
  return projectUsers.filter((pu) => pu.role === role);
}

export default function ProjectDocumentsTab({ projectId, readOnly }) {
  const [documents, setDocuments] = useState([]);
  const [forms, setForms] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [formId, setFormId] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [creadorId, setCreadorId] = useState('');
  const [revisorPedagogicoId, setRevisorPedagogicoId] = useState('');
  const [revisorEstiloId, setRevisorEstiloId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [docsData, formsData, usersData, typesData] = await Promise.all([
      api.get(`/projects/${projectId}/documents`),
      api.get(`/forms?project_id=${projectId}`),
      api.get(`/projects/${projectId}/users`),
      api.get('/document-types'),
    ]);
    setDocuments(docsData.documents);
    setForms(formsData.forms);
    setProjectUsers(usersData.project_users);
    setDocTypes(typesData.document_types);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const createDocument = async (e) => {
    e.preventDefault();
    await api.post(`/projects/${projectId}/documents`, {
      codigo,
      form_id: formId,
      document_type_id: documentTypeId || null,
      creador_id: creadorId || null,
      revisor_pedagogico_id: revisorPedagogicoId || null,
      revisor_estilo_id: revisorEstiloId || null,
    });
    setCodigo('');
    setShowForm(false);
    load();
  };

  const vaciar = async (id) => {
    try {
      await api.post(`/documents/${id}/vaciar`);
      alert('Vaciamiento simulado ejecutado. Puedes verlo en el detalle del documento.');
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold"
          >
            + Nuevo registro
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={createDocument} className="paper-card rounded-xl p-4 grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Código</label>
            <input
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: CLAS-BIO-001"
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Formulario</label>
            <select
              required
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            >
              <option value="">Seleccionar...</option>
              {forms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.titulo}
                </option>
              ))}
            </select>
          </div>
          <div>
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

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Creador Experto</label>
            <select
              value={creadorId}
              onChange={(e) => setCreadorId(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {usersByRole(projectUsers, 'Creador Experto').map((pu) => (
                <option key={pu.profiles.id} value={pu.profiles.id}>
                  {pu.profiles.nombre} {pu.profiles.apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Revisor Pedagógico</label>
            <select
              value={revisorPedagogicoId}
              onChange={(e) => setRevisorPedagogicoId(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {usersByRole(projectUsers, 'Revisor Pedagógico').map((pu) => (
                <option key={pu.profiles.id} value={pu.profiles.id}>
                  {pu.profiles.nombre} {pu.profiles.apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Revisor de Estilo</label>
            <select
              value={revisorEstiloId}
              onChange={(e) => setRevisorEstiloId(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {usersByRole(projectUsers, 'Revisor de Estilo').map((pu) => (
                <option key={pu.profiles.id} value={pu.profiles.id}>
                  {pu.profiles.nombre} {pu.profiles.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <button type="submit" className="px-4 py-2 rounded-lg bg-deepViolet text-white text-sm font-semibold">
              Crear documento
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : (
        <div className="paper-card rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-deepViolet/5 text-left text-xs uppercase text-deepViolet/70">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Creador Experto</th>
                <th className="p-3">Revisor Pedagógico</th>
                <th className="p-3">Revisor de Estilo</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-t border-deepViolet/10">
                  <td className="p-3 font-mono text-xs">
                    <Link to={`/documentos/${d.id}`} className="text-cognitiveTeal hover:underline">
                      {d.codigo}
                    </Link>
                  </td>
                  <td className="p-3"><StateBadge estado={d.estado} /></td>
                  <td className="p-3 text-xs">{d.creador ? `${d.creador.nombre} ${d.creador.apellido}` : '—'}</td>
                  <td className="p-3 text-xs">
                    {d.revisor_pedagogico ? `${d.revisor_pedagogico.nombre} ${d.revisor_pedagogico.apellido}` : '—'}
                  </td>
                  <td className="p-3 text-xs">
                    {d.revisor_estilo ? `${d.revisor_estilo.nombre} ${d.revisor_estilo.apellido}` : '—'}
                  </td>
                  <td className="p-3">
                    <button onClick={() => vaciar(d.id)} className="text-xs font-semibold text-warmAmber-hover hover:underline">
                      Vaciar
                    </button>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No hay documentos registrados en este proyecto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
