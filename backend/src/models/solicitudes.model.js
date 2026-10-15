import { pool } from "../config/db.js"

export class SolicitudesModel {
  // Pending account requests, oldest first (first come, first reviewed).
  static async listPendientes() {
    const [rows] = await pool.query(`
      SELECT
          pr.dni_persona AS dni,
          r.nombre AS role,
          p.nombre,
          p.apellido,
          pr.correo,
          p.telefono,
          p.fecha_nacimiento,
          p.genero,
          prof.numero_matricula,
          pr.creado_en
        FROM persona_rol pr
        INNER JOIN rol r ON r.id_rol = pr.id_rol
        INNER JOIN persona p ON p.dni_persona = pr.dni_persona
        LEFT JOIN profesional prof
          ON prof.dni_profesional = pr.dni_persona AND prof.id_rol = pr.id_rol
        WHERE pr.estado = 'pendiente'
          AND pr.eliminado_en IS NULL
        ORDER BY pr.creado_en ASC, pr.dni_persona ASC
      `)

    return rows
  }

  // Locks the pending request so approve/reject cannot race each other.
  static async findPendienteForUpdate({ dni, role }, db) {
    const [rows] = await db.query(`
      SELECT
          pr.dni_persona AS dni,
          r.nombre AS role,
          pr.correo,
          p.nombre,
          p.apellido
        FROM persona_rol pr
        INNER JOIN rol r ON r.id_rol = pr.id_rol
        INNER JOIN persona p ON p.dni_persona = pr.dni_persona
        WHERE pr.dni_persona = ?
          AND r.nombre = ?
          AND pr.estado = 'pendiente'
          AND pr.eliminado_en IS NULL
        FOR UPDATE
      `, [dni, role])

    return rows[0] ?? null
  }

  static async aprobar({ dni, role }, db) {
    await db.query(`
      UPDATE persona_rol
        SET estado = 'aprobado'
        WHERE dni_persona = ?
          AND id_rol = (SELECT id_rol FROM rol WHERE nombre = ?)
      `, [dni, role])
  }

  // Deleting the account row cascades to its subtype row (profesional).
  static async deleteCuenta({ dni, role }, db) {
    await db.query(`
      DELETE FROM persona_rol
        WHERE dni_persona = ?
          AND id_rol = (SELECT id_rol FROM rol WHERE nombre = ?)
      `, [dni, role])
  }

  // Removes the person only when no account (of any role) is left, so a
  // rejected applicant does not leave personal data behind.
  static async deletePersonaIfOrphan(dni, db) {
    await db.query(`
      DELETE FROM persona
        WHERE dni_persona = ?
          AND NOT EXISTS (SELECT 1 FROM persona_rol WHERE dni_persona = ?)
      `, [dni, dni])
  }
}
