import { pool } from "../config/db.js"
import { ESTADOS_OCUPAN_SLOT } from "../config/constants.js"

// Writes accept an optional `conn` (from withTransaction) so a state change and
// its turno_evento row commit together; reads and standalone writes use the pool.
export class TurnosModel {
  static async getTurnoById(id, conn = pool) {
    const [row] = await conn.query(`
      SELECT t.id_turno, t.id_turno_origen,
             (SELECT n.id_turno FROM turno n WHERE n.id_turno_origen = t.id_turno ORDER BY n.id_turno DESC LIMIT 1) AS id_turno_nuevo,
             (SELECT ev.rol_actor FROM turno_evento ev WHERE ev.id_turno = t.id_turno AND ev.estado_nuevo = 'cancelado'
              ORDER BY ev.creado_en DESC, ev.id_evento DESC LIMIT 1) AS cancelado_por_rol,
             (SELECT ev.dni_actor FROM turno_evento ev WHERE ev.id_turno = t.id_turno AND ev.estado_nuevo = 'cancelado'
              ORDER BY ev.creado_en DESC, ev.id_evento DESC LIMIT 1) AS cancelado_por_dni,
             p_prof.apellido AS p_apellido, p_prof.nombre AS p_nombre, p_prof.dni_persona AS dni_profesional, pr_prof.correo AS p_correo, GROUP_CONCAT(e.tipo SEPARATOR ', ') AS tipo,
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

  /** Cancels only if the turno is still in `estadoOrigen`. Returns the affected rows (1 or 0). */
  static async cancelTurno({ id, estadoOrigen, motivo = null }, conn = pool) {
    const [result] = await conn.query(`
      UPDATE turno SET estado = 'cancelado', cancelado_en = NOW(), motivo_cancelacion = ?
      WHERE id_turno = ? AND estado = ?
    `, [motivo, id, estadoOrigen])

    return result.affectedRows
  }

  /** Moves the turno to `estadoNuevo` only if it is still in `estadoOrigen`. Returns the affected rows (1 or 0). */
  static async cambiarEstado({ id, estadoOrigen, estadoNuevo }, conn = pool) {
    const [result] = await conn.query(`
      UPDATE turno
      SET estado = ?, completado_en = IF(? = 'completado', NOW(), completado_en)
      WHERE id_turno = ? AND estado = ?
    `, [estadoNuevo, estadoNuevo, id, estadoOrigen])

    return result.affectedRows
  }

  static async insertEvento({ id_turno, estado_anterior = null, estado_nuevo, dni_actor, rol_actor, motivo = null }, conn = pool) {
    const [result] = await conn.query(`
      INSERT INTO turno_evento (id_turno, estado_anterior, estado_nuevo, dni_actor, rol_actor, motivo)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id_turno, estado_anterior, estado_nuevo, dni_actor, rol_actor, motivo])

    return result.insertId
  }

  static async getEventosByTurno(id) {
    const [rows] = await pool.query(`
      SELECT e.id_evento, e.estado_anterior, e.estado_nuevo, e.dni_actor, e.rol_actor,
             p.nombre AS actor_nombre, p.apellido AS actor_apellido, e.motivo, e.creado_en
      FROM turno_evento e
      LEFT JOIN persona p ON p.dni_persona = e.dni_actor
      WHERE e.id_turno = ?
      ORDER BY e.creado_en ASC, e.id_evento ASC
    `, [id])

    return rows
  }

  /** Events of every turno of a professional (filtered by the turno date), newest first, at most 200. */
  static async getEventosByProfesional({ dni, desde, hasta }) {
    let query = `
      SELECT e.id_evento, e.id_turno, e.estado_anterior, e.estado_nuevo, e.dni_actor, e.rol_actor,
             pa.nombre AS actor_nombre, pa.apellido AS actor_apellido, e.motivo, e.creado_en,
             t.fecha_turno, t.hora_turno, pc.nombre, pc.apellido
      FROM turno_evento e
      INNER JOIN turno t ON t.id_turno = e.id_turno
      INNER JOIN persona pc ON pc.dni_persona = t.dni_cliente
      LEFT JOIN persona pa ON pa.dni_persona = e.dni_actor
      WHERE t.dni_profesional = ?
    `
    const params = [dni]
    if (desde) {
      query += ` AND t.fecha_turno >= ?`
      params.push(desde)
    }
    if (hasta) {
      query += ` AND t.fecha_turno <= ?`
      params.push(hasta)
    }

    query += ` ORDER BY e.creado_en DESC, e.id_evento DESC LIMIT 200`
    const [rows] = await pool.query(query, params)

    return rows
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

  static async getTurnosOcupados({ dni, desde, hasta }) {
    const [rows] = await pool.query(`SELECT fecha_turno, hora_turno FROM turno 
      WHERE dni_profesional = ? AND estado IN (?) AND fecha_turno BETWEEN ? AND ?`
      , [dni, ESTADOS_OCUPAN_SLOT, desde, hasta])
    return rows
  }

  static async existeOcupado({ dni, fecha, hora }) {
    const [rows] = await pool.query(`
      SELECT 1 FROM turno WHERE dni_profesional = ? AND fecha_turno = ? AND hora_turno = ? AND estado IN (?)
      `, [dni, fecha, hora, ESTADOS_OCUPAN_SLOT])

    return rows.length > 0
  }

  static async crearTurno({ dni_profesional, dni_cliente, fecha_turno, hora_turno }, conn = pool) {
    const [result] = await conn.query(`
      INSERT INTO turno (fecha_turno, hora_turno, estado, dni_profesional, dni_cliente) VALUES (?, ?, 'confirmado', ?, ?)
      `, [fecha_turno, hora_turno, dni_profesional, dni_cliente])

    return result.insertId
  }

  static async getById({ id }) {
    const [rows] = await pool.query(`SELECT * FROM turno WHERE id_turno = ?`, [id])
    return rows[0]
  }
}
