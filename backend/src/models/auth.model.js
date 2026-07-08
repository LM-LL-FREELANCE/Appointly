import { pool } from "../config/db.js"

export class AuthModel {

  static async findCredentialsByDni(dni) {
    const [result] = await pool.query(`
      SELECT profesional.dni_profesional, profesional.password_hash, 'profesional' AS role
      FROM profesional WHERE dni_profesional = ?
      UNION ALL
      SELECT cliente.dni_cliente, cliente.password_hash, 'cliente' AS role
      FROM cliente WHERE dni_cliente = ?
      `, [dni, dni])

    return result ?? null
  }

  static async existeDni(dni) {
    const [rows] = await pool.query(`
      SELECT 1 FROM profesional WHERE dni_profesional = ?
      UNION ALL
      SELECT 1 FROM cliente WHERE dni_cliente = ?
      LIMIT 1
      `, [dni, dni])

    return rows.length > 0
  }

  static async existeCorreo(correo) {
    const [rows] = await pool.query(`
      SELECT 1 FROM cliente WHERE correo = ? LIMIT 1
      `, [correo])

    return rows.length > 0
  }

  static async createAccount({ dni, password_hash, correo, nombre, apellido, fecha_nacimiento, genero, id_obra_social }) {
    const [result] = await pool.query(`INSERT INTO cliente (dni_cliente, nombre, apellido, correo, password_hash, fecha_nacimiento, genero, id_obra_social) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [dni, nombre, apellido, correo, password_hash, fecha_nacimiento, genero, id_obra_social])
    return result
  }
}