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
        cliente.correo AS "c_correo",
        cliente.dni_cliente,
        profesional.correo AS "p_correo",
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
  static async existeActivo({ dni, fecha, hora }) {
    const [rows] = await pool.query(`
      SELECT 1 FROM turno WHERE dni_profesional = ? AND fecha_turno = ? AND hora_turno = ? AND estado = 'activo'
    
      `, [dni, fecha, hora])

    return rows.length > 0
  }
  static async crearTurno({ dni_profesional, dni_cliente, fecha_turno, hora_turno }) {
    const [result] = await pool.query(`
      INSERT INTO turno (fecha_turno,hora_turno,dni_profesional,dni_cliente) VALUES (?,?,?,?)
      `, [fecha_turno, hora_turno, dni_profesional, dni_cliente])

    return result.insertId
  }
  static async getById({ id }) {
    const [rows] = await pool.query(`SELECT * FROM turno WHERE id_turno = ?`, [id])
    return rows[0]
  }

  static async getTurnosByProfesional({ dni, desde, hasta, estado }) {
    const params = [dni, desde, hasta]
    const estadoClause = estado ? 'AND turno.estado = ?' : ''
    if (estado) params.push(estado)

    const [rows] = await pool.query(`
      SELECT
        turno.id_turno,
        turno.fecha_turno,
        turno.hora_turno,
        turno.estado,
        turno.cancelado_en,
        cliente.dni_cliente,
        cliente.nombre  AS c_nombre,
        cliente.apellido AS c_apellido
      FROM turno
      INNER JOIN cliente ON turno.dni_cliente = cliente.dni_cliente
      WHERE turno.dni_profesional = ?
        AND turno.fecha_turno BETWEEN ? AND ?
        ${estadoClause}
      ORDER BY turno.fecha_turno ASC, turno.hora_turno ASC
    `, params)

    return rows
  }
}