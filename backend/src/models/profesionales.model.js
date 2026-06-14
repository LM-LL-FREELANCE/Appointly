import { pool } from "../config/db.js"

export class ProfesionalesModel {
    static async filterBy({ especialidad, obraSocial }) {
        let query = `SELECT p.dni_profesional, p.nombre, p.apellido FROM profesional p `
        const conditions = []
        const values = []
        if (especialidad) {
            query += `INNER JOIN profesional_especialidad pe ON p.dni_profesional = pe.dni_profesional
            INNER JOIN especialidad e ON pe.id_especialidad = e.id_especialidad `
            conditions.push(`e.id_especialidad = ? `)
            values.push(especialidad)
        }
        if (obraSocial) {
            query += `INNER JOIN obra_social_profesional obp ON p.dni_profesional = obp.dni_profesional
            INNER JOIN obra_social ob ON obp.id_obra_social = ob.id_obra_social `
            conditions.push(`ob.nombre_obra_social = ? `)
            values.push(obraSocial)
        }

        if (conditions.length) {
            query += ` WHERE ` + conditions.join(' AND ')
        }
        const [profesionales] = await pool.query(query, values)
        return profesionales
    }

    static async getByDni({ dni }) {
        const [rows] = await pool.query(`
            SELECT nombre, apellido, correo, foto_url, fecha_nacimiento FROM profesional WHERE dni_profesional = ?
            `, [dni])

        const profesional = rows[0]
        if (!profesional) return null


        const [especialidad] = await pool.query(`
            SELECT e.tipo AS "Especialidad" FROM especialidad e INNNER JOIN profesional_especialidad pe
                ON e.id_especialidad = pe.id_especialidad WHERE pe.dni_profesional = ?
            `, [dni])

        const [obraSociales] = await pool.query(`
            SELECT ob.nombre_obra_social AS "Obra Sociales" FROM obra_social ob INNER JOIN 
            obra_social_profesional osp ON ob.id_obra_social = osp.id_obra_social WHERE osp.dni_profesional = ?
            `, [dni])

        return { ...profesional, especialidad, obraSociales }
    }
}