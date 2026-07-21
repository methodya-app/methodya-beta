import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import StateBadge from '../../components/StateBadge.jsx';

// Vista compartida por Creador Experto, Revisor Pedagógico y Revisor de
// Estilo: "debo ver la lista de proyectos en los que tengo documentos
// asignados" (puntos 3, 4 y 5 del documento de la beta).
export default function MyProjects() {
  const { projectRoles, profile } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-deepViolet">
          Hola, {profile?.nombre}
        </h2>
        <p className="text-sm text-slate-500">Estos son los proyectos en los que tienes documentos asignados.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {projectRoles.map((pr) => (
          <Link
            key={pr.project_id}
            to={`/mis-proyectos/${pr.project_id}`}
            className="paper-card rounded-xl p-4 hover:border-cognitiveTeal transition"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-deepViolet">{pr.projects?.nombre}</p>
              <StateBadge estado={pr.projects?.estado} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">{pr.projects?.codigo}</p>
            <p className="text-xs text-cognitiveTeal font-semibold mt-2">Tu rol: {pr.role}</p>
          </Link>
        ))}
        {projectRoles.length === 0 && (
          <p className="text-slate-400 text-sm">Aún no tienes proyectos asignados.</p>
        )}
      </div>
    </div>
  );
}
