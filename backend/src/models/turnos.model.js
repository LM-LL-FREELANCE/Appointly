import { pool } from "../config/db.js"

export class TurnosModel {

  static async getTurnoById(id) {
    const [row] = await pool.query(`
      SELECT
        profesional.apellido AS "p_apellido",
        profesional.nombre AS "p_nombre",
        profesional.dni_profesional,
        especialidad.tipo,
        cliente.apellido AS "c_apellido",
        cliente.nombre AS "c_nombre",
        cliente.dni_cliente,
        turno.fecha_turno,
        turno.hora_turno,
        turno.estado,
        turno.creado_en,
        turno.cancelado_en
      FROM
        turno
        INNER JOIN cliente ON turno.dni_cliente = cliente.dni_cliente
        INNER JOIN profesional ON turno.dni_profesional = profesional.dni_profesional
        INNER JOIN profesional_especialidad ON profesional.dni_profesional = profesional_especialidad.dni_profesional
        INNER JOIN especialidad ON especialidad.id_especialidad = profesional_especialidad.id_especialidad
      WHERE turno.id_turno = ?`, [id])

    return row[0] ?? null
  }

  static async cancelTurno(id) {
    await pool.query(`
        UPDATE turno SET estado = 'cancelado', cancelado_en = NOW()
        WHERE turno.id_turno = ?
        `, [id])

    return this.getTurnoById(id)
  }
  static async getTurnosActivos({ dni, desde, hasta }) {
    const [rows] = await pool.query(`SELECT fecha_turno, hora_turno FROM turno 
      WHERE dni_profesional = ? AND estado = 'activo' AND fecha_turno BETWEEN ? AND ?`
      , [dni, desde, hasta])
    return rows
  }
}