import { useEffect, useState } from 'react';
import { api } from '../../../lib/api.js';

const ROLES = ['Creador Experto', 'Revisor Pedagógico', 'Revisor de Estilo'];

export default function ProjectUsersTab({ projectId, readOnly }) {
  const [projectUsers, setProjectUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState(ROLES[0]);

  const load = async () => {
    const [pu, users] = await Promise.all([
      api.get(`/projects/${projectId}/users`),
      api.get('/users'),
    ]);
    setProjectUsers(pu.project_users);
    setAllUsers(users.users);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const addUser = async (e) => {
    e.preventDefault();
    if (!userId) return;
    await api.post(`/projects/${projectId}/users`, { user_id: userId, role });
    setUserId('');
    load();
  };

  const removeUser = async (project_user_id) => {
    await api.del(`/projects/${projectId}/users`, { project_user_id });
    load();
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <form onSubmit={addUser} className="paper-card rounded-xl p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Usuario</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            >
              <option value="">Seleccionar...</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Rol en el proyecto</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold">
            Asignar
          </button>
        </form>
      )}

      <div className="paper-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-deepViolet/5 text-left text-xs uppercase text-deepViolet/70">
            <tr>
              <th className="p-3">Usuario</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Rol</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {projectUsers.map((pu) => (
              <tr key={pu.id} className="border-t border-deepViolet/10">
                <td className="p-3">
                  {pu.profiles?.nombre} {pu.profiles?.apellido}
                </td>
                <td className="p-3 text-slate-500">{pu.profiles?.email}</td>
                <td className="p-3">{pu.role}</td>
                <td className="p-3">
                  {!readOnly && (
                    <button onClick={() => removeUser(pu.id)} className="text-xs text-red-500 hover:underline">
                      Quitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {projectUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  No hay usuarios asignados a este proyecto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
