import { pool } from "../config/db.js"

export class StorageModel {

  static async uploadAvatar(id, role, url) {

    const [rows] = await pool.query(`
      UPDATE ${role}
      SET foto_url = ?
      WHERE dni_${role} = ?
    `, [url, id])

    return rows[0]
  }
}
