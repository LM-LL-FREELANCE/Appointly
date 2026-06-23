import { pool } from "../config/db.js"

export class ClientesModel {

  /*   static async getTurnosClienteByDni(dni, estado) {
      const [rows] = await pool.query(`
        SELECT
          profesional.apellido AS "p_apellido",
          profesional.nombre AS "p_nombre",
          profesional.dni_profesional,
          especialidad.tipo,
          turno.id_turno,
          turno.fecha_turno,
          turno.hora_turno,
          turno.estado
        FROM
          turno
          INNER JOIN cliente ON turno.dni_cliente = cliente.dni_cliente
          INNER JOIN profesional ON turno.dni_profesional = profesional.dni_profesional
          INNER JOIN profesional_especialidad ON profesional.dni_profesional = profesional_especialidad.dni_profesional
          INNER JOIN especialidad ON especialidad.id_especialidad = profesional_especialidad.id_especialidad
        WHERE cliente.dni_cliente = ? AND turno.estado = ?
        `, [dni, estado])
  
      return rows
    } */

  static async getTurnosClienteByDni(dni) {
    const [rows] = await pool.query(`
      SELECT
        profesional.apellido AS "p_apellido",
        profesional.nombre AS "p_nombre",
        profesional.dni_profesional,
        especialidad.tipo,
        turno.id_turno,
        turno.fecha_turno,
        turno.hora_turno,
        turno.estado
      FROM
        turno
        INNER JOIN cliente ON turno.dni_cliente = cliente.dni_cliente
        INNER JOIN profesional ON turno.dni_profesional = profesional.dni_profesional
        INNER JOIN profesional_especialidad ON profesional.dni_profesional = profesional_especialidad.dni_profesional
        INNER JOIN especialidad ON especialidad.id_especialidad = profesional_especialidad.id_especialidad
      WHERE cliente.dni_cliente = ?
      `, [dni])

    return rows
  }

  static async existe({ dni }) {
    const [rows] = await pool.query(`
      SELECT 1 FROM cliente WHERE dni_cliente = ? LIMIT 1
      `, [dni])

    return rows.length > 0
  }
}