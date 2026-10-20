import { pool } from "../config/db.js"
import { aFechaISO } from "../utils/time.js"

// Avisos del centro (PLAN_ADMIN.md §6.3 / §8.2 C3–C7).

const SELECT_BASE = `
  SELECT id_aviso, titulo, mensaje, tipo, activo,
         vigente_desde, vigente_hasta, creado_por, creado_en, actualizado_en
    FROM aviso`

const normalizar = (row) => ({
  ...row,
  id: row.id_aviso,
  activo: Boolean(row.activo),
  vigente_desde: row.vigente_desde ? aFechaISO(row.vigente_desde) : null,
  vigente_hasta: row.vigente_hasta ? aFechaISO(row.vigente_hasta) : null,
})

export class AvisosModel {
  static async getActivos() {
    const [rows] = await pool.query(
      `${SELECT_BASE}
        WHERE activo = 1
          AND (vigente_desde IS NULL OR vigente_desde <= CURDATE())
          AND (vigente_hasta IS NULL OR vigente_hasta >= CURDATE())
        ORDER BY FIELD(tipo, 'critico', 'advertencia', 'info'), creado_en DESC`,
    )
    return rows.map(normalizar)
  }

  static async getAll() {
    const [rows] = await pool.query(`${SELECT_BASE} ORDER BY activo DESC, creado_en DESC`)
    return rows.map(normalizar)
  }

  static async getById(id) {
    const [rows] = await pool.query(`${SELECT_BASE} WHERE id_aviso = ? LIMIT 1`, [id])
    return rows[0] ? normalizar(rows[0]) : null
  }

  static async create(data, dniAdmin) {
    const [result] = await pool.query(
      `INSERT INTO aviso
         (titulo, mensaje, tipo, activo, vigente_desde, vigente_hasta, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.titulo,
        data.mensaje,
        data.tipo,
        data.activo ? 1 : 0,
        data.vigente_desde ?? null,
        data.vigente_hasta ?? null,
        dniAdmin ?? null,
      ],
    )
    return AvisosModel.getById(result.insertId)
  }

  static async update(id, data) {
    await pool.query(
      `UPDATE aviso
          SET titulo = ?, mensaje = ?, tipo = ?, activo = ?,
              vigente_desde = ?, vigente_hasta = ?
        WHERE id_aviso = ?`,
      [
        data.titulo,
        data.mensaje,
        data.tipo,
        data.activo ? 1 : 0,
        data.vigente_desde ?? null,
        data.vigente_hasta ?? null,
        id,
      ],
    )
    return AvisosModel.getById(id)
  }

  static async delete(id) {
    const [result] = await pool.query(`DELETE FROM aviso WHERE id_aviso = ?`, [id])
    return result.affectedRows
  }
}
