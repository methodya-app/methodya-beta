// Réplica en el cliente de api/_lib/validation.js (solo la regla propia del
// campo: obligatorio + regex/longitud) para dar feedback inmediato al perder
// el foco. El backend sigue siendo la fuente de verdad (también valida las
// validaciones globales del proyecto, que aquí no se evalúan).
export function validateFieldClient(field, value) {
  const errors = [];
  const strValue = Array.isArray(value) ? value.join(', ') : String(value ?? '');

  if (field.required) {
    const empty =
      value === undefined ||
      value === null ||
      strValue.trim() === '' ||
      (Array.isArray(value) && value.length === 0);
    if (empty) errors.push('Este campo es obligatorio.');
  }

  const v = field.validation;
  if (v?.enabled) {
    if (v.min_length && strValue.length < Number(v.min_length)) {
      errors.push(`La longitud mínima es de ${v.min_length} caracteres.`);
    }
    if (v.max_length && strValue.length > Number(v.max_length)) {
      errors.push(`La longitud máxima permitida es de ${v.max_length} caracteres.`);
    }
    if (v.pattern) {
      try {
        const rx = new RegExp(v.pattern, 'i');
        const matches = rx.test(strValue);
        const ok = v.mode === 'must_not_match' ? !matches : matches;
        if (!ok) {
          errors.push(v.custom_message?.trim() || `No cumple la regla de validación: ${v.description || 'formato inválido'}`);
        }
      } catch {
        // patrón inválido: no bloquear al usuario por un error de configuración
      }
    }
  }

  return errors;
}
