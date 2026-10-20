import { pool } from "../config/db.js"

/**
 * Persistencia de `mfa_codigo` (PLAN_ADMIN.md §6.6 y §10).
 * Solo se guarda el sha256 del código de 6 dígitos; el plano viaja por email.
 * Los métodos que participan de una secuencia (invalidar + insertar) aceptan
 * la conexión de `withTransaction` como segundo argumento.
 */
export class MfaModel {
  static async invalidarVigentes(dni, db = pool) {
    await db.query(`
      UPDATE mfa_codigo
        SET consumido_en = NOW()
        WHERE dni_persona = ?
          AND consumido_en IS NULL
      `, [dni])
  }

  // Un login nuevo descarta TODA la cadena previa del admin: así un challenge
  // viejo no puede resolver por error el código del login nuevo (y sus códigos
  // quedan invalidados, como pide el plan).
  static async borrarDeDni(dni, db = pool) {
    await db.query(`
      DELETE FROM mfa_codigo
        WHERE dni_persona = ?
      `, [dni])
  }

  static async insertar({ dni, codigoHash, expiraEn }, db = pool) {
    const [res] = await db.query(`
      INSERT INTO mfa_codigo (dni_persona, codigo_hash, expira_en)
      VALUES (?, ?, ?)
      `, [dni, codigoHash, expiraEn])

    return res.insertId
  }

  static async findById(idCodigo, db = pool) {
    const [rows] = await db.query(`
      SELECT id_codigo, dni_persona, codigo_hash, expira_en, intentos, consumido_en, creado_en
        FROM mfa_codigo
        WHERE id_codigo = ?
      `, [idCodigo])

    return rows[0] ?? null
  }

  // Código vigente del challenge: el reenvío invalida el anterior e inserta una
  // fila nueva con id mayor, así que el activo es la última fila no consumida
  // de la cadena (id >= ancla). Si no hay ninguna, el challenge ya se usó,
  // quedó bloqueado o fue descartado.
  static async findActivoDeCadena({ dni, idAncla }, db = pool) {
    const [rows] = await db.query(`
      SELECT id_codigo, dni_persona, codigo_hash, expira_en, intentos, consumido_en, creado_en
        FROM mfa_codigo
        WHERE dni_persona = ?
          AND id_codigo >= ?
          AND consumido_en IS NULL
        ORDER BY id_codigo DESC
        LIMIT 1
      `, [dni, idAncla])

    return rows[0] ?? null
  }

  // Último código emitido para el admin: base del cooldown de reenvío.
  static async ultimoDeDni(dni, db = pool) {
    const [rows] = await db.query(`
      SELECT id_codigo, creado_en
        FROM mfa_codigo
        WHERE dni_persona = ?
        ORDER BY id_codigo DESC
        LIMIT 1
      `, [dni])

    return rows[0] ?? null
  }

  // Reenvíos del challenge vigente: toda fila posterior al código original
  // pertenece a la misma cadena (el login invalidó las anteriores).
  static async contarPosterioresA({ dni, idCodigo }, db = pool) {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS total
        FROM mfa_codigo
        WHERE dni_persona = ?
          AND id_codigo > ?
      `, [dni, idCodigo])

    return rows[0].total
  }

  static async incrementarIntentos(idCodigo, db = pool) {
    await db.query(`
      UPDATE mfa_codigo
        SET intentos = intentos + 1
        WHERE id_codigo = ?
      `, [idCodigo])
  }

  static async consumir(idCodigo, db = pool) {
    await db.query(`
      UPDATE mfa_codigo
        SET consumido_en = NOW()
        WHERE id_codigo = ?
          AND consumido_en IS NULL
      `, [idCodigo])
  }
}
