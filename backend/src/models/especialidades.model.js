import { pool } from "../config/db.js";

const SELECT_BASE = `
  SELECT e.id_especialidad AS id, e.tipo AS especialidad, e.activo,
    (SELECT COUNT(*) FROM profesional_especialidad pe WHERE pe.id_especialidad = e.id_especialidad) AS profesionales
  FROM especialidad e`

export class EspecialidadesModel {
  static async getAll() {
    const [especialidades] = await pool.query(`${SELECT_BASE} ORDER BY e.tipo`)
    return especialidades
  }

  static async getById(id) {
    const [rows] = await pool.query(`${SELECT_BASE} WHERE e.id_especialidad = ? LIMIT 1`, [id])
    return rows[0] ?? null
  }

  static async existeNombre(tipo, excludeId = null) {
    const sql = `SELECT 1 FROM especialidad WHERE tipo = ? ${excludeId !== null ? "AND id_especialidad != ?" : ""} LIMIT 1`
    const params = excludeId !== null ? [tipo, excludeId] : [tipo]
    const [rows] = await pool.query(sql, params)
    return rows.length > 0
  }

  static async create({ tipo }) {
    const [result] = await pool.query(`INSERT INTO especialidad (tipo) VALUES (?)`, [tipo])
    return EspecialidadesModel.getById(result.insertId)
  }

  static async update(id, { tipo }) {
    await pool.query(`UPDATE especialidad SET tipo = ? WHERE id_especialidad = ?`, [tipo, id])
    return EspecialidadesModel.getById(id)
  }

  static async updateEstado(id, activo) {
    await pool.query(`UPDATE especialidad SET activo = ? WHERE id_especialidad = ?`, [activo ? 1 : 0, id])
    return EspecialidadesModel.getById(id)
  }

  // Profesionales asociados (PLAN §8.7 E5). Se excluyen cuentas dadas de baja,
  // igual que el resto de los listados públicos de profesionales.
  static async getProfesionales(id) {
    const [rows] = await pool.query(`
      SELECT p.dni_profesional AS dni, per.nombre, per.apellido, per.foto_url, p.numero_matricula
        FROM profesional_especialidad pe
        INNER JOIN profesional p ON p.dni_profesional = pe.dni_profesional
        INNER JOIN persona per ON per.dni_persona = p.dni_profesional
        INNER JOIN persona_rol pr ON pr.dni_persona = p.dni_profesional AND pr.id_rol = p.id_rol
        WHERE pe.id_especialidad = ? AND pr.eliminado_en IS NULL
        ORDER BY per.apellido, per.nombre`, [id])
    return rows
  }
}
