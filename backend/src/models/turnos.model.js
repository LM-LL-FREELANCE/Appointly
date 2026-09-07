import { pool } from "../config/db.js"

export class TurnosModel {
  static async getTurnoById(id) {
    const [row] = await pool.query(`
      SELECT p_prof.apellido AS p_apellido, p_prof.nombre AS p_nombre, p_prof.dni_persona AS dni_profesional, pr_prof.correo AS p_correo, GROUP_CONCAT(e.tipo SEPARATOR ', ') AS tipo,
             p_cli.apellido AS c_apellido, p_cli.nombre AS c_nombre, pr_cli.correo AS c_correo, p_cli.foto_url AS c_foto_url, t.dni_cliente,
             t.fecha_turno, t.hora_turno, t.estado, t.motivo_cancelacion, t.creado_en, t.completado_en, t.cancelado_en
      FROM turno AS t
      INNER JOIN persona_rol pr_cli ON pr_cli.dni_persona = t.dni_cliente AND pr_cli.id_rol = 1
      INNER JOIN persona p_cli ON p_cli.dni_persona = t.dni_cliente
      INNER JOIN persona_rol pr_prof ON pr_prof.dni_persona = t.dni_profesional AND pr_prof.id_rol = 2
      INNER JOIN persona p_prof ON p_prof.dni_persona = t.dni_profesional
      INNER JOIN profesional_especialidad p_e ON p_e.dni_profesional = t.dni_profesional
      INNER JOIN especialidad e ON e.id_especialidad = p_e.id_especialidad
      WHERE t.id_turno = ?
      GROUP BY t.id_turno, p_prof.apellido, p_prof.nombre, p_prof.dni_persona, pr_prof.correo,
               p_cli.apellido, p_cli.nombre, pr_cli.correo, p_cli.foto_url, t.dni_cliente
    `, [id])

    return row[0] ?? null
  }

  static async cancelTurno(id, motivo = null) {
    await pool.query(`
      UPDATE turno SET estado = 'cancelado', cancelado_en = NOW(), motivo_cancelacion = ?
      WHERE turno.id_turno = ?
    `, [motivo, id])

    return this.getTurnoById(id)
  }

  static async getTurnosByProfesional({ dni, desde, hasta, estado }) {
    let query = `
    SELECT t.id_turno, t.fecha_turno, t.hora_turno, t.estado, t.creado_en, t.completado_en, t.cancelado_en,
           p.dni_persona AS dni, p.nombre, p.apellido, p.foto_url
    FROM turno t
    INNER JOIN persona p ON p.dni_persona = t.dni_cliente
    WHERE t.dni_profesional = ? AND t.fecha_turno BETWEEN ? AND ?
  `
    const params = [dni, desde, hasta]
    if (estado) {
      query += ` AND t.estado = ?`
      params.push(estado)
    }

    query += ` ORDER BY t.fecha_turno, t.hora_turno`
    const [rows] = await pool.query(query, params)

    return rows
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
      INSERT INTO turno (fecha_turno, hora_turno, dni_profesional, dni_cliente) VALUES (?, ?, ?, ?)
      `, [fecha_turno, hora_turno, dni_profesional, dni_cliente])

    return result.insertId
  }

  static async getById({ id }) {
    const [rows] = await pool.query(`SELECT * FROM turno WHERE id_turno = ?`, [id])
    return rows[0]
  }
}
