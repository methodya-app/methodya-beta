// Gráfico de barras horizontales minimalista (sin librería externa), para
// listas cortas tipo "embudo por estado" o "tiempo promedio por etapa".
export default function BarChart({ data, labelKey, valueKey, formatValue }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0));

  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d[labelKey]} className="flex items-center gap-2">
          <span className="w-36 text-xs text-slate-600 shrink-0 truncate" title={d[labelKey]}>
            {d[labelKey]}
          </span>
          <div className="flex-1 bg-deepViolet/5 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-cognitiveTeal rounded-full"
              style={{ width: `${((d[valueKey] || 0) / max) * 100}%` }}
            />
          </div>
          <span className="w-10 text-xs font-semibold text-deepViolet text-right shrink-0">
            {formatValue ? formatValue(d[valueKey]) : d[valueKey]}
          </span>
        </div>
      ))}
    </div>
  );
}
