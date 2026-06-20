import { SLOT_DURATION_MIN } from "../config/constants";

const pad = (n) => String(n).padStart(2, '0')

const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number)
  return (h * 60) + m
}
const toHour = (time) => `${pad(Math.floor(time / 60))}:${pad(time % 60)}`

const diaDeSemana = (fecha) => {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(y, m - 1, d).getDay()
}
const rangoDeFechas = (desde, hasta) => {
  const [yd, md, dd] = desde.split("-").map(Number)
  const [yh, mh, dh] = hasta.split("-").map(Number)

  const fin = new Date(yh, mh - 1, dh).getDay()
  const fechas = []
  for (let current = new Date(yd, md - 1, dd); current <= fin; current.setDate(current.getDate + 1)) {
    fechas.push(`${current.getFullYear}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`)
  }
  return fechas
}

const slotsDelBloque = (horaInicio, horaFin, duracion) => {
  const slots = []

  for (let t = toMinutes(horaInicio); t + duracion <= toMinutes(horaFin); t += duracion) {
    slots.push(toHour(t))
  }
  return slots
}

export const calcularSlotsDisponibles = (horarios, turnos, desde, hasta, duracion = SLOT_DURATION_MIN) => {
  const porDia = new Map();
  for (const h of horarios) {
    if (!porDia.has(h.dia_semana)) porDia.set(h.dia_semana, []);
    porDia.get(h.dia_semana).push(h);
  }

  const ocupados = new Map();
  for (const t of turnos) {
    const hora = t.hora_turno.slice(0, 5);
    if (!ocupados.has(t.fecha_turno)) ocupados.set(t.fecha_turno, new Set());
    ocupados.get(t.fecha_turno).add(hora);
  }

  const ahora = new Date();
  const hoy = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();

  return rangoDeFechas(desde, hasta).map((fecha) => {
    const dia = diaDeSemana(fecha);
    const bloques = porDia.get(dia) || [];
    const tomados = ocupados.get(fecha) || new Set();

    let slots = bloques.flatMap((b) => slotsDelBloque(b.hora_inicio, b.hora_fin, duracion));
    slots = [...new Set(slots)].sort();
    slots = slots.filter((h) => !tomados.has(h));
    if (fecha === hoy) slots = slots.filter((h) => toMinutes(h) > minAhora);

    return { fecha, dia_semana: dia, slots };
  });
}