import { pool } from "../config/db.js"

const ROL_ADMIN = "admin"

export class InvitacionesModel {
  static async insert({ tokenHash, dni, correo, creadoPor, ttlHoras }, db = pool) {
    // expira_en is computed by the database clock, the same one that later
    // decides validity, so app/DB timezone drift cannot extend or shorten it.
    const [result] = await db.query(`
      INSERT INTO invitacion
        (token_hash, dni_persona, correo, id_rol, creado_por, expira_en)
      VALUES
        (?, ?, ?, (SELECT id_rol FROM rol WHERE nombre = ?), ?, DATE_ADD(NOW(), INTERVAL ? HOUR))
      `, [tokenHash, dni, correo, ROL_ADMIN, creadoPor ?? null, ttlHoras])

    return result.insertId
  }

  // Revokes the still-pending invitations of a DNI (re-inviting replaces them).
  static async revokePendientesByDni(dni, db = pool) {
    const [result] = await db.query(`
      UPDATE invitacion
        SET revocada_en = NOW()
        WHERE dni_persona = ?
          AND id_rol = (SELECT id_rol FROM rol WHERE nombre = ?)
          AND usada_en IS NULL
          AND revocada_en IS NULL
      `, [dni, ROL_ADMIN])

    return result.affectedRows
  }

  static async revokeById(id) {
    const [result] = await pool.query(`
      UPDATE invitacion
        SET revocada_en = NOW()
        WHERE id_invitacion = ?
          AND usada_en IS NULL
          AND revocada_en IS NULL
      `, [id])

    return result.affectedRows > 0
  }

  static async findByHash(tokenHash) {
    const [rows] = await pool.query(`
      SELECT
          id_invitacion AS id,
          dni_persona AS dni,
          correo,
          usada_en IS NOT NULL AS usada,
          revocada_en IS NOT NULL AS revocada,
          expira_en <= NOW() AS vencida
        FROM invitacion
        WHERE token_hash = ?
      `, [tokenHash])

    return rows[0] ?? null
  }

  // Atomic: only one caller can flip a still-valid invitation to used.
  // Returns true when this call consumed it.
  static async consume(tokenHash, db) {
    const [result] = await db.query(`
      UPDATE invitacion
        SET usada_en = NOW()
        WHERE token_hash = ?
          AND usada_en IS NULL
          AND revocada_en IS NULL
          AND expira_en > NOW()
      `, [tokenHash])

    return result.affectedRows === 1
  }

  static async list() {
    const [rows] = await pool.query(`
      SELECT
          id_invitacion AS id,
          dni_persona AS dni,
          correo,
          creada_en,
          expira_en,
          CASE
            WHEN usada_en IS NOT NULL THEN 'usada'
            WHEN revocada_en IS NOT NULL THEN 'revocada'
            WHEN expira_en <= NOW() THEN 'vencida'
            ELSE 'pendiente'
          END AS estado
        FROM invitacion
        ORDER BY creada_en DESC, id_invitacion DESC
        LIMIT 200
      `)

    return rows
  }
}
