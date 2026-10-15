import { pool } from "../config/db.js"

export class AuthModel {
  static async findCredentialsByDniAndRole(dni, role) {
    const [rows] = await pool.query(`
        SELECT
            pr.dni_persona AS dni,
            pr.correo,
            p.nombre,
            p.apellido,
            p.foto_url,
            pr.password_hash,
            r.nombre AS role
          FROM persona_rol pr
          INNER JOIN persona p 
            ON pr.dni_persona = p.dni_persona
          INNER JOIN rol r 
            ON pr.id_rol = r.id_rol
          WHERE pr.dni_persona = ? 
            AND r.nombre = ? 
            AND pr.eliminado_en IS NULL
      `, [dni, role])
    if (!rows[0]) return null

    return { ...rows[0] }
  }

  // --- Account existence / lookup (one query per concept, parametrized by role) ---
  // `db` defaults to the pool; pass a transaction connection to run inside it.

  static async existeCuenta({ dni, role }, db = pool) {
    const [rows] = await db.query(`
      SELECT 1
        FROM persona_rol pr
        INNER JOIN rol r ON r.id_rol = pr.id_rol
        WHERE pr.dni_persona = ? AND r.nombre = ?
        LIMIT 1
      `, [dni, role])

    return rows.length > 0
  }

  static async existeCorreo({ correo, role }, db = pool) {
    const [rows] = await db.query(`
      SELECT 1
        FROM persona_rol pr
        INNER JOIN rol r ON r.id_rol = pr.id_rol
        WHERE pr.correo = ? AND r.nombre = ?
        LIMIT 1
      `, [correo, role])

    return rows.length > 0
  }

  static async existeMatricula({ numero_matricula }, db = pool) {
    const [rows] = await db.query(`
      SELECT 1 FROM profesional WHERE numero_matricula = ? LIMIT 1
      `, [numero_matricula])

    return rows.length > 0
  }

  static async getPersona(dni, db = pool) {
    const [rows] = await db.query(`
      SELECT dni_persona AS dni, nombre, apellido
        FROM persona
        WHERE dni_persona = ?
      `, [dni])

    return rows[0] ?? null
  }

  // Active (approved, not deleted) accounts of a person: used to prove identity
  // when a DNI that already exists registers a new role.
  static async getCuentasActivas(dni, db = pool) {
    const [rows] = await db.query(`
      SELECT pr.password_hash
        FROM persona_rol pr
        WHERE pr.dni_persona = ?
          AND pr.estado = 'aprobado'
          AND pr.eliminado_en IS NULL
      `, [dni])

    return rows
  }

  // --- Account creation: every method takes the transaction connection ---

  static async insertPersona({ dni, nombre, apellido, fecha_nacimiento, genero, telefono }, db) {
    // No-op on duplicate DNI (a person can hold several roles) without
    // swallowing any other error, unlike INSERT IGNORE.
    await db.query(`
      INSERT INTO persona
        (dni_persona, nombre, apellido, fecha_nacimiento, genero, telefono)
      VALUES (?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE dni_persona = dni_persona
      `, [dni, nombre, apellido, fecha_nacimiento, genero, telefono ?? null])
  }

  static async insertCuenta({ dni, correo, password_hash, role, estado }, db) {
    await db.query(`
      INSERT INTO persona_rol
        (dni_persona, correo, password_hash, estado, id_rol)
      VALUES
        (?,?,?,?, (SELECT id_rol FROM rol WHERE nombre = ?))
      `, [dni, correo, password_hash, estado, role])
  }

  static async insertPerfilCliente({ dni, id_obra_social, numero_afiliado }, db) {
    await db.query(`
      INSERT INTO cliente
        (dni_cliente, id_obra_social, numero_afiliado, id_rol)
      VALUES (?,?,?, (SELECT id_rol FROM rol WHERE nombre = "cliente"))
      `, [dni, id_obra_social ?? null, numero_afiliado ?? null])
  }

  static async insertPerfilProfesional({ dni, numero_matricula }, db) {
    await db.query(`
      INSERT INTO profesional
        (dni_profesional, numero_matricula, id_rol)
      VALUES (?,?, (SELECT id_rol FROM rol WHERE nombre = "profesional"))
      `, [dni, numero_matricula])
  }

  static async getDniByCorreo({ correo, role }) {
    const [rows] = await pool.query(`
      SELECT 
          pr.dni_persona
        FROM persona_rol pr
        INNER JOIN rol r
          ON pr.id_rol = r.id_rol
        WHERE pr.correo = ? 
          AND r.nombre = ?
      `, [correo, role])
    return rows[0]
  }

  static async getPersonaByCorreo({ correo, role }) {
    const [rows] = await pool.query(`
      SELECT 
          persona_profesional.dni_persona,
          persona_profesional.apellido,
          persona_profesional.nombre,
          persona_rol_profesional.correo
        FROM persona AS persona_profesional
        INNER JOIN persona_rol AS persona_rol_profesional
          ON persona_profesional.dni_persona = persona_rol_profesional.dni_persona
        INNER JOIN rol r 
          ON persona_rol_profesional.id_rol = r.id_rol
        WHERE persona_rol_profesional.correo = ? AND r.nombre = "profesional"
      `, [correo, role])
    return rows[0]
  }

  static async resetPassWord({ dni, password_hashed, role }) {
    const [rows] = await pool.query(`
      UPDATE persona_rol 
      SET password_hash = ?
      WHERE dni_persona = ? 
        AND id_rol = (
          SELECT 
              id_rol 
            FROM rol 
            WHERE nombre = ?
        )
      `, [password_hashed, dni, role])

    return rows.affectedRows > 0
  }
}
