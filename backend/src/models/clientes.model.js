import { pool } from "../config/db.js"

export class ClientesModel {

  /*   static async getTurnosClienteByDni(dni, estado) {
      const [rows] = await pool.query(`
        SELECT
          profesional.apellido AS "p_apellido",
          profesional.nombre AS "p_nombre",
          profesional.dni_profesional,
          especialidad.tipo,
          turno.id_turno,
          turno.fecha_turno,
          turno.hora_turno,
          turno.estado
        FROM
          turno
          INNER JOIN cliente ON turno.dni_cliente = cliente.dni_cliente
          INNER JOIN profesional ON turno.dni_profesional = profesional.dni_profesional
          INNER JOIN profesional_especialidad ON profesional.dni_profesional = profesional_especialidad.dni_profesional
          INNER JOIN especialidad ON especialidad.id_especialidad = profesional_especialidad.id_especialidad
        WHERE cliente.dni_cliente = ? AND turno.estado = ?
        `, [dni, estado])
  
      return rows
    } */

  static async getTurnosClienteByDni(dni, estado) {
    let query = `
        SELECT
            profesional.apellido AS "apellido",
            profesional.nombre AS "nombre",
            profesional.dni_profesional AS "dni",
            profesional.genero AS genero,
            GROUP_CONCAT(DISTINCT especialidad.tipo ORDER BY especialidad.tipo SEPARATOR '|') AS especialidades,
            "" AS tipo,
            turno.id_turno,
            turno.fecha_turno,
            turno.hora_turno,
            turno.estado
          FROM turno
            INNER JOIN cliente ON turno.dni_cliente = cliente.dni_cliente
            INNER JOIN profesional ON turno.dni_profesional = profesional.dni_profesional
            LEFT JOIN profesional_especialidad pe ON profesional.dni_profesional = pe.dni_profesional
            LEFT JOIN especialidad especialidad ON pe.id_especialidad = especialidad.id_especialidad
          WHERE cliente.dni_cliente = ?
    `;
    const params = [dni];

    if (estado) {
      query += ` AND turno.estado = ?`;
      params.push(estado);
    }

    query += `
          GROUP BY
            turno.id_turno,
            profesional.dni_profesional,
            profesional.apellido,
            profesional.nombre,
            profesional.genero,
            turno.fecha_turno,
            turno.hora_turno,
            turno.estado
          ORDER BY
            turno.fecha_turno ASC,
            turno.hora_turno ASC;
      `;

    const [rows] = await pool.query(query, params)

    return rows
  }

  static async existe({ dni }) {
    const [rows] = await pool.query(`
      SELECT 1 FROM cliente WHERE dni_cliente = ? LIMIT 1
      `, [dni])

    return rows.length > 0
  }

  static async getClienteByDni({ dni }) {
    const [rows] = await pool.query(`
        SELECT c.dni_cliente, c.nombre, c.apellido, c.correo, c.fecha_nacimiento, c.genero, o.nombre_obra_social AS "obra_social" FROM 
        cliente c LEFT JOIN obra_social o ON c.id_obra_social = o.id_obra_social WHERE c.dni_cliente = ?
        `, [dni])

    return rows[0] ?? null
  }

  static async getTurnosMes({ dni, month, year }) {
    const [rows] = await pool.query(`
      SELECT * FROM turno WHERE dni_cliente = ? AND MONTH(fecha_turno) = ? AND YEAR(fecha_turno) = ? 
      ORDER BY fecha_turno ASC
      `, [dni, month, year])

    return rows
  }

  static async getActivos({ dni }) {
    const [rows] = await pool.query(`
      SELECT t.id_turno, t.fecha_turno, t.hora_turno, p.nombre, p.apellido 
      FROM turno t INNER JOIN profesional p ON t.dni_profesional = p.dni_profesional
      WHERE t.dni_cliente = ? AND t.estado = 'activo'
      ORDER BY t.fecha_turno ASC, t.hora_turno ASC
      `, [dni])
    return rows;
  }

  static async patchClienteData({ dni, data }) {
    let id_final_obra_social = undefined

    if (data.obra_social !== undefined) {

      if (data.obra_social === null || data.obra_social.trim() === "") {
        id_final_obra_social = null
      }
      else {
        const [obraSocialRows] = await pool.query(`SELECT id_obra_social FROM obra_social WHERE nombre_obra_social = ?`, data.obra_social)

        if (obraSocialRows.length > 0) {
          id_final_obra_social = obraSocialRows[0].id_obra_social
        }
        else {
          const [insertObraSocial] = await pool.query(`INSERT INTO obra_social (nombre_obra_social) VALUE(?)`, [data.obra_social])
          id_final_obra_social = insertObraSocial.insertId;
        }
      }
    }
    let query = `UPDATE cliente SET `
    let fieldsToUpdate = []
    let valueToUpdate = []

    if (data.nombre) {
      fieldsToUpdate.push("nombre = ?")
      valueToUpdate.push(data.nombre)
    }

    if (data.apellido !== undefined) {
      fieldsToUpdate.push("apellido = ?")
      valueToUpdate.push(data.apellido)
    }

    if (data.correo !== undefined) {
      fieldsToUpdate.push("correo = ?")
      valueToUpdate.push(data.correo)
    }

    if (data.fecha_nacimiento !== undefined) {
      fieldsToUpdate.push("fecha_nacimiento = ?")
      valueToUpdate.push(data.fecha_nacimiento)
    }

    if (data.genero !== undefined) {
      fieldsToUpdate.push("genero = ?")
      valueToUpdate.push(data.genero)
    }

    if (data.foto_url !== undefined) {
      fieldsToUpdate.push("foto_url = ?")
      valueToUpdate.push(data.foto_url)
    }
    if (id_final_obra_social !== undefined) {
      fieldsToUpdate.push("id_obra_social = ?")
      valueToUpdate.push(id_final_obra_social)
    }


    if (fieldsToUpdate.length > 0) {
      query += fieldsToUpdate.join(", ")
      query += ` WHERE dni_cliente = ?`
      valueToUpdate.push(dni)

      const [updateResult] = await pool.query(query, valueToUpdate)
      if (updateResult.affectedRows === 0) {
        return false;
      }

      return true;
    }
    return false
  }

  static async deleteAccount({ dni }) {
    await pool.query(`DELETE FROM turno WHERE dni_cliente = ?`, [dni]);

    const [accRows] = await pool.query(`DELETE FROM cliente WHERE dni_cliente = ?`, [dni]);

    if (accRows.affectedRows > 0) {
      return true;
    }

    return false;
  }
}