// Overlay bloqueante simple para procesos que tardan varios segundos (ej.
// vaciamiento real en Google Drive) y que no deben poder dispararse dos
// veces mientras están en curso (evita doble clic).
export default function ProcessingModal({ open, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center gap-3 max-w-xs text-center">
        <div className="w-8 h-8 border-4 border-deepViolet/20 border-t-deepViolet rounded-full animate-spin" />
        <p className="text-sm font-semibold text-deepViolet">{message}</p>
      </div>
    </div>
  );
}
