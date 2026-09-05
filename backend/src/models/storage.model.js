import { pool } from "../config/db.js"

export class StorageModel {
  static async getPersona(id) {
    const [rows] = await pool.query(
      `SELECT dni_persona, foto_url FROM persona WHERE dni_persona = ?`,
      [id]
    )
    return rows[0] ?? null
  }

  static async updateAvatar(id, url) {
    const [result] = await pool.query(
      `UPDATE persona SET foto_url = ? WHERE dni_persona = ?`,
      [url, id]
    )
    return result.affectedRows > 0
  }

  static async clearAvatar(id) {
    const [result] = await pool.query(
      `UPDATE persona SET foto_url = NULL WHERE dni_persona = ?`,
      [id]
    )
    return result.affectedRows > 0
  }
}
