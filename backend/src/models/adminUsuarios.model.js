import { pool } from "../config/db.js"

// Estado de la cuenta derivado de las marcas de tiempo (§3.2 del plan):
// baja gana sobre suspendida; suspendida gana sobre activa.
const ESTADO_SQL = `
  CASE
    WHEN pr.eliminado_en IS NOT NULL THEN 'baja'
    WHEN pr.suspendido_en IS NOT NULL THEN 'suspendida'
    ELSE 'activa'
  END`

// `%`, `_` y `\` tipeados en el buscador son texto, no comodines de LIKE.
const escapeLike = (texto) => texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`)

export class AdminUsuariosModel {
  static async list({ rol, estado, q }, conn = pool) {
    const conditions = []
    const params = []

    if (rol) {
      conditions.push("r.nombre = ?")
      params.push(rol)
    }
    if (estado === "baja") {
      conditions.push("pr.eliminado_en IS NOT NULL")
    } else if (estado === "suspendida") {
      conditions.push("pr.eliminado_en IS NULL AND pr.suspendido_en IS NOT NULL")
    } else if (estado === "activa") {
      conditions.push("pr.eliminado_en IS NULL AND pr.suspendido_en IS NULL")
    }
    if (q) {
      conditions.push(`(
        p.nombre LIKE ? OR p.apellido LIKE ? OR pr.correo LIKE ? OR CAST(pr.dni_persona AS CHAR) LIKE ?
      )`)
      const like = `%${escapeLike(q)}%`
      params.push(like, like, like, like)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const [rows] = await conn.query(`
      SELECT
          pr.dni_persona AS dni,
          r.nombre AS rol,
          p.nombre,
          p.apellido,
          p.telefono,
          p.foto_url,
          pr.correo,
          pr.creado_en,
          ${ESTADO_SQL} AS estado
        FROM persona_rol pr
        INNER JOIN persona p ON p.dni_persona = pr.dni_persona
        INNER JOIN rol r ON r.id_rol = pr.id_rol
        ${where}
        ORDER BY p.apellido, p.nombre, pr.dni_persona, r.id_rol
        LIMIT 500
    `, params)

    return rows
  }

  static async getCuenta({ dni, rol }, conn = pool) {
    const [rows] = await conn.query(`
      SELECT
          pr.dni_persona AS dni,
          r.nombre AS rol,
          p.nombre,
          p.apellido,
          p.fecha_nacimiento,
          p.genero,
          p.telefono,
          p.foto_url,
          pr.correo,
          pr.creado_en,
          pr.suspendido_en,
          pr.eliminado_en,
          ${ESTADO_SQL} AS estado
        FROM persona_rol pr
        INNER JOIN persona p ON p.dni_persona = pr.dni_persona
        INNER JOIN rol r ON r.id_rol = pr.id_rol
        WHERE pr.dni_persona = ? AND r.nombre = ?
    `, [dni, rol])

    return rows[0] ?? null
  }

  /** Datos de perfil que dependen del rol. Admin no tiene perfil propio. */
  static async getPerfil({ dni, rol }, conn = pool) {
    if (rol === "cliente") {
      const [rows] = await conn.query(`
        SELECT
            o.id_obra_social AS id_obra_social,
            o.nombre_obra_social AS obra_social,
            c.numero_afiliado
          FROM cliente c
          LEFT JOIN obra_social o ON o.id_obra_social = c.id_obra_social
          WHERE c.dni_cliente = ?
      `, [dni])

      return rows[0] ?? null
    }

    if (rol === "profesional") {
      const [rows] = await conn.query(`
        SELECT numero_matricula, duracion_turno_min
          FROM profesional
          WHERE dni_profesional = ?
      `, [dni])

      return rows[0] ?? null
    }

    return null
  }

  /** Ultimos 50 turnos con la contraparte (profesional del cliente o cliente del profesional). */
  static async getTurnos({ dni, rol }, conn = pool) {
    const esCliente = rol === "cliente"
    const columnaContraparte = esCliente ? "t.dni_profesional" : "t.dni_cliente"
    const columnaPropia = esCliente ? "t.dni_cliente" : "t.dni_profesional"

    const [rows] = await conn.query(`
      SELECT
          t.id_turno,
          t.fecha_turno,
          t.hora_turno,
          t.estado,
          t.motivo_cancelacion,
          p.nombre AS contraparte_nombre,
          p.apellido AS contraparte_apellido,
          p.foto_url AS contraparte_foto_url,
          ${columnaContraparte} AS contraparte_dni
        FROM turno t
        INNER JOIN persona p ON p.dni_persona = ${columnaContraparte}
        WHERE ${columnaPropia} = ?
        ORDER BY t.fecha_turno DESC, t.hora_turno DESC, t.id_turno DESC
        LIMIT 50
    `, [dni])

    return rows
  }

  static async updateTelefono({ dni, telefono }, conn = pool) {
    const [result] = await conn.query(
      "UPDATE persona SET telefono = ? WHERE dni_persona = ?",
      [telefono, dni],
    )

    return result.affectedRows
  }

  static async findObraSocialId({ id, nombre }, conn = pool) {
    const [rows] = await conn.query(`
      SELECT id_obra_social
        FROM obra_social
        WHERE ${id !== undefined ? "id_obra_social = ?" : "nombre_obra_social = ?"}
        LIMIT 1
    `, [id ?? nombre])

    return rows[0]?.id_obra_social ?? null
  }

  static async insertObraSocial(nombre, conn = pool) {
    const [result] = await conn.query(
      "INSERT INTO obra_social (nombre_obra_social) VALUES (?)",
      [nombre],
    )

    return result.insertId
  }

  static async updateClientePerfil({ dni, id_obra_social, numero_afiliado }, conn = pool) {
    const fields = []
    const values = []

    if (id_obra_social !== undefined) {
      fields.push("id_obra_social = ?")
      values.push(id_obra_social)
    }
    if (numero_afiliado !== undefined) {
      fields.push("numero_afiliado = ?")
      values.push(numero_afiliado)
    }
    if (fields.length === 0) return 0

    const [result] = await conn.query(
      `UPDATE cliente SET ${fields.join(", ")} WHERE dni_cliente = ?`,
      [...values, dni],
    )

    return result.affectedRows
  }

  static async matriculaEnUso({ dni, numero_matricula }, conn = pool) {
    const [rows] = await conn.query(`
      SELECT 1
        FROM profesional
        WHERE numero_matricula = ? AND dni_profesional != ?
        LIMIT 1
    `, [numero_matricula, dni])

    return rows.length > 0
  }

  static async updateProfesionalData({ dni, numero_matricula, duracion_turno_min }, conn = pool) {
    const fields = []
    const values = []

    if (numero_matricula !== undefined) {
      fields.push("numero_matricula = ?")
      values.push(numero_matricula)
    }
    if (duracion_turno_min !== undefined) {
      fields.push("duracion_turno_min = ?")
      values.push(duracion_turno_min)
    }
    if (fields.length === 0) return 0

    const [result] = await conn.query(
      `UPDATE profesional SET ${fields.join(", ")} WHERE dni_profesional = ?`,
      [...values, dni],
    )

    return result.affectedRows
  }

  /** Solo suspende cuentas no suspendidas todavia (idempotente por WHERE). */
  static async suspender({ dni, rol }, conn = pool) {
    const [result] = await conn.query(`
      UPDATE persona_rol pr
      INNER JOIN rol r ON r.id_rol = pr.id_rol
      SET pr.suspendido_en = NOW()
      WHERE pr.dni_persona = ? AND r.nombre = ? AND pr.suspendido_en IS NULL
    `, [dni, rol])

    return result.affectedRows > 0
  }

  /** Reactiva: limpia suspension Y baja logica (una cuenta reactivada vuelve a estar activa). */
  static async reactivar({ dni, rol }, conn = pool) {
    const [result] = await conn.query(`
      UPDATE persona_rol pr
      INNER JOIN rol r ON r.id_rol = pr.id_rol
      SET pr.suspendido_en = NULL, pr.eliminado_en = NULL
      WHERE pr.dni_persona = ?
        AND r.nombre = ?
        AND (pr.suspendido_en IS NOT NULL OR pr.eliminado_en IS NOT NULL)
    `, [dni, rol])

    return result.affectedRows > 0
  }

  static async darDeBaja({ dni, rol }, conn = pool) {
    const [result] = await conn.query(`
      UPDATE persona_rol pr
      INNER JOIN rol r ON r.id_rol = pr.id_rol
      SET pr.eliminado_en = NOW()
      WHERE pr.dni_persona = ? AND r.nombre = ? AND pr.eliminado_en IS NULL
    `, [dni, rol])

    return result.affectedRows > 0
  }
}
