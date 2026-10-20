import { pool } from "../config/db.js"

export class AdminMetricasModel {
  static async countTurnosEnFecha(fecha) {
    const [[row]] = await pool.query(
      "SELECT COUNT(*) AS total FROM turno WHERE fecha_turno = ?",
      [fecha],
    )
    return Number(row?.total ?? 0)
  }

  static async countPorEstado({ desde, hasta }) {
    const [rows] = await pool.query(
      `SELECT estado, COUNT(*) AS total
       FROM turno
       WHERE fecha_turno BETWEEN ? AND ?
       GROUP BY estado`,
      [desde, hasta],
    )
    return rows
  }

  static async getEspecialidadesTop({ desde, hasta, limit = 5 }) {
    const [rows] = await pool.query(
      `SELECT
          e.id_especialidad AS id,
          e.tipo,
          COUNT(DISTINCT t.id_turno) AS total
       FROM turno t
       INNER JOIN profesional_especialidad pe ON pe.dni_profesional = t.dni_profesional
       INNER JOIN especialidad e ON e.id_especialidad = pe.id_especialidad
       WHERE t.fecha_turno BETWEEN ? AND ?
       GROUP BY e.id_especialidad, e.tipo
       ORDER BY total DESC, e.tipo ASC
       LIMIT ?`,
      [desde, hasta, limit],
    )
    return rows.map((r) => ({
      id: Number(r.id),
      tipo: r.tipo,
      total: Number(r.total),
    }))
  }

  static async getProfesionalesTop({ desde, hasta, limit = 5 }) {
    const [rows] = await pool.query(
      `SELECT
          p.dni_profesional AS dni,
          per.nombre,
          per.apellido,
          per.foto_url,
          COUNT(t.id_turno) AS total
       FROM turno t
       INNER JOIN profesional p ON p.dni_profesional = t.dni_profesional
       INNER JOIN persona per ON per.dni_persona = p.dni_profesional
       WHERE t.fecha_turno BETWEEN ? AND ?
       GROUP BY p.dni_profesional, per.nombre, per.apellido, per.foto_url
       ORDER BY total DESC, per.apellido ASC, per.nombre ASC
       LIMIT ?`,
      [desde, hasta, limit],
    )
    return rows.map((r) => ({
      dni: Number(r.dni),
      nombre: r.nombre,
      apellido: r.apellido,
      foto_url: r.foto_url ?? null,
      total: Number(r.total),
    }))
  }

  static async getHorasPico({ desde, hasta }) {
    const [rows] = await pool.query(
      `SELECT
          CONCAT(LPAD(HOUR(t.hora_turno), 2, '0'), ':00') AS hora,
          COUNT(*) AS total
       FROM turno t
       WHERE t.fecha_turno BETWEEN ? AND ?
       GROUP BY hora
       ORDER BY hora ASC`,
      [desde, hasta],
    )
    return rows.map((r) => ({
      hora: r.hora,
      total: Number(r.total),
    }))
  }

  static async getNuevosClientesPorMes({ desdePeriodo }) {
    const [rows] = await pool.query(
      `SELECT
          DATE_FORMAT(pr.creado_en, '%Y-%m') AS periodo,
          COUNT(*) AS total
       FROM persona_rol pr
       INNER JOIN rol r ON r.id_rol = pr.id_rol AND r.nombre = 'cliente'
       WHERE pr.creado_en >= ?
       GROUP BY periodo
       ORDER BY periodo ASC`,
      [`${desdePeriodo}-01 00:00:00`],
    )
    return rows.map((r) => ({
      periodo: r.periodo,
      total: Number(r.total),
    }))
  }
}
