import { pool } from "../config/db.js"
import { userPermission, buildPermission } from "../utils/userPermission.js"

export class AuthModel {
  static async #insertPersona(connection, { dni_persona, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero }) {
    await connection.query(`
      INSERT INTO persona (dni_persona, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [dni_persona, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero])
  }

  //DONE - roles are now an array
  //TODO: create account
  static async findCredentialsByDniAndRole(dni) {

    //const table = role === 'profesional' ? 'profesional' : 'cliente'
    //const col = role === 'profesional' ? 'dni_profesional' : 'dni_cliente'

    /*const [rows] = await pool.query(
      `SELECT ${col} AS dni, nombre, apellido, password_hash FROM ${table} WHERE ${col} = ?`,
      [dni]
    )*/

    const [rows] = await pool.query(`
      SELECT
        p.dni_persona, p.correo, p.password_hash, p.nombre, p.apellido,
        (pr.dni_profesional IS NOT NULL)   AS es_profesional,
        COALESCE(pr.es_admin, FALSE)       AS es_admin_profesional,
        (c.dni_cliente IS NOT NULL)        AS es_cliente,
        (a.dni_admin IS NOT NULL)          AS es_admin_dedicado
      FROM persona p
      LEFT JOIN profesional pr ON pr.dni_profesional = p.dni_persona
      LEFT JOIN cliente c      ON c.dni_cliente      = p.dni_persona
      LEFT JOIN admin a        ON a.dni_admin        = p.dni_persona
      WHERE p.dni_persona = ? AND p.eliminado_en IS NULL
    `, [dni])

    const roles = buildPermission(rows[0])

    const { es_profesional, es_admin_profesional, es_cliente, es_admin_dedicado, ...credentials } = rows[0]

    return rows[0] ? { ...credentials, roles } : null
  }

  //DONE
  static async existeDni(dni) {
    const [rows] = await pool.query(`
      SELECT 1 FROM persona WHERE dni_persona = ? LIMIT 1
      `, [dni])

    return rows.length > 0
  }

  //DONE
  static async existeCorreo(correo) {
    const [rows] = await pool.query(`
      SELECT 1 FROM persona WHERE correo = ? LIMIT 1
      `, [correo])

    return rows.length > 0
  }

  //cliente
  /*static async createAccount({ dni, password_hash, correo, nombre, apellido, fecha_nacimiento, genero, id_obra_social }) {
    const [result] = await pool.query(`INSERT INTO cliente (dni_cliente, nombre, apellido, correo, password_hash, fecha_nacimiento, genero, id_obra_social) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [dni, nombre, apellido, correo, password_hash, fecha_nacimiento, genero, id_obra_social])
    return result
  }*/

  /*static async existeCorreoProfesional(correo) {
    const [rows] = await pool.query(`
      SELECT 1 FROM profesional WHERE correo = ? LIMIT 1
      `, [correo])

    return rows.length > 0
  }*/

  /*static async createProfesionalAccount({ dni, password_hash, correo, nombre, apellido, fecha_nacimiento, genero }) {
    const [result] = await pool.query(`INSERT INTO profesional (dni_profesional, nombre, apellido, correo, password_hash, fecha_nacimiento, genero) VALUES (?, ?, ?, ?, ?, ?, ?)`, [dni, nombre, apellido, correo, password_hash, fecha_nacimiento, genero])
    return result
  }*/

  //DONE
  //TODO: CHECK DATA RESULTS in service
  static async createAccount(data, role) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await this.#insertPersona(conn, data)

      switch (role) {
        case userPermission.CLIENTE:
          await conn.query(`INSERT INTO cliente (dni_cliente, id_obra_social) VALUES (?, ?)`,
            [data.dni_persona, data.id_obra_social ?? null])
          break
        case userPermission.PROFESIONAL:
          await conn.query(`INSERT INTO profesional (dni_profesional, es_admin) VALUES (?, ?)`,
            [data.dni_persona, data.es_admin ?? false])
          break
        case userPermission.ADMIN:
          await conn.query(`INSERT INTO admin (dni_admin) VALUES (?)`, [data.dni_persona])
          break
        default:
          throw new AppError(`Rol inválido: ${role}`, 400, 'INVALID_ROLE')
      }

      await conn.commit()
      return data

    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }

}
