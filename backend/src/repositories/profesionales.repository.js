import { pool } from "../config/db.js"

export async function getTurnosByDni(dni) {
  const [rows] = await pool.query(`
    SELECT horario_atencion.dia_semana, horario_atencion.hora_inicio, horario_atencion.hora_fin
    FROM horario_atencion
    INNER JOIN profesional
    ON horario_atencion.dni_profesional = profesional.dni_profesional
    WHERE profesional.dni_profesional = ?
    `, [dni])

  return rows
}