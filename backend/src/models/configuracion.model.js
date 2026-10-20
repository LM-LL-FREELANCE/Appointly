import { pool } from "../config/db.js"

// Configuración general del centro (PLAN_ADMIN.md §6.2 / §8.2 C1–C2).
// Fila singleton id=1; si no existe se devuelven los defaults seguros del plan.

export const CONFIGURACION_DEFAULT = Object.freeze({
  id: 1,
  nombre_centro: "",
  telefono: null,
  email_institucional: null,
  direccion: null,
  anticipacion_reserva_min: 0,
  limite_cancelacion_horas: 0,
  dias_habiles: [1, 2, 3, 4, 5],
  hora_apertura: "08:00",
  hora_cierre: "20:00",
  actualizado_en: null,
  actualizado_por: null,
})

const horaCorta = (valor) => (valor ? String(valor).slice(0, 5) : null)

const diasHabiles = (valor) => {
  if (Array.isArray(valor)) return valor.map(Number)

  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor)
      if (Array.isArray(parsed)) return parsed.map(Number)
    } catch {
      // JSON inválido: se usa el default seguro.
    }
  }

  return [...CONFIGURACION_DEFAULT.dias_habiles]
}

const normalizar = (row) => ({
  id: 1,
  nombre_centro: row.nombre_centro ?? "",
  telefono: row.telefono ?? null,
  email_institucional: row.email_institucional ?? null,
  direccion: row.direccion ?? null,
  anticipacion_reserva_min: Number(row.anticipacion_reserva_min ?? 0),
  limite_cancelacion_horas: Number(row.limite_cancelacion_horas ?? 0),
  dias_habiles: diasHabiles(row.dias_habiles),
  hora_apertura: horaCorta(row.hora_apertura),
  hora_cierre: horaCorta(row.hora_cierre),
  actualizado_en: row.actualizado_en ?? null,
  actualizado_por: row.actualizado_por ?? null,
})

export class ConfiguracionModel {
  static async get() {
    const [rows] = await pool.query(
      `SELECT id, nombre_centro, telefono, email_institucional, direccion,
              anticipacion_reserva_min, limite_cancelacion_horas, dias_habiles,
              hora_apertura, hora_cierre, actualizado_en, actualizado_por
         FROM configuracion WHERE id = 1 LIMIT 1`,
    )

    return rows[0] ? normalizar(rows[0]) : { ...CONFIGURACION_DEFAULT }
  }

  static async upsert(data, dniAdmin) {
    await pool.query(
      `INSERT INTO configuracion
         (id, nombre_centro, telefono, email_institucional, direccion,
          anticipacion_reserva_min, limite_cancelacion_horas, dias_habiles,
          hora_apertura, hora_cierre, actualizado_por)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nombre_centro = VALUES(nombre_centro),
         telefono = VALUES(telefono),
         email_institucional = VALUES(email_institucional),
         direccion = VALUES(direccion),
         anticipacion_reserva_min = VALUES(anticipacion_reserva_min),
         limite_cancelacion_horas = VALUES(limite_cancelacion_horas),
         dias_habiles = VALUES(dias_habiles),
         hora_apertura = VALUES(hora_apertura),
         hora_cierre = VALUES(hora_cierre),
         actualizado_por = VALUES(actualizado_por)`,
      [
        data.nombre_centro,
        data.telefono ?? null,
        data.email_institucional ?? null,
        data.direccion ?? null,
        data.anticipacion_reserva_min,
        data.limite_cancelacion_horas,
        JSON.stringify(data.dias_habiles),
        data.hora_apertura ?? null,
        data.hora_cierre ?? null,
        dniAdmin ?? null,
      ],
    )

    return ConfiguracionModel.get()
  }
}
