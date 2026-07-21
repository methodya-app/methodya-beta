import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function UsersGlobal() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', is_admin: false });

  const load = async () => {
    const data = await api.get('/users');
    setUsers(data.users);
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    await api.post('/users', form);
    setForm({ nombre: '', apellido: '', email: '', password: '', is_admin: false });
    setShowForm(false);
    load();
  };

  const toggleSuspend = async (u) => {
    if (u.activo) {
      await api.del(`/users/${u.id}`);
    } else {
      await api.put(`/users/${u.id}`, { activo: true });
    }
    load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-deepViolet">Usuarios</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold"
        >
          + Nuevo usuario
        </button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="paper-card rounded-xl p-4 grid sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
          <input
            required
            placeholder="Apellido"
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            className="border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Correo"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Clave temporal"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_admin}
              onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
            />
            Es Administrador
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-deepViolet text-white text-sm font-semibold">
              Crear usuario
            </button>
          </div>
        </form>
      )}

      <div className="paper-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-deepViolet/5 text-left text-xs uppercase text-deepViolet/70">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Admin</th>
              <th className="p-3">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-deepViolet/10">
                <td className="p-3">{u.nombre} {u.apellido}</td>
                <td className="p-3 text-slate-500">{u.email}</td>
                <td className="p-3">{u.is_admin ? 'Sí' : 'No'}</td>
                <td className="p-3">
                  <span className={u.activo ? 'text-emerald-600' : 'text-red-500'}>
                    {u.activo ? 'Activo' : 'Suspendido'}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => toggleSuspend(u)} className="text-xs font-semibold text-cognitiveTeal hover:underline">
                    {u.activo ? 'Suspender' : 'Reactivar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
