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