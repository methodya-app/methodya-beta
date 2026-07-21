import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import FieldEditor from '../../components/form/FieldEditor.jsx';

function newField() {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    label: 'Nuevo campo',
    variable: `campo_${Date.now().toString().slice(-4)}`,
    type: 'text',
    required: false,
    placeholder: '',
    options: [],
    validation: {
      enabled: false,
      description: '',
      pattern: '',
      mode: 'must_match',
      min_length: '',
      max_length: '',
      custom_message: '',
    },
  };
}

// Biblioteca de subformularios reutilizables (punto 2.4): pequeños
// formularios auxiliares que se pueden usar como campo "Sub-formulario"
// dentro de cualquier formulario de cualquier proyecto.
export default function SubformsLibrary() {
  const [subforms, setSubforms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [nombre, setNombre] = useState('');

  const load = async () => {
    const data = await api.get('/subforms');
    setSubforms(data.subforms);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    const result = await api.post('/subforms', { nombre, fields: [] });
    setNombre('');
    await load();
    setSelected(result.subform);
  };

  const save = async () => {
    try {
      await api.put(`/subforms/${selected._id}`, { nombre: selected.nombre, fields: selected.fields });
      load();
    } catch (err) {
      alert('No se pudo guardar: ' + err.message);
    }
  };

  const remove = async (id) => {
    await api.del(`/subforms/${id}`);
    if (selected?._id === id) setSelected(null);
    load();
  };

  const variableCounts = (selected?.fields || []).reduce((acc, f) => {
    if (f.variable) acc[f.variable] = (acc[f.variable] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
      <div className="md:col-span-1 space-y-3">
        <h2 className="font-display font-bold text-xl text-deepViolet">Subformularios</h2>
        <form onSubmit={create} className="flex gap-2">
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del subformulario"
            className="flex-1 border border-deepViolet/20 rounded-lg p-2 text-sm"
          />
          <button type="submit" className="px-3 py-2 rounded-lg bg-cognitiveTeal text-white text-sm font-semibold">
            +
          </button>
        </form>
        <div className="paper-card rounded-xl divide-y divide-deepViolet/10">
          {subforms.map((sf) => (
            <button
              key={sf._id}
              onClick={() => setSelected(sf)}
              className={`w-full text-left p-3 text-sm hover:bg-deepViolet/5 ${
                selected?._id === sf._id ? 'bg-cognitiveTeal-light/40' : ''
              }`}
            >
              {sf.nombre}
              <span className="block text-xs text-slate-400">{sf.fields?.length || 0} campo(s)</span>
            </button>
          ))}
          {subforms.length === 0 && <p className="p-3 text-sm text-slate-400">Sin subformularios aún.</p>}
        </div>
      </div>

      <div className="md:col-span-2">
        {selected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <input
                value={selected.nombre}
                onChange={(e) => setSelected({ ...selected, nombre: e.target.value })}
                className="font-display font-bold text-lg text-deepViolet bg-transparent border-b border-transparent hover:border-deepViolet/20 focus:border-deepViolet focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={() => remove(selected._id)} className="text-xs text-red-500 hover:underline">
                  Eliminar
                </button>
                <button onClick={save} className="px-3 py-1.5 rounded-lg bg-deepViolet text-white text-xs font-semibold">
                  Guardar
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {(selected.fields || []).map((f) => (
                <FieldEditor
                  key={f.id}
                  field={f}
                  subformsLibrary={[]}
                  duplicateVariable={variableCounts[f.variable] > 1}
                  onUpdate={(updated) =>
                    setSelected({ ...selected, fields: selected.fields.map((x) => (x.id === f.id ? updated : x)) })
                  }
                  onRemove={() => setSelected({ ...selected, fields: selected.fields.filter((x) => x.id !== f.id) })}
                />
              ))}
            </div>
            <button
              onClick={() => setSelected({ ...selected, fields: [...(selected.fields || []), newField()] })}
              className="text-sm font-semibold text-cognitiveTeal hover:underline"
            >
              + Agregar campo
            </button>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Selecciona un subformulario para editarlo.</p>
        )}
      </div>
    </div>
  );
}
