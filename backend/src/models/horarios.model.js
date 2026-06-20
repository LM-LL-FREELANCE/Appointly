import { pool } from "../config/db.js";
export class HorariosModel {
  static async getHorariosByProfesional({ dni }) {
    const [horarios] = await pool.query(`
      SELECT dia_semana,hora_inicio, hora_fin FROM horario_atencion WHERE dni_profesional = ?
      
      `, [dni])
    return horarios
  }
}