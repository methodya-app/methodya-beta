import { useEffect, useState } from 'react';
import { api } from '../../../lib/api.js';

// Módulo de Validaciones Globales del proyecto (punto 2.1.5): reglas que se
// aplican a TODOS los campos de TODOS los formularios del proyecto, además
// de la validación propia de cada campo. Ej: "en ningún campo debes usar la
// palabra adolescentes".
export default function ProjectValidationsTab({ projectId, readOnly }) {
  const [validations, setValidations] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [pattern, setPattern] = useState('');
  const [mode, setMode] = useState('must_not_match');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const data = await api.get(`/projects/${projectId}/validations`);
    setValidations(data.validations);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const generateWithAi = async () => {
    if (!descripcion.trim()) return;
    setGenerating(true);
    try {
      const result = await api.post('/ai/generate-regex', { description: descripcion });
      setPattern(result.pattern);
    } finally {
      setGenerating(false);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    await api.post(`/projects/${projectId}/validations`, { descripcion, pattern, mode });
    setDescripcion('');
    setPattern('');
    load();
  };

  const remove = async (id) => {
    await api.del(`/validations/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <form onSubmit={create} className="paper-card rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Descripción de la regla (lenguaje natural)
            </label>
            <div className="flex gap-2">
              <input
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: en ningún campo debes usar la palabra 'adolescentes'"
                className="flex-1 border border-deepViolet/20 rounded-lg p-2 text-sm"
              />
              <button
                type="button"
                onClick={generateWithAi}
                disabled={generating}
                className="px-3 py-2 rounded-lg bg-deepViolet text-white text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
              >
                {generating ? 'Generando...' : '✨ Generar con IA'}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              required
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Expresión regular"
              className="flex-1 border border-deepViolet/20 rounded-lg p-2 text-sm font-mono"
            />
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="border border-deepViolet/20 rounded-lg p-2 text-sm"
            >
              <option value="must_not_match">No debe cumplir (lista negra)</option>
              <option value="must_match">Debe cumplir</option>
            </select>
            <button type="submit" className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold">
              Agregar
            </button>
          </div>
        </form>
      )}

      <div className="paper-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-deepViolet/5 text-left text-xs uppercase text-deepViolet/70">
            <tr>
              <th className="p-3">Descripción</th>
              <th className="p-3">Patrón</th>
              <th className="p-3">Modo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {validations.map((v) => (
              <tr key={v.id} className="border-t border-deepViolet/10">
                <td className="p-3">{v.descripcion}</td>
                <td className="p-3 font-mono text-xs">{v.pattern}</td>
                <td className="p-3 text-xs">{v.mode === 'must_not_match' ? 'No debe cumplir' : 'Debe cumplir'}</td>
                <td className="p-3">
                  {!readOnly && (
                    <button onClick={() => remove(v.id)} className="text-xs text-red-500 hover:underline">
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {validations.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  No hay validaciones globales configuradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
