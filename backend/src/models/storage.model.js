import { pool } from "../config/db.js"

export class StorageModel {

  static async getPhotoURL(id) {
    const [rows] = await pool.query(`
      SELECT foto_url FROM persona
      WHERE dni_persona = ?
  `, [id])

    return rows[0].foto_url
  }

  static async uploadAvatar(id, url) {

    const [rows] = await pool.query(`
      UPDATE persona
      SET foto_url = ?
      WHERE dni_persona = ?
    `, [url, id])

    console.log(rows[0])
    return rows[0]
  }
}
