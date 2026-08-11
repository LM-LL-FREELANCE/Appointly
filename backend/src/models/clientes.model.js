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
  //DONE
  static async getTurnosClienteByDni({ dni, estado }) {
    let query = `
        SELECT
            persona_profesional.apellido AS "apellido",
            persona_profesional.nombre AS "nombre",
            persona_profesional.dni_persona AS "dni",
            persona_profesional.genero AS genero,
            GROUP_CONCAT(DISTINCT especialidad.tipo ORDER BY especialidad.tipo SEPARATOR '|') AS especialidades,
            "" AS tipo,
            turno.id_turno,
            turno.fecha_turno,
            turno.hora_turno,
            turno.estado
          FROM turno
            INNER JOIN cliente ON turno.dni_cliente = cliente.dni_cliente
            INNER JOIN profesional p ON turno.dni_profesional = p.dni_profesional
            INNER JOIN persona AS persona_profesional ON p.dni_profesional = persona_profesional.dni_persona
            LEFT JOIN profesional_especialidad pe ON p.dni_profesional = pe.dni_profesional
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
            persona_profesional.dni_persona,
            persona_profesional.apellido,
            persona_profesional.nombre,
            persona_profesional.genero,
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
  //DONE
  static async getClienteByDni({ dni }) {
    const [rows] = await pool.query(`
        SELECT 
            persona_cliente.dni_persona AS "dni", 
            persona_cliente.nombre, 
            persona_cliente.apellido, 
            persona_cliente.correo, 
            persona_cliente.fecha_nacimiento, 
            persona_cliente.genero, 
            o.nombre_obra_social AS "obra_social" 
          FROM cliente c 
            INNER JOIN persona AS persona_cliente ON c.dni_cliente = persona_cliente.dni_persona
            LEFT JOIN obra_social o ON c.id_obra_social = o.id_obra_social 
            WHERE c.dni_cliente = ?
        `, [dni])

    return rows[0] ?? null
  }

  static async getTurnosMes({ dni, month, year }) {
    const [rows] = await pool.query(`
      SELECT 
        * 
      FROM turno 
        WHERE dni_cliente = ? AND MONTH(fecha_turno) = ? AND YEAR(fecha_turno) = ? 
        ORDER BY fecha_turno ASC
      `, [dni, month, year])

    return rows
  }
  //DONE
  static async getActivos({ dni }) {
    const [rows] = await pool.query(`
      SELECT 
        t.id_turno, 
        t.fecha_turno, 
        t.hora_turno, 
        persona_profesional.nombre, 
        persona_profesional.apellido 
      FROM turno t 
        INNER JOIN persona AS persona_profesional ON t.dni_profesional = persona_profesional.dni_persona
        WHERE t.dni_cliente = ? AND t.estado = 'activo'
        ORDER BY t.fecha_turno ASC, t.hora_turno ASC
      `, [dni])
    return rows;
  }

  static async patchClienteData({ dni, ...data }) {
    const { obra_social, ...personaFields } = data;
    const personaKeys = Object.keys(personaFields).filter(key => personaFields[key] !== undefined);

    if (personaKeys.length === 0 && obra_social === undefined) {
      return false;
    }

    if (personaKeys.length > 0) {
      const setClause = personaKeys.map(key => `${key} = ?`).join(', ');
      const values = personaKeys.map(key => personaFields[key]);
      values.push(dni);

      await pool.query(`
        UPDATE persona
        SET ${setClause}
        WHERE dni_persona = ?
      `, values);
    }

    if (obra_social !== undefined) {
      if (obra_social === null || obra_social.trim() === "") {
        await pool.query(`UPDATE cliente SET id_obra_social = NULL WHERE dni_cliente = ?`, [dni]);
      } else {
        await pool.query(
          `INSERT IGNORE INTO obra_social (nombre_obra_social) VALUES (?)`,
          [obra_social]
        );

        const [rowsObra] = await pool.query(
          `SELECT id_obra_social FROM obra_social WHERE nombre_obra_social = ?`,
          [obra_social]
        );

        if (rowsObra.length > 0) {
          await pool.query(
            `UPDATE cliente SET id_obra_social = ? WHERE dni_cliente = ?`,
            [rowsObra[0].id_obra_social, dni]
          );
        }
      }
    }

    const [rows] = await pool.query(`
        SELECT 
            persona_cliente.dni_persona AS "dni", 
            persona_cliente.nombre, 
            persona_cliente.apellido, 
            persona_cliente.correo, 
            persona_cliente.fecha_nacimiento, 
            persona_cliente.genero, 
            o.nombre_obra_social AS "obra_social" 
          FROM cliente c 
            INNER JOIN persona AS persona_cliente ON c.dni_cliente = persona_cliente.dni_persona
            LEFT JOIN obra_social o ON c.id_obra_social = o.id_obra_social 
            WHERE c.dni_cliente = ?
        `, [dni]);

    return rows[0];
  }

  static async deleteAccount({ dni }) {
    await pool.query(`UPDATE turno SET estado = 'cancelado', motivo_cancelacion = 'Cuenta eliminada' WHERE dni_cliente = ? AND estado = 'activo'`, [dni]);

    const [accRows] = await pool.query(`UPDATE persona SET eliminado_en = CURRENT_TIMESTAMP WHERE dni_persona = ?`, [dni]);

    if (accRows.affectedRows > 0) {
      return true;
    }

    return false;
  }
}