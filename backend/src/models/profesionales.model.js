import { pool } from "../config/db.js"

export class ProfesionalesModel {
    static async getHorariosByDni(dni) {

      const [rows] = await pool.query(`
        SELECT id_horario, horario_atencion.dia_semana, horario_atencion.hora_inicio, horario_atencion.hora_fin
        FROM horario_atencion
        INNER JOIN profesional
        ON horario_atencion.dni_profesional = profesional.dni_profesional
        WHERE profesional.dni_profesional = ?
        `, [dni])
      
      return rows
    }

    static async checkOverlap(dni, {dia_semana, hora_inicio, hora_fin}) {
      const [result] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM horario_atencion
        WHERE dni_profesional = ?
        AND dia_semana = ?
        AND hora_inicio < ?
        AND hora_fin > ?
        `, [dni, dia_semana, hora_fin, hora_inicio])

      return result
    }

    static async createHorario(dni, {dia_semana, hora_inicio, hora_fin}) {
      const [result] = await pool.query(`
        INSERT INTO horario_atencion (dni_profesional, dia_semana, hora_inicio, hora_fin)
        VALUES (?, ?, ?, ?)
        `, [dni, dia_semana, hora_inicio, hora_fin])

      const [row] = await pool.query(`
        SELECT *
        FROM horario_atencion
        WHERE id_horario = ?
        `, [result.insertId])

      return row[0]
    }

    static async updateHorario(id, {dia_semana, hora_inicio, hora_fin}) {
      await pool.query(`
        UPDATE horario_atencion
        SET dia_semana = ?, hora_inicio = ?, hora_fin = ?
        WHERE id_horario = ?
        `, [dia_semana, hora_inicio, hora_fin, id])

      const [row] = await pool.query(`
        SELECT *
        FROM horario_atencion
        WHERE id_horario = ?
        `, [id])

      return row[0]
    }

    static async deleteHorario(id) {
      const [result] = await pool.query(`
        DELETE FROM horario_atencion
        WHERE id_horario = ?
        `, [id])

      return result.affectedRows
    }
}