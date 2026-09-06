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

  static async existeDniCliente(dni) {
    const [rows] = await pool.query(`
      SELECT 1 FROM cliente WHERE dni_cliente = ? LIMIT 1
      `, [dni])

    return rows.length > 0
  }

  static async existeCorreoCliente(correo) {
    const [rows] = await pool.query(`
      SELECT 
          1 
        FROM persona_rol AS pr 
        INNER JOIN rol r ON r.id_rol = pr.id_rol 
        WHERE pr.correo = ? 
          AND r.nombre = "cliente"
        LIMIT 1
      `, [correo])

    return rows.length > 0
  }

  static async existeDniProfesional(dni) {
    const [rows] = await pool.query(`
      SELECT 
          1 
        FROM profesional 
        WHERE dni_profesional = ? 
        LIMIT 1
      `, [dni])

    return rows.length > 0
  }

  static async existeCorreoProfesional(correo) {
    const [rows] = await pool.query(`
      SELECT 
          1 
        FROM persona_rol pr
        INNER JOIN rol r ON r.id_rol = pr.id_rol
        WHERE pr.correo = ?
        AND r.nombre = "profesional"
        LIMIT 1
      `, [correo])

    return rows.length > 0
  }

  static async createClienteAccount({ data }) {
    const { dni, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero, id_obra_social, numero_afiliado } = data

    await pool.query(`
      INSERT IGNORE INTO 
        persona(dni_persona, nombre, apellido, fecha_nacimiento, genero, telefono) 
      VALUES
        (?,?,?,?,?,?)
      `, [dni, nombre, apellido, fecha_nacimiento, genero, telefono ?? null])
    await pool.query(`
      INSERT INTO 
        persona_rol(dni_persona, correo, password_hash, id_rol) 
      VALUES
        (?,?,?, (
        SELECT 
            id_rol 
          FROM rol
          WHERE nombre = "cliente"
        ))
      `, [dni, correo, password_hash])

    await pool.query(`
      INSERT INTO cliente
        (dni_cliente, id_obra_social, numero_afiliado, id_rol)
      VALUES (?,?,?,(
        SELECT
            id_rol
          FROM rol 
          WHERE nombre = "cliente"
      ))
      `, [dni, id_obra_social ?? null, numero_afiliado ?? null])
    return true
  }

  static async createProfesionalAccount({ data }) {
    const { dni, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero, numero_matricula } = data
    await pool.query(`
      INSERT IGNORE INTO persona
        (dni_persona, nombre, apellido, fecha_nacimiento, genero, telefono)
      VALUES 
        (?,?,?,?,?,?)
      `, [dni, nombre, apellido, fecha_nacimiento, genero, telefono ?? null])
    await pool.query(`
      INSERT IGNORE INTO persona_rol
        (dni_persona, correo, password_hash, id_rol)
      VALUES 
        (?,?,?, (
          SELECT 
              id_rol
            FROM rol
            WHERE nombre = "profesional"
        ))
      `, [dni, correo, password_hash])

    await pool.query(`
        INSERT INTO profesional
          (dni_profesional,numero_matricula, id_rol)
        VALUES
          (?,?,(
          SELECT
              id_rol
            FROM rol
            WHERE nombre = "profesional"
          ))
        `, [dni, numero_matricula])
    return true
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
