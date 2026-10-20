import { pool } from "../config/db.js"
import { ESTADOS_OCUPAN_SLOT } from "../config/constants.js"

const HISTORIAL_LIMITE = 200

export class AdminComunicacionesModel {
  /** La cuenta es el par (dni, rol); devuelve su correo o null si no existe. */
  static async findCuenta({ dni, rol }) {
    const [rows] = await pool.query(`
      SELECT pr.correo
      FROM persona_rol pr
      INNER JOIN rol r ON r.id_rol = pr.id_rol
      WHERE pr.dni_persona = ? AND r.nombre = ?
      `, [dni, rol])

    return rows[0] ?? null
  }

  /**
   * Correos de un segmento, más reciente no importa: el orden es estable para
   * que la muestra del preview y el envío coincidan. SIEMPRE excluye cuentas
   * dadas de baja (eliminado_en) y suspendidas (suspendido_en).
   */
  static async correosDeSegmento(segmento, { desde, hasta } = {}) {
    const activas = "pr.eliminado_en IS NULL AND pr.suspendido_en IS NULL"

    if (segmento === "profesionales") {
      const [rows] = await pool.query(`
        SELECT DISTINCT pr.correo
        FROM persona_rol pr
        INNER JOIN rol r ON r.id_rol = pr.id_rol AND r.nombre = 'profesional'
        WHERE ${activas}
        ORDER BY pr.correo
      `)
      return rows.map((fila) => fila.correo)
    }

    if (segmento === "clientes_turnos_activos") {
      // "Activos" = turnos que ocupan slot (v2): fuera cancelado y reprogramado.
      const estados = ESTADOS_OCUPAN_SLOT.map(() => "?").join(", ")
      const [rows] = await pool.query(`
        SELECT DISTINCT pr.correo
        FROM persona_rol pr
        INNER JOIN rol r ON r.id_rol = pr.id_rol AND r.nombre = 'cliente'
        INNER JOIN turno t ON t.dni_cliente = pr.dni_persona
        WHERE t.fecha_turno BETWEEN ? AND ?
          AND t.estado IN (${estados})
          AND ${activas}
        ORDER BY pr.correo
        `, [desde, hasta, ...ESTADOS_OCUPAN_SLOT])
      return rows.map((fila) => fila.correo)
    }

    const [rows] = await pool.query(`
      SELECT DISTINCT pr.correo
      FROM persona_rol pr
      WHERE ${activas}
      ORDER BY pr.correo
    `)
    return rows.map((fila) => fila.correo)
  }

  static async insertEnvio({
    dni_admin, tipo, segmento, segmento_params, destinatarios, cantidad, exitos, fallos, asunto, cuerpo,
  }, db = pool) {
    const [result] = await db.query(`
      INSERT INTO email_enviado
        (dni_admin, tipo, segmento, segmento_params, destinatarios, cantidad, exitos, fallos, asunto, cuerpo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
      dni_admin ?? null, tipo, segmento ?? null,
      segmento_params ? JSON.stringify(segmento_params) : null,
      JSON.stringify(destinatarios),
      cantidad, exitos, fallos, asunto, cuerpo,
    ])

    return result.insertId
  }

  static async listHistorial() {
    const [rows] = await pool.query(`
      SELECT
          e.id_envio AS id,
          e.dni_admin,
          p.nombre AS emisor_nombre,
          p.apellido AS emisor_apellido,
          e.tipo,
          e.segmento,
          e.segmento_params,
          e.destinatarios,
          e.cantidad,
          e.exitos,
          e.fallos,
          e.asunto,
          e.cuerpo,
          e.creado_en
      FROM email_enviado e
      LEFT JOIN persona p ON p.dni_persona = e.dni_admin
      ORDER BY e.creado_en DESC, e.id_envio DESC
      LIMIT ${HISTORIAL_LIMITE}
      `)

    return rows
  }
}
