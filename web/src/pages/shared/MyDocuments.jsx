import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import StateBadge from '../../components/StateBadge.jsx';

// Lista de documentos asignados al usuario dentro de un proyecto, según su
// rol (Creador Experto / Revisor Pedagógico / Revisor de Estilo).
export default function MyDocuments() {
  const { projectId } = useParams();
  const { projectRoles } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const myRole = projectRoles.find((pr) => pr.project_id === projectId);

  useEffect(() => {
    api.get(`/projects/${projectId}/documents`).then((d) => {
      setDocuments(d.documents);
      setLoading(false);
    });
  }, [projectId]);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link to="/mis-proyectos" className="text-xs text-cognitiveTeal hover:underline">
          ← Mis proyectos
        </Link>
        <h2 className="font-display font-bold text-xl text-deepViolet">{myRole?.projects?.nombre}</h2>
        <p className="text-sm text-slate-500">Documentos asignados a ti como {myRole?.role}.</p>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : (
        <div className="paper-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-deepViolet/5 text-left text-xs uppercase text-deepViolet/70">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Estado</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-t border-deepViolet/10">
                  <td className="p-3 font-mono text-xs">{d.codigo}</td>
                  <td className="p-3"><StateBadge estado={d.estado} /></td>
                  <td className="p-3">
                    <Link to={`/documentos/${d.id}`} className="text-xs font-semibold text-cognitiveTeal hover:underline">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400">
                    No tienes documentos asignados en este proyecto.
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
