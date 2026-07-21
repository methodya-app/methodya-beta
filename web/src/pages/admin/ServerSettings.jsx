import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

// Módulo de Parámetros del Servidor (punto 2.3): la clave de la API de IA
// (Gemini) y el endpoint del backend, editables en caliente sin redeploy.
export default function ServerSettings() {
  const [settings, setSettings] = useState(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const load = async () => {
    const data = await api.get('/settings');
    setSettings(data.settings);
    setEndpoint(data.settings.backend_endpoint || '');
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', {
        gemini_api_key: geminiKey || undefined,
        backend_endpoint: endpoint,
      });
      setGeminiKey('');
      setSavedAt(new Date());
      load();
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p className="text-slate-500">Cargando...</p>;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h2 className="font-display font-bold text-xl text-deepViolet">Parámetros del servidor</h2>

      <form onSubmit={save} className="paper-card rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Clave de la API de Gemini actual: <span className="font-mono">{settings.gemini_api_key || 'no configurada'}</span>
          </label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="Nueva clave (dejar vacío para no cambiar)"
            className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Endpoint backend serverless</label>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://tu-backend.vercel.app"
            className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
        </div>
        {savedAt && <p className="text-xs text-emerald-600">Guardado correctamente ✓</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
