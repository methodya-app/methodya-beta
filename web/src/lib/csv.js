// Genera un CSV a partir de filas y columnas ({ label, value(row) }), y lo
// descarga en el navegador. Se antepone BOM UTF-8 para que Excel abra bien
// los acentos (sin esto, Excel a veces malinterpreta el encoding).
export function toCsv(rows, columns) {
  const escape = (val) => {
    const s = val === null || val === undefined ? '' : String(val);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = columns.map((c) => escape(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(','));
  return [header, ...lines].join('\r\n');
}

export function downloadCsv(filename, csvContent) {
  const BOM = '﻿';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
