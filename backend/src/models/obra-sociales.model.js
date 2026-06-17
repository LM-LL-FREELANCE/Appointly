import { pool } from "../config/db.js";

export class obraSocialesModel {
    static async getAll() {
        const [obrasociales] = await pool.query(`
           SELECT id_obra_social AS "id", nombre_obra_social AS "obra_social" FROM  obra_social `)

        return obrasociales
    }
}