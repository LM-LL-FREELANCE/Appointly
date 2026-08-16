import { pool } from "../config/db.js";

export class ObraSocialesModel {
  static async getAll() {
    const [obrasociales] = await pool.query(`
      SELECT id_obra_social AS "id", nombre_obra_social AS "obra_social" FROM  obra_social `)
    return obrasociales
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
