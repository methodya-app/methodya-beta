import { useState } from 'react';
import { api } from '../../../lib/api.js';

const MODOS = [
  { value: 'manual', label: 'Manual (cualquiera del rol puede tomarlo)' },
  { value: 'carga', label: 'Por Carga (se nivela entre los del rol)' },
  { value: 'aleatoria', label: 'Aleatoria' },
];

const ROLES = [
  { key: 'asignacion_creador', label: 'Creador Experto' },
  { key: 'asignacion_revisor_pedagogico', label: 'Revisor Pedagógico' },
  { key: 'asignacion_revisor_estilo', label: 'Revisor de Estilo' },
];

// Configura, por rol, qué pasa cuando un documento queda sin nadie asignado
// en la etapa de ese rol: si se deja disponible para que cualquiera del rol
// lo tome, o si el sistema lo asigna solo (por carga o al azar).
export default function ProjectAssignmentTab({ project, onSaved, readOnly }) {
  const [values, setValues] = useState({
    asignacion_creador: project.asignacion_creador || 'manual',
    asignacion_revisor_pedagogico: project.asignacion_revisor_pedagogico || 'manual',
    asignacion_revisor_estilo: project.asignacion_revisor_estilo || 'manual',
    criterio_carga: project.criterio_carga || 'activos',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/projects/${project.id}`, values);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="paper-card rounded-xl p-5 space-y-4 max-w-2xl">
      <div className="bg-warmAmber-light text-warmAmber-hover text-xs rounded-lg p-3">
        Cuando un documento llega a la etapa de un rol sin nadie asignado (por ejemplo, al
        crearse o al pasar a Revisión Pedagógica/Estilo), este modo decide qué pasa: queda
        disponible para que cualquier persona con ese rol lo tome, o el sistema lo asigna solo. El
        Administrador siempre puede seguir asignando a alguien específico desde la pestaña
        Documentos.
      </div>

      {ROLES.map((r) => (
        <div key={r.key}>
          <label className="block text-xs font-semibold text-slate-500 mb-1">{r.label}</label>
          <select
            disabled={readOnly}
            value={values[r.key]}
            onChange={(e) => setValues({ ...values, [r.key]: e.target.value })}
            className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
          >
            {MODOS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Criterio de carga (para los roles en modo "Por Carga")
        </label>
        <select
          disabled={readOnly}
          value={values.criterio_carga}
          onChange={(e) => setValues({ ...values, criterio_carga: e.target.value })}
          className="w-full border border-deepViolet/20 rounded-lg p-2 text-sm"
        >
          <option value="activos">Solo documentos activos (no Finalizado/Eliminado)</option>
          <option value="historico">Todo el histórico asignado</option>
        </select>
      </div>

      {!readOnly && (
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar reglas de asignación'}
        </button>
      )}
    </div>
  );
}
