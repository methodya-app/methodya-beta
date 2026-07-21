import { useState } from 'react';
import { api } from '../../../lib/api.js';

// Módulo de Selección de plantilla y carpeta (punto 2.1.2). En esta beta el
// "vaciamiento" es una SIMULACIÓN de texto (ver README): no llama a la API
// real de Google Slides/Docs, que requiere credenciales OAuth adicionales.
export default function ProjectTemplateTab({ project, onSaved, readOnly }) {
  const [tipo, setTipo] = useState(project.plantilla_tipo || 'docs');
  const [url, setUrl] = useState(project.plantilla_url || '');
  const [folder, setFolder] = useState(project.drive_folder_url || '');
  const [texto, setTexto] = useState(project.plantilla_texto_simulado || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/projects/${project.id}`, {
        plantilla_tipo: tipo,
        plantilla_url: url,
        drive_folder_url: folder,
        plantilla_texto_simulado: texto,
      });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="paper-card rounded-xl p-5 space-y-4 max-w-2xl">
      <div className="bg-warmAmber-light text-warmAmber-hover text-xs rounded-lg p-3">
        Fase 1 (beta): el vaciamiento se simula reemplazando <code>{'{{variable}}'}</code> sobre el
        texto de plantilla configurado abajo. La integración real con la API de Google Slides/Docs
        queda para una siguiente fase (requiere credenciales OAuth de Google Cloud).
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo de plantilla</label>
          <select
            disabled={readOnly}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
          >
            <option value="docs">Google Docs</option>
            <option value="slides">Google Slides</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">URL de la plantilla</label>
          <input
            disabled={readOnly}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
            placeholder="https://docs.google.com/..."
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Carpeta de Google Drive destino</label>
        <input
          disabled={readOnly}
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
          placeholder="https://drive.google.com/drive/folders/..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Texto base para la simulación de vaciamiento (usa {'{{variable}}'} igual que las
          variables de los campos del formulario)
        </label>
        <textarea
          disabled={readOnly}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={8}
          className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm font-mono"
          placeholder={'Ej: Clase: {{titulo}}\nDescripción: {{descripcion}}'}
        />
      </div>

      {!readOnly && (
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar plantilla'}
        </button>
      )}
    </div>
  );
}
