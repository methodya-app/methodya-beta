import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import StateBadge from '../../components/StateBadge.jsx';
import FormRenderer from '../../components/form/FormRenderer.jsx';

// Pantalla de "modo ejecución" (punto 2.1.6): diligenciar o revisar un
// documento a través de su formulario. La reutilizan el Creador Experto, el
// Revisor Pedagógico, el Revisor de Estilo y el Administrador; los botones
// disponibles cambian según el rol y el estado actual del documento.
export default function DocumentExecute() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [subformsLibrary, setSubformsLibrary] = useState([]);
  const [paragraphsLibrary, setParagraphsLibrary] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const doc = await api.get(`/documents/${id}`);
    setData(doc);
    setValues(doc.values || {});
    const [subforms, paragraphs, users] = await Promise.all([
      api.get('/subforms'),
      api.get('/paragraphs'),
      api.get(`/projects/${doc.document.project_id}/users`),
    ]);
    setSubformsLibrary(subforms.subforms);
    setParagraphsLibrary(paragraphs.paragraphs);
    setProjectUsers(users.project_users);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <p className="text-slate-500">Cargando documento...</p>;

  const { document, form, access } = data;
  const reviewMode = access.is_revisor_pedagogico || access.is_revisor_estilo;
  const canEdit =
    isAdmin ||
    (access.is_creador && ['Pendiente', 'En proceso', 'Devuelto'].includes(document.estado)) ||
    (access.is_revisor_pedagogico && document.estado === 'Revisión Pedagógica') ||
    (access.is_revisor_estilo && document.estado === 'Revisión Estilo');
  const readOnly = access.is_read_only || !canEdit;

  const saveDraft = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/documents/${id}/data`, { values, partial: true });
      setMessage('Guardado ✓');
    } catch (err) {
      setMessage('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitAction = async (action) => {
    setSaving(true);
    setMessage('');
    try {
      // Guarda y valida de forma estricta antes de cambiar de estado.
      await api.put(`/documents/${id}/data`, { values, partial: false });
      await api.post(`/documents/${id}/submit`, { action });
      await load();
      setErrors({});
      setMessage('Acción ejecutada ✓');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setMessage('No se pudo completar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAndValidate = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/documents/${id}/data`, { values, partial: false });
      setErrors({});
      setMessage('Guardado y validado ✓');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setMessage('No se pudo guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const vaciar = async () => {
    setSaving(true);
    try {
      await api.post(`/documents/${id}/vaciar`);
      await load();
      setMessage('Vaciamiento ejecutado ✓');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      <div>
        <Link to="/mis-proyectos" className="text-xs text-cognitiveTeal hover:underline">
          ← Volver
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <h2 className="font-display font-bold text-xl text-deepViolet">{document.codigo}</h2>
          <StateBadge estado={document.estado} />
        </div>
        <p className="text-sm text-slate-500">{form?.titulo}</p>
      </div>

      {message && <div className="text-sm text-deepViolet bg-deepViolet/5 rounded-lg p-2">{message}</div>}
      {readOnly && (
        <div className="text-sm text-warmAmber-hover bg-warmAmber-light rounded-lg p-2">
          Este documento está en modo solo lectura para tu rol en su estado actual.
        </div>
      )}

      {form && (
        <FormRenderer
          form={form}
          values={values}
          onChange={setValues}
          errors={errors}
          onErrorsChange={setErrors}
          readOnly={readOnly}
          subformsLibrary={subformsLibrary}
          paragraphsLibrary={paragraphsLibrary}
          reviewMode={reviewMode}
          documentId={id}
          comments={data.comments}
          projectUsers={projectUsers}
          onCommentsChange={load}
        />
      )}

      {data.vaciado_resultado && (
        <div className="paper-card rounded-xl p-4">
          <p className="font-display font-bold text-deepViolet mb-2">Resultado del vaciamiento (simulado)</p>
          <pre className="whitespace-pre-wrap text-xs bg-white p-3 rounded-lg border border-deepViolet/10">
            {data.vaciado_resultado}
          </pre>
        </div>
      )}

      {!readOnly && (
        <div className="sticky bottom-0 bg-empatheticLinen/95 backdrop-blur border-t border-deepViolet/10 p-3 flex flex-wrap gap-2 justify-end -mx-6">
          {access.is_creador && (
            <>
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-deepViolet/10 text-deepViolet text-sm font-semibold disabled:opacity-50"
              >
                Guardar avance
              </button>
              <button
                onClick={() => submitAction('send_to_pedagogica')}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold disabled:opacity-50"
              >
                Enviar a revisión pedagógica
              </button>
            </>
          )}

          {access.is_revisor_pedagogico && (
            <>
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-deepViolet/10 text-deepViolet text-sm font-semibold disabled:opacity-50"
              >
                Guardar avance
              </button>
              <button
                onClick={() => submitAction('return_to_creator_from_pedagogica')}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold disabled:opacity-50"
              >
                Devolver al creador
              </button>
              <button
                onClick={() => submitAction('send_to_estilo')}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold disabled:opacity-50"
              >
                Enviar a revisión de estilo
              </button>
            </>
          )}

          {access.is_revisor_estilo && (
            <>
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-deepViolet/10 text-deepViolet text-sm font-semibold disabled:opacity-50"
              >
                Guardar avance
              </button>
              <button
                onClick={() => submitAction('return_to_creator_from_estilo')}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold disabled:opacity-50"
              >
                Devolver al creador
              </button>
              <button
                onClick={vaciar}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-warmAmber text-deepViolet text-sm font-semibold disabled:opacity-50"
              >
                Vaciar documento
              </button>
              <button
                onClick={() => submitAction('send_back_to_pedagogica')}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold disabled:opacity-50"
              >
                Enviar a revisión pedagógica
              </button>
            </>
          )}

          {isAdmin && !access.is_creador && !access.is_revisor_pedagogico && !access.is_revisor_estilo && (
            <>
              <button
                onClick={saveAndValidate}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-deepViolet/10 text-deepViolet text-sm font-semibold disabled:opacity-50"
              >
                Guardar y validar
              </button>
              <button
                onClick={vaciar}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-warmAmber text-deepViolet text-sm font-semibold disabled:opacity-50"
              >
                Vaciar documento
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
