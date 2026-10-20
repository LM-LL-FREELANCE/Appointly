import { pool } from "../config/db.js";

const SELECT_BASE = `
  SELECT o.id_obra_social AS "id", o.nombre_obra_social AS "obra_social", o.activo,
    (SELECT COUNT(*) FROM obra_social_profesional op WHERE op.id_obra_social = o.id_obra_social) AS profesionales
  FROM obra_social o`

export class ObraSocialesModel {
  static async getAll() {
    const [obrasociales] = await pool.query(`${SELECT_BASE} ORDER BY o.nombre_obra_social`)
    return obrasociales
  }

  static async getById(id) {
    const [rows] = await pool.query(`${SELECT_BASE} WHERE o.id_obra_social = ? LIMIT 1`, [id])
    return rows[0] ?? null
  }

  static async existeNombre(nombre, excludeId = null) {
    const sql = `SELECT 1 FROM obra_social WHERE nombre_obra_social = ? ${excludeId !== null ? "AND id_obra_social != ?" : ""} LIMIT 1`
    const params = excludeId !== null ? [nombre, excludeId] : [nombre]
    const [rows] = await pool.query(sql, params)
    return rows.length > 0
  }

  static async create({ nombre_obra_social }) {
    const [result] = await pool.query(`INSERT INTO obra_social (nombre_obra_social) VALUES (?)`, [nombre_obra_social])
    return ObraSocialesModel.getById(result.insertId)
  }

  static async update(id, { nombre_obra_social }) {
    await pool.query(`UPDATE obra_social SET nombre_obra_social = ? WHERE id_obra_social = ?`, [nombre_obra_social, id])
    return ObraSocialesModel.getById(id)
  }

  static async updateEstado(id, activo) {
    await pool.query(`UPDATE obra_social SET activo = ? WHERE id_obra_social = ?`, [activo ? 1 : 0, id])
    return ObraSocialesModel.getById(id)
  }

  // Profesionales asociados (PLAN §8.7 E10, espejo de E5).
  static async getProfesionales(id) {
    const [rows] = await pool.query(`
      SELECT p.dni_profesional AS dni, per.nombre, per.apellido, per.foto_url, p.numero_matricula
        FROM obra_social_profesional op
        INNER JOIN profesional p ON p.dni_profesional = op.dni_profesional
        INNER JOIN persona per ON per.dni_persona = p.dni_profesional
        INNER JOIN persona_rol pr ON pr.dni_persona = p.dni_profesional AND pr.id_rol = p.id_rol
        WHERE op.id_obra_social = ? AND pr.eliminado_en IS NULL
        ORDER BY per.apellido, per.nombre`, [id])
    return rows
  }

  static async existe({ id_obra_social }) {
    const [rows] = await pool.query(`
      SELECT 1 FROM obra_social WHERE id_obra_social = ? LIMIT 1
      `, [id_obra_social])
    return rows.length > 0
  }

  static async getObraSocialById({ id_obra_social }) {
    const [rows] = await pool.query(`
      SELECT id_obra_social AS "id", nombre_obra_social AS "obra_social" FROM obra_social WHERE id_obra_social = ? LIMIT 1
      `, [id_obra_social])
    return rows[0] ?? null
  }
}
