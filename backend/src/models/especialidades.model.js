import { pool } from "../config/db.js";

export class EspecialidadesModel {
    static async getAll() {
        const [especialidades] = await pool.query(`
            SELECT id_especialidad AS "id", tipo AS "Especialidad" FROM especialidad`)


        return especialidades
    }
}