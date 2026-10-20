import { pool } from "../config/db.js"
import { aFechaISO } from "../utils/time.js"

// Bloqueos de agenda (PLAN_ADMIN.md §6.4 / §8.4 B1–B3 / §11.5).

const SELECT_BASE = `
  SELECT b.id_bloqueo, b.dni_profesional,
         p.nombre AS profesional_nombre, p.apellido AS profesional_apellido,
         b.fecha, b.hora_inicio, b.hora_fin, b.motivo, b.creado_por, b.creado_en
    FROM bloqueo_agenda b
    LEFT JOIN persona p ON p.dni_persona = b.dni_profesional`

const normalizar = (row) => ({
  ...row,
  id: row.id_bloqueo,
  dni_profesional: row.dni_profesional != null ? Number(row.dni_profesional) : null,
  fecha: aFechaISO(row.fecha),
  hora_inicio: row.hora_inicio ? String(row.hora_inicio).slice(0, 5) : null,
  hora_fin: row.hora_fin ? String(row.hora_fin).slice(0, 5) : null,
  motivo: row.motivo ?? null,
})

export class BloqueosModel {
  static async getAll({ desde, hasta, profesional = null } = {}) {
    const conditions = []
    const params = []

    if (desde) {
      conditions.push("b.fecha >= ?")
      params.push(desde)
    }
    if (hasta) {
      conditions.push("b.fecha <= ?")
      params.push(hasta)
    }
    if (profesional != null) {
      conditions.push("(b.dni_profesional = ? OR b.dni_profesional IS NULL)")
      params.push(profesional)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    const [rows] = await pool.query(
      `${SELECT_BASE}
       ${where}
       ORDER BY b.fecha ASC, b.hora_inicio IS NOT NULL ASC, b.hora_inicio ASC, b.id_bloqueo ASC`,
      params,
    )
    return rows.map(normalizar)
  }

  /** Bloqueos que afectan a un profesional (propios + centro) en el rango [desde, hasta]. */
  static async getParaProfesional({ dni, desde, hasta }, conn = pool) {
    const [rows] = await conn.query(
      `${SELECT_BASE}
       WHERE b.fecha BETWEEN ? AND ?
         AND (b.dni_profesional = ? OR b.dni_profesional IS NULL)
       ORDER BY b.fecha ASC, b.id_bloqueo ASC`,
      [desde, hasta, dni],
    )
    return rows.map(normalizar)
  }

  static async getById(id, conn = pool) {
    const [rows] = await conn.query(`${SELECT_BASE} WHERE b.id_bloqueo = ? LIMIT 1`, [id])
    return rows[0] ? normalizar(rows[0]) : null
  }

  static async createMany({ fechas, hora_inicio, hora_fin, dni_profesional, motivo, creado_por }, conn = pool) {
    const ids = []
    for (const fecha of fechas) {
      const [result] = await conn.query(
        `INSERT INTO bloqueo_agenda
           (dni_profesional, fecha, hora_inicio, hora_fin, motivo, creado_por)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          dni_profesional ?? null,
          fecha,
          hora_inicio ?? null,
          hora_fin ?? null,
          motivo ?? null,
          creado_por ?? null,
        ],
      )
      ids.push(result.insertId)
    }

    if (ids.length === 0) return []
    const [rows] = await conn.query(
      `${SELECT_BASE} WHERE b.id_bloqueo IN (?) ORDER BY b.fecha ASC, b.id_bloqueo ASC`,
      [ids],
    )
    return rows.map(normalizar)
  }

  static async delete(id) {
    const [result] = await pool.query(`DELETE FROM bloqueo_agenda WHERE id_bloqueo = ?`, [id])
    return result.affectedRows
  }
}
