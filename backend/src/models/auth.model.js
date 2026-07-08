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

}