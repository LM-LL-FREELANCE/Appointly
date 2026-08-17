import { pool } from "../config/db.js"

export class ProfesionalesModel {
  static async getHorariosByDni(dni) {

    const [rows] = await pool.query(`
        SELECT 
            id_horario, 
            horario_atencion.dia_semana, 
            horario_atencion.hora_inicio, 
            horario_atencion.hora_fin
          FROM horario_atencion
          INNER JOIN profesional
            ON horario_atencion.dni_profesional = profesional.dni_profesional
          WHERE profesional.dni_profesional = ?
        `, [dni])

    return rows
  }

  static async getHorarioById(id) {
    const [rows] = await pool.query(`
        SELECT * FROM horario_atencion WHERE id_horario = ?
        `, [id])
    return rows[0] ?? null
  }

  static async checkOverlap(dni, { dia_semana, hora_inicio, hora_fin }, excludeId = null) {
    const sql = `
        SELECT 
            COUNT(*) AS count
          FROM horario_atencion
          WHERE dni_profesional = ?
            AND dia_semana = ?
            AND hora_inicio < ?
            AND hora_fin > ?
        ${excludeId !== null ? 'AND id_horario != ?' : ''}
        `
    const params = excludeId !== null
      ? [dni, dia_semana, hora_fin, hora_inicio, excludeId]
      : [dni, dia_semana, hora_fin, hora_inicio]

    const [result] = await pool.query(sql, params)
    return result
  }

  static async createHorario(dni, { dia_semana, hora_inicio, hora_fin }) {
    const [result] = await pool.query(`
        INSERT INTO horario_atencion 
          (dni_profesional, dia_semana, hora_inicio, hora_fin)
        VALUES 
          (?, ?, ?, ?)
        `, [dni, dia_semana, hora_inicio, hora_fin])

    const [row] = await pool.query(`
        SELECT 
            *
          FROM horario_atencion
          WHERE id_horario = ?
        `, [result.insertId])

    return row[0]
  }

  static async updateHorario(id, { dia_semana, hora_inicio, hora_fin }) {
    await pool.query(`
        UPDATE horario_atencion
        SET dia_semana = ?, hora_inicio = ?, hora_fin = ?
        WHERE id_horario = ?
        `, [dia_semana, hora_inicio, hora_fin, id])

    const [row] = await pool.query(`
        SELECT 
            *
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
  static async filterBy({ especialidad, obraSocial }) {
    let query = `
    SELECT 
        p.dni_profesional, 
        persona_profesional.nombre, 
        persona_profesional.apellido, 
        pr.correo, 
        persona_profesional.foto_url, 
        persona_profesional.fecha_nacimiento, 
        GROUP_CONCAT(DISTINCT e.tipo ORDER BY e.tipo SEPARATOR '|') AS especialidades, 
        GROUP_CONCAT(DISTINCT ob.nombre_obra_social ORDER BY ob.nombre_obra_social SEPARATOR '|') AS obras_sociales 
      FROM profesional p 
      INNER JOIN persona AS persona_profesional 
        ON p.dni_profesional = persona_profesional.dni_persona
      INNER JOIN persona_rol pr 
        ON p.dni_profesional = pr.dni_persona AND p.id_rol = pr.id_rol
      LEFT JOIN profesional_especialidad pe 
        ON p.dni_profesional = pe.dni_profesional
      LEFT JOIN especialidad e 
        ON pe.id_especialidad = e.id_especialidad 
      LEFT JOIN obra_social_profesional obp 
        ON p.dni_profesional = obp.dni_profesional
      LEFT JOIN obra_social ob 
        ON obp.id_obra_social = ob.id_obra_social
`;
    const conditions = ['pr.eliminado_en IS NULL'];
    const values = [];
    if (especialidad) {
      conditions.push(`EXISTS (
    SELECT 1 FROM profesional_especialidad pe2 
    WHERE pe2.dni_profesional = p.dni_profesional AND pe2.id_especialidad = ?
  )`);
      values.push(especialidad);
    }
    if (obraSocial) {
      conditions.push(`EXISTS (
    SELECT 1 FROM obra_social_profesional obp2 
    WHERE obp2.dni_profesional = p.dni_profesional AND obp2.id_obra_social = ?
  )`);
      values.push(obraSocial);
    }
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` GROUP BY p.dni_profesional`;

    const [profesionales] = await pool.query(query, values);
    return profesionales.map(p => ({
      ...p,
      especialidades: p.especialidades ? p.especialidades.split('|') : [],
      obrasSociales: p.obras_sociales ? p.obras_sociales.split('|') : [],
    }));
  }

  static async getByDni({ dni }) {
    const [rows] = await pool.query(`
            SELECT 
                p.nombre, 
                p.apellido, 
                pr.correo, 
                p.foto_url, 
                p.fecha_nacimiento, 
                p.genero
              FROM profesional prof
              INNER JOIN persona p
                ON prof.dni_profesional = p.dni_persona
              INNER JOIN persona_rol pr
                ON prof.dni_profesional = pr.dni_persona AND prof.id_rol = pr.id_rol
              WHERE prof.dni_profesional = ? AND pr.eliminado_en IS NULL
            `, [dni])

    const profesional = rows[0]
    if (!profesional) return null


    const [especialidad] = await pool.query(`
            SELECT 
                e.tipo AS "especialidad" 
              FROM especialidad e 
              INNER JOIN profesional_especialidad pe
                ON e.id_especialidad = pe.id_especialidad WHERE pe.dni_profesional = ?
            `, [dni])

    const [obraSociales] = await pool.query(`
            SELECT 
                ob.nombre_obra_social AS "obra_sociales" 
              FROM obra_social ob 
              INNER JOIN obra_social_profesional osp 
                ON ob.id_obra_social = osp.id_obra_social WHERE osp.dni_profesional = ?
            `, [dni])

    return { ...profesional, especialidad, obraSociales }
  }

  static async existe({ dni }) {
    const [rows] = await pool.query(
      `SELECT 1 FROM profesional p 
       INNER JOIN persona_rol pr ON p.dni_profesional = pr.dni_persona AND p.id_rol = pr.id_rol
       WHERE p.dni_profesional = ? AND pr.eliminado_en IS NULL LIMIT 1`,
      [dni]
    );
    return rows.length > 0;
  }

  static async updateByDni({ dni, ...fields }) {
    const { especialidades, obras_sociales, correo, ...profesionalFields } = fields;
    const keys = Object.keys(profesionalFields).filter(key => profesionalFields[key] !== undefined);

    if (keys.length === 0 && especialidades === undefined && obras_sociales === undefined && correo === undefined) {
      return false;
    }

    if (keys.length > 0) {
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = keys.map(key => profesionalFields[key]);
      values.push(dni);

      await pool.query(`
            UPDATE persona
            SET ${setClause}
            WHERE dni_persona = ?
          `, values);
    }

    if (correo !== undefined) {
      await pool.query(`
        UPDATE persona_rol
        SET correo = ?
        WHERE dni_persona = ? AND id_rol = (SELECT id_rol FROM rol WHERE nombre = 'profesional')
        `, [correo, dni])
    }

    if (especialidades !== undefined) {
      await pool.query(`DELETE FROM profesional_especialidad WHERE dni_profesional = ?`, [dni]);

      if (especialidades.length > 0) {
        const namesValues = especialidades.map(nombre => [nombre]);
        await pool.query(
          `INSERT IGNORE INTO especialidad (tipo) VALUES ?`,
          [namesValues]
        );

        const [rowsEspecialidades] = await pool.query(
          `SELECT id_especialidad FROM especialidad WHERE tipo IN (?)`,
          [especialidades]
        );

        if (rowsEspecialidades.length > 0) {
          const relacionEspecialidades = rowsEspecialidades.map(row => [dni, row.id_especialidad]);
          await pool.query(
            `INSERT INTO profesional_especialidad (dni_profesional, id_especialidad) VALUES ?`,
            [relacionEspecialidades]
          );
        }
      }
    }

    if (obras_sociales !== undefined) {
      await pool.query(`DELETE FROM obra_social_profesional WHERE dni_profesional = ?`, [dni]);

      if (obras_sociales.length > 0) {
        const namesObras = obras_sociales.map(nombre => [nombre]);
        await pool.query(
          `INSERT IGNORE INTO obra_social (nombre_obra_social) VALUES ?`,
          [namesObras]
        );

        const [rowsObras] = await pool.query(
          `SELECT id_obra_social FROM obra_social WHERE nombre_obra_social IN (?)`,
          [obras_sociales]
        );

        if (rowsObras.length > 0) {
          const relacionObras = rowsObras.map(row => [dni, row.id_obra_social]);
          await pool.query(
            `INSERT INTO obra_social_profesional (dni_profesional, id_obra_social) VALUES ?`,
            [relacionObras]
          );
        }
      }
    }

    const [rows] = await pool.query(`
          SELECT
              persona_profesional.nombre AS "nombre",
              persona_profesional.apellido AS "apellido",
              persona_rol_profesional.correo AS "correo",
              persona_profesional.fecha_nacimiento AS "fecha_nacimiento",
              persona_profesional.genero AS "genero",
              persona_profesional.foto_url AS "foto",
              GROUP_CONCAT(DISTINCT e.tipo ORDER BY e.tipo SEPARATOR '|') AS especialidades,
              GROUP_CONCAT(DISTINCT o.nombre_obra_social ORDER BY o.nombre_obra_social SEPARATOR '|') AS obras_sociales
            FROM profesional p
              INNER JOIN persona AS persona_profesional
                ON p.dni_profesional = persona_profesional.dni_persona
              INNER JOIN persona_rol AS persona_rol_profesional
                ON p.dni_profesional = persona_rol_profesional.dni_persona AND p.id_rol = persona_rol_profesional.id_rol
              LEFT JOIN profesional_especialidad pe 
                ON p.dni_profesional = pe.dni_profesional
              LEFT JOIN especialidad e 
                ON pe.id_especialidad = e.id_especialidad
              LEFT JOIN obra_social_profesional op 
                ON p.dni_profesional = op.dni_profesional
              LEFT JOIN obra_social o 
                ON op.id_obra_social = o.id_obra_social
            WHERE p.dni_profesional = ?
            GROUP BY p.dni_profesional
        `, [dni]);

    return rows[0];
  }

  static async deleteAcc({ dni }) {
    const [rows] = await pool.query(`
      UPDATE persona_rol
      SET eliminado_en = NOW()
      WHERE dni_persona = ? 
      AND id_rol = 2
      `, [dni])

    return rows.affectedRows > 0
  }

}