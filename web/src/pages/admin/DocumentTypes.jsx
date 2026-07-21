import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function DocumentTypes() {
  const [types, setTypes] = useState([]);
  const [nombre, setNombre] = useState('');

  const load = async () => {
    const data = await api.get('/document-types');
    setTypes(data.document_types);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    await api.post('/document-types', { nombre });
    setNombre('');
    load();
  };

  const remove = async (id) => {
    await api.del('/document-types', { id });
    load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="font-display font-bold text-xl text-deepViolet">Tipos de documento</h2>
      <p className="text-sm text-slate-500">
        Tipificación de los documentos que se pueden crear con un formulario (guía de diseño, manual de
        usuario, curso, clase, guía metodológica, guía paso a paso, formulario de recurso, etc.)
      </p>

      <form onSubmit={add} className="flex gap-2">
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del tipo de documento"
          className="flex-1 border border-deepViolet/20 rounded-lg p-2 text-sm"
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold">
          Agregar
        </button>
      </form>

      <div className="paper-card rounded-xl divide-y divide-deepViolet/10">
        {types.filter((t) => t.activo).map((t) => (
          <div key={t.id} className="p-3 flex items-center justify-between">
            <span className="text-sm">{t.nombre}</span>
            <button onClick={() => remove(t.id)} className="text-xs text-red-500 hover:underline">
              Retirar
            </button>
          </div>
        ))}
        {types.filter((t) => t.activo).length === 0 && (
          <p className="p-4 text-center text-slate-400 text-sm">No hay tipos de documento activos.</p>
        )}
      </div>
    </div>
  );
}
