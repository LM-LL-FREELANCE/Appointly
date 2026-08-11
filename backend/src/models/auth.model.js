import { pool } from "../config/db.js"
import { userPermission } from "../utils/userPermission.js"
import { AppError } from "../utils/AppError.js"

// Every query targets one role table through a literal SQL string. Table and
// column names are never interpolated, so an unknown role cannot reach the
// database: it is rejected by the dispatcher below before any query runs.
export class AuthModel {

  // --- credentials -----------------------------------------------------------
  // `role` is a constant written into each method, never read from the row, so
  // the JWT claim built from it can never be undefined.
  // `eliminado_en IS NULL` belongs here only: a soft-deleted account must not
  // authenticate, but it still holds its PK and UNIQUE index (see existe* below).

  static async findClienteCredentials(dni) {
    const [rows] = await pool.query(`
      SELECT dni_cliente AS dni, correo, nombre, apellido, password_hash
      FROM cliente
      WHERE dni_cliente = ? AND eliminado_en IS NULL
      `, [dni])

    if (!rows[0]) return null

    return { ...rows[0], role: userPermission.CLIENTE, es_admin: false }
  }

  static async findProfesionalCredentials(dni) {
    const [rows] = await pool.query(`
      SELECT dni_profesional AS dni, correo, nombre, apellido, password_hash, es_admin
      FROM profesional
      WHERE dni_profesional = ? AND eliminado_en IS NULL
      `, [dni])

    if (!rows[0]) return null

    return { ...rows[0], role: userPermission.PROFESIONAL, es_admin: !!rows[0].es_admin }
  }

  static async findAdminCredentials(dni) {
    const [rows] = await pool.query(`
      SELECT dni_admin AS dni, correo, nombre, apellido, password_hash
      FROM admin
      WHERE dni_admin = ? AND eliminado_en IS NULL
      `, [dni])

    if (!rows[0]) return null

    return { ...rows[0], role: userPermission.ADMIN, es_admin: true }
  }

  static async findCredentialsByDniAndRole(dni, role) {
    switch (role) {
      case userPermission.CLIENTE:
        return this.findClienteCredentials(dni)
      case userPermission.PROFESIONAL:
        return this.findProfesionalCredentials(dni)
      case userPermission.ADMIN:
        return this.findAdminCredentials(dni)
      default:
        throw new AppError('Rol inválido: ' + role, 400, 'INVALID_ROLE')
    }
  }

  // --- existence checks ------------------------------------------------------
  // Deliberately NOT filtered by `eliminado_en`: a soft-deleted row still owns
  // the primary key and the UNIQUE correo index, so ignoring it would turn a
  // clean 409 into a duplicate-key 500 on insert.

  static async existeDniCliente(dni) {
    const [rows] = await pool.query(`
      SELECT 1 FROM cliente WHERE dni_cliente = ? LIMIT 1
      `, [dni])

    return rows.length > 0
  }

  static async existeCorreoCliente(correo) {
    const [rows] = await pool.query(`
      SELECT 1 FROM cliente WHERE correo = ? LIMIT 1
      `, [correo])

    return rows.length > 0
  }

  static async existeDniProfesional(dni) {
    const [rows] = await pool.query(`
      SELECT 1 FROM profesional WHERE dni_profesional = ? LIMIT 1
      `, [dni])

    return rows.length > 0
  }

  static async existeCorreoProfesional(correo) {
    const [rows] = await pool.query(`
      SELECT 1 FROM profesional WHERE correo = ? LIMIT 1
      `, [correo])

    return rows.length > 0
  }

  static async existeDniAdmin(dni) {
    const [rows] = await pool.query(`
      SELECT 1 FROM admin WHERE dni_admin = ? LIMIT 1
      `, [dni])

    return rows.length > 0
  }

  static async existeCorreoAdmin(correo) {
    const [rows] = await pool.query(`
      SELECT 1 FROM admin WHERE correo = ? LIMIT 1
      `, [correo])

    return rows.length > 0
  }

  // --- account creation ------------------------------------------------------
  // One INSERT per account: identity now lives in the role table, so no
  // multi-table transaction is needed.

  static async createClienteAccount({ dni, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero, id_obra_social, numero_afiliado }) {
    const [result] = await pool.query(`
      INSERT INTO cliente
        (dni_cliente, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero, id_obra_social, numero_afiliado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [dni, nombre, apellido, correo, password_hash, telefono ?? null, fecha_nacimiento, genero, id_obra_social ?? null, numero_afiliado ?? null])

    return result
  }

  static async createProfesionalAccount({ dni, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero }) {
    const [result] = await pool.query(`
      INSERT INTO profesional
        (dni_profesional, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [dni, nombre, apellido, correo, password_hash, telefono ?? null, fecha_nacimiento, genero])

    return result
  }

  // Provisioning/seeding only: no route exposes admin creation. A future
  // endpoint must sit behind requireAuth + grantAccess(['admin']).
  static async createAdminAccount({ dni, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero }) {
    const [result] = await pool.query(`
      INSERT INTO admin
        (dni_admin, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [dni, nombre, apellido, correo, password_hash, telefono ?? null, fecha_nacimiento, genero])

    return result
  }

}
