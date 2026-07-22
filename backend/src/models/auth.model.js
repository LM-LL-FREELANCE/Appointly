import { pool } from "../config/db.js"

export class AuthModel {

  static async findCredentialsByDniAndRole(dni, role) {

    const table = role === 'profesional' ? 'profesional' : 'cliente'
    const col = role === 'profesional' ? 'dni_profesional' : 'dni_cliente'

    const [rows] = await pool.query(
      `SELECT ${col} AS dni, nombre, apellido, password_hash FROM ${table} WHERE ${col} = ?`,
      [dni]
    )

    return rows[0] ? { ...rows[0], role } : null
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

  static async existeCorreoProfesional(correo) {
    const [rows] = await pool.query(`
      SELECT 1 FROM profesional WHERE correo = ? LIMIT 1
      `, [correo])

    return rows.length > 0
  }

  static async createProfesionalAccount({ dni, password_hash, correo, nombre, apellido, fecha_nacimiento, genero }) {
    const [result] = await pool.query(`INSERT INTO profesional (dni_profesional, nombre, apellido, correo, password_hash, fecha_nacimiento, genero) VALUES (?, ?, ?, ?, ?, ?, ?)`, [dni, nombre, apellido, correo, password_hash, fecha_nacimiento, genero])
    return result
  }
}