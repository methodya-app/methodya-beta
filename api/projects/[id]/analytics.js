import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth, requireAdmin } from '../../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';

// Orden del flujo de trabajo, usado tanto para el embudo como para el
// tiempo de ciclo (se omite "Eliminado": los documentos en la papelera no
// participan de la analítica).
const ESTADOS_ORDEN = [
  'Pendiente',
  'En proceso',
  'Devuelto',
  'Revisión Pedagógica',
  'Revisión Estilo',
  'Producción Multimedia',
  'Detenido',
  'Finalizado',
];

// Módulo de analítica (solo Administrador): calcula, a partir de
// `documents` y `document_history`, un embudo de estados, el tiempo
// promedio que un documento pasa en cada etapa, la carga de trabajo por
// usuario del proyecto y cuántos documentos se han devuelto al creador (y
// desde qué etapa).
export default withCors(async (req, res) => {
  if (req.method !== 'GET') throw new ApiError(405, 'Método no permitido');

  const auth = await requireAuth(req);
  requireAdmin(auth);
  const { id: project_id } = req.query;
  const admin = supabaseAdmin();

  const { data: documents, error: docsError } = await admin
    .from('documents')
    .select('id, estado, creador_id, revisor_pedagogico_id, revisor_estilo_id')
    .eq('project_id', project_id)
    .neq('estado', 'Eliminado');
  if (docsError) throw new ApiError(500, docsError.message);

  const { data: projectUsers, error: usersError } = await admin
    .from('project_users')
    .select('user_id, role, profiles(nombre, apellido)')
    .eq('project_id', project_id);
  if (usersError) throw new ApiError(500, usersError.message);

  let history = [];
  if (documents.length > 0) {
    const { data, error: historyError } = await admin
      .from('document_history')
      .select('document_id, estado_anterior, estado_nuevo, created_at')
      .in(
        'document_id',
        documents.map((d) => d.id)
      )
      .order('created_at', { ascending: true });
    if (historyError) throw new ApiError(500, historyError.message);
    history = data;
  }

  // --- Embudo: cuántos documentos hay actualmente en cada estado --------
  const funnelCounts = Object.fromEntries(ESTADOS_ORDEN.map((e) => [e, 0]));
  for (const d of documents) {
    if (funnelCounts[d.estado] !== undefined) funnelCounts[d.estado]++;
  }
  const funnel = ESTADOS_ORDEN.map((estado) => ({ estado, count: funnelCounts[estado] }));

  // --- Tiempo de ciclo: promedio de días entre dos transiciones consecutivas,
  // atribuido a la etapa en la que estuvo el documento durante ese tramo.
  // Solo se cuentan tramos ya cerrados (con una transición posterior).
  const historyByDoc = new Map();
  for (const h of history) {
    if (!historyByDoc.has(h.document_id)) historyByDoc.set(h.document_id, []);
    historyByDoc.get(h.document_id).push(h);
  }
  const stageDurationsMs = {};
  for (const rows of historyByDoc.values()) {
    for (let i = 0; i < rows.length - 1; i++) {
      const stage = rows[i].estado_nuevo;
      const ms = new Date(rows[i + 1].created_at) - new Date(rows[i].created_at);
      if (ms < 0) continue;
      (stageDurationsMs[stage] ||= []).push(ms);
    }
  }
  const cycleTime = ESTADOS_ORDEN.map((estado) => {
    const durations = stageDurationsMs[estado] || [];
    if (durations.length === 0) return null;
    const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length;
    return { estado, avg_days: Math.round((avgMs / 86400000) * 10) / 10, samples: durations.length };
  }).filter(Boolean);

  // --- Devoluciones: cuántas veces se devolvió un documento al creador,
  // agrupado por la etapa desde la que se devolvió.
  const devolucionesMap = {};
  let totalDevueltos = 0;
  for (const h of history) {
    if (h.estado_nuevo === 'Devuelto') {
      totalDevueltos++;
      const etapa = h.estado_anterior || 'Desconocido';
      devolucionesMap[etapa] = (devolucionesMap[etapa] || 0) + 1;
    }
  }
  const devoluciones = Object.entries(devolucionesMap).map(([etapa, count]) => ({ etapa, count }));

  // --- Carga por usuario: documentos asignados (según su rol en el
  // proyecto) y cuántos de esos ya están Finalizados.
  const roleFieldByRole = {
    'Creador Experto': 'creador_id',
    'Revisor Pedagógico': 'revisor_pedagogico_id',
    'Revisor de Estilo': 'revisor_estilo_id',
  };
  const workload = (projectUsers || []).map((pu) => {
    const field = roleFieldByRole[pu.role];
    const asignados = documents.filter((d) => d[field] === pu.user_id);
    const finalizados = asignados.filter((d) => d.estado === 'Finalizado');
    return {
      user_id: pu.user_id,
      nombre: pu.profiles ? `${pu.profiles.nombre} ${pu.profiles.apellido}` : '—',
      role: pu.role,
      asignados: asignados.length,
      finalizados: finalizados.length,
    };
  });

  return res.status(200).json({
    total_documents: documents.length,
    funnel,
    cycle_time: cycleTime,
    workload,
    devoluciones,
    total_devueltos: totalDevueltos,
  });
});
