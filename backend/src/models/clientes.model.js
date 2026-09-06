import { pool } from "../config/db.js"

export class ClientesModel {

  static async getTurnosClienteByDni(dni, estado) {
    let query = `
        SELECT
            persona.apellido AS apellido,
            persona.nombre AS nombre,
            profesional.dni_profesional AS dni,
            persona.genero AS genero,
            GROUP_CONCAT(DISTINCT especialidad.tipo ORDER BY especialidad.tipo SEPARATOR '|') AS especialidades,
            "" AS tipo,
            turno.id_turno,
            turno.fecha_turno,
            turno.hora_turno,
            turno.estado
          FROM turno
            INNER JOIN cliente ON turno.dni_cliente = cliente.dni_cliente
            INNER JOIN profesional ON turno.dni_profesional = profesional.dni_profesional
            INNER JOIN persona ON persona.dni_persona = profesional.dni_profesional
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
            persona.apellido,
            persona.nombre,
            persona.genero,
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
      SELECT * FROM persona p
      INNER JOIN persona_rol pr ON pr.dni_persona = p.dni_persona
      INNER JOIN rol r ON r.id_rol = pr.id_rol
      WHERE pr.id_rol = 1 AND p.dni_persona = ?
      `, [dni])

    return rows.length > 0
  }

  static async getClienteByDni({ dni }) {
    const [rows] = await pool.query(`
        SELECT c.dni_cliente, p.nombre, p.apellido, pr.correo, p.foto_url, p.fecha_nacimiento, p.genero, o.nombre_obra_social AS "obra_social" 
        FROM cliente c
        INNER JOIN persona p ON p.dni_persona = c.dni_cliente
        INNER JOIN persona_rol pr ON pr.dni_persona = c.dni_cliente AND pr.id_rol = c.id_rol
        LEFT JOIN obra_social o ON c.id_obra_social = o.id_obra_social
        WHERE c.dni_cliente = ?
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
      FROM turno t
      INNER JOIN profesional prof ON t.dni_profesional = prof.dni_profesional
      INNER JOIN persona p ON p.dni_persona = prof.dni_profesional
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

    const personaFields = []
    const personaValues = []

    if (data.nombre !== undefined) {
      personaFields.push("nombre = ?")
      personaValues.push(data.nombre)
    }

    if (data.apellido !== undefined) {
      personaFields.push("apellido = ?")
      personaValues.push(data.apellido)
    }

    if (data.fecha_nacimiento !== undefined) {
      personaFields.push("fecha_nacimiento = ?")
      personaValues.push(data.fecha_nacimiento)
    }

    if (data.genero !== undefined) {
      personaFields.push("genero = ?")
      personaValues.push(data.genero)
    }

    let affected = false

    if (personaFields.length > 0) {
      const [result] = await pool.query(
        `UPDATE persona SET ${personaFields.join(", ")} WHERE dni_persona = ?`,
        [...personaValues, dni]
      )
      if (result.affectedRows > 0) affected = true
    }

    if (data.correo !== undefined) {
      const [result] = await pool.query(
        `UPDATE persona_rol SET correo = ? WHERE dni_persona = ? AND id_rol = 1`,
        [data.correo, dni]
      )
      if (result.affectedRows > 0) affected = true
    }

    if (id_final_obra_social !== undefined) {
      const [result] = await pool.query(
        `UPDATE cliente SET id_obra_social = ? WHERE dni_cliente = ?`,
        [id_final_obra_social, dni]
      )
      if (result.affectedRows > 0) affected = true
    }

    return affected
  }


  static async deleteAccount({ dni }) {
    const [accRows] = await pool.query(
      `UPDATE persona_rol 
      SET eliminado_en = NOW() 
      WHERE dni_persona = ? AND id_rol = 1 
      AND eliminado_en IS NULL`,
      [dni]
    );

    if (accRows.affectedRows > 0) {
      return true;
    }

    return false;
  }
}
