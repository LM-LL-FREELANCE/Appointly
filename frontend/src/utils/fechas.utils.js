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