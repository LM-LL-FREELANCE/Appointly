const pad = (n) => String(n).padStart(2, '0');
export const aISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function rangoSemana(fechaBase) {
  const d = new Date(fechaBase);
  const dia = d.getDay();
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - ((dia + 6) % 7));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { desde: aISO(lunes), hasta: aISO(domingo) };
}

export function rangoMes(fechaBase = new Date()) {
  const d = new Date(fechaBase);
  const primero = new Date(d.getFullYear(), d.getMonth(), 1);
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { desde: aISO(primero), hasta: aISO(ultimo) };
}

// fecha_turno viene como ISO completo ("2026-07-03T03:00:00.000Z"); la mostramos
// corta y en UTC para que no se corra de día por la zona horaria.
export const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-AR', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

// hora_turno viene con segundos ("09:00:00"); nos quedamos con HH:MM.
export const horaCorta = (hora) => hora?.slice(0, 5);

// Time zone of every time rule on turnos (same as the backend TIMEZONE).
export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

const formatoZona = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Date and time of an instant in Buenos Aires: { fecha: 'YYYY-MM-DD', hora: 'HH:MM' }.
export function ahoraEnZona(instante = new Date()) {
  const p = Object.fromEntries(formatoZona.formatToParts(instante).map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

// Calendar day (YYYY-MM-DD) of the fecha_turno the API returns ("2026-07-03T03:00:00.000Z").
export const fechaISODeApi = (valor) => (valor ? String(valor).slice(0, 10) : '');

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "15 jun 2026 · 10:30 hs" in Buenos Aires time, for timestamps such as creado_en.
export function formatearFechaHoraEvento(iso) {
  if (!iso) return '';
  const { fecha, hora } = ahoraEnZona(new Date(iso));
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return `${dia} ${MESES_CORTOS[mes - 1]} ${anio} · ${hora} hs`;
}


// Calendar arithmetic on a YYYY-MM-DD date (no time zone involved).
export function fechaEnDias(dias, desde) {
  const [y, m, d] = desde.split('-').map(Number);
  const fecha = new Date(Date.UTC(y, m - 1, d + dias));
  return `${fecha.getUTCFullYear()}-${pad(fecha.getUTCMonth() + 1)}-${pad(fecha.getUTCDate())}`;
}

// Range to ask for free slots when reprogramming: from today, `dias` days (the backend
// accepts at most 31 days per call).
export function ventanaReprogramacion(ahora = ahoraEnZona(), dias = 30) {
  return { desde: ahora.fecha, hasta: fechaEnDias(dias - 1, ahora.fecha) };
}
