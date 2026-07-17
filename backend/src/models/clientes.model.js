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

  static async getTurnosClienteByDni(dni) {
    /* const [rows] = await pool.query(`
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
      WHERE cliente.dni_cliente = ?
      `, [dni]) */

    const [rows] = await pool.query(`
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
      `, [dni])

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
        SELECT c.dni_cliente, c.nombre, c.apellido, o.nombre_obra_social AS "obra_social" FROM 
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
}