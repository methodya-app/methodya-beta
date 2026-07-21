const COLORS = {
  Pendiente: 'bg-slate-200 text-slate-700',
  'En proceso': 'bg-warmAmber-light text-warmAmber-hover',
  Devuelto: 'bg-red-100 text-red-700',
  'Revisión Pedagógica': 'bg-cognitiveTeal-light text-cognitiveTeal-deep',
  'Revisión Estilo': 'bg-deepViolet-light text-deepViolet',
  'Producción Multimedia': 'bg-blue-100 text-blue-700',
  Detenido: 'bg-slate-300 text-slate-800',
  Finalizado: 'bg-activeMint/20 text-emerald-700',
  Eliminado: 'bg-slate-400 text-white',
  Pendiente_proyecto: 'bg-slate-200 text-slate-700',
};

export default function StateBadge({ estado }) {
  const cls = COLORS[estado] || 'bg-slate-200 text-slate-700';
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {estado}
    </span>
  );
}
