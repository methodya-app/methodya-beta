import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import StateBadge from '../../components/StateBadge.jsx';

const ESTADOS = ['Pendiente', 'Activo', 'Detenido', 'Finalizado', 'Eliminado'];

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await api.get('/projects');
    setProjects(data.projects);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    await api.post('/projects', { nombre, fecha_inicio: fechaInicio || null, fecha_fin: fechaFin || null });
    setNombre('');
    setFechaInicio('');
    setFechaFin('');
    setShowForm(false);
    load();
  };

  const changeEstado = async (id, estado) => {
    await api.put(`/projects/${id}`, { estado });
    load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-deepViolet">Proyectos</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold"
        >
          + Nuevo proyecto
        </button>
      </div>

      {showForm && (
        <form onSubmit={createProject} className="paper-card rounded-xl p-5 grid grid-cols-3 gap-3 items-end">
          <div className="col-span-3 sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre del proyecto</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            />
          </div>
          <div className="col-span-3">
            <button type="submit" className="px-4 py-2 rounded-lg bg-deepViolet text-white text-sm font-semibold">
              Crear
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : (
        <div className="paper-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-deepViolet/5 text-left text-xs uppercase text-deepViolet/70">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Vigencia</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-t border-deepViolet/10">
                  <td className="p-3 font-mono text-xs">{p.codigo}</td>
                  <td className="p-3">
                    <Link to={`/admin/proyectos/${p.id}`} className="font-semibold text-cognitiveTeal hover:underline">
                      {p.nombre}
                    </Link>
                  </td>
                  <td className="p-3"><StateBadge estado={p.estado} /></td>
                  <td className="p-3 text-xs text-slate-500">
                    {p.fecha_inicio || '—'} a {p.fecha_fin || '—'}
                  </td>
                  <td className="p-3">
                    <select
                      value={p.estado}
                      onChange={(e) => changeEstado(p.id, e.target.value)}
                      className="text-xs border border-deepViolet/20 rounded-md p-1"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No hay proyectos aún.
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
