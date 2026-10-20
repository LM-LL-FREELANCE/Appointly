import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { createHash, randomInt } from "node:crypto"
import { AuthModel } from "../models/auth.model.js"
import { MfaModel } from "../models/mfa.model.js"
import { AppError } from "../utils/AppError.js"
import { isKnownRole } from "../utils/userPermission.js"
import { withTransaction } from "../config/db.js"
import { EmailMethods } from "../emails/email.methods.js"
import {
  emitMfaBloqueado,
  emitMfaCodigoEnviado,
  emitMfaIntentoFallido,
  emitMfaVerificado,
} from "../socket/events.js"
import {
  MFA_TTL_MIN,
  MFA_MAX_INTENTOS,
  MFA_RESEND_COOLDOWN_SEG,
  MFA_MAX_RESENDS,
  SALT_ROUNDS,
} from "../config/constants.js"

// El claim `purpose` marca tokens pre-sesión: el challenge del MFA no vale
// como access_token (auth.middleware y el handshake lo rechazan).
const MFA_PURPOSE = "mfa"

const hashCodigo = (codigo) => createHash("sha256").update(String(codigo)).digest("hex")

const generarCodigo = () => randomInt(0, 1_000_000).toString().padStart(6, "0")

export class AuthService {
  static async login(dni, password, role) {
    const userFound = await AuthModel.findCredentialsByDniAndRole(dni, role)

    // La comparacion corre aunque la cuenta este eliminada: el mismo tiempo de
    // respuesta no delata si el DNI existe, y el error queda generico.
    const isMatch = userFound && await bcrypt.compare(password, userFound.password_hash)

    if (!isMatch) throw new AppError("Credenciales inválidas", 401, "INVALID_CREDENTIALS")

    // Baja logica: se trata como credenciales invalidas (no se filtra que
    // existe una cuenta dada de baja).
    if (userFound.eliminada) throw new AppError("Credenciales inválidas", 401, "INVALID_CREDENTIALS")

    // Suspension reversible: la contrasena ya valido, recien aca se informa.
    if (userFound.suspendida) {
      throw new AppError("Tu cuenta está suspendida. Contactá a la administración del centro.", 403, "ACCOUNT_SUSPENDED")
    }

    if (typeof userFound.role !== "string" || userFound.role.length === 0) {
      throw new AppError("No se pudo determinar el rol de la cuenta.", 500, "ROLE_RESOLUTION_FAILED")
    }

    // Admin: segundo factor. No se emite sesion ni cookie todavia (PLAN §10.1).
    if (userFound.role === "admin") return AuthService.#crearChallengeMfa(userFound)

    return AuthService.emitirSesion(userFound)
  }

  // Emision de credenciales de sesion, compartida entre el login comun y la
  // verificacion del MFA: mismo JWT, mismo objeto `user`, misma cookie (§10.3).
  static emitirSesion(userFound) {
    const token = jwt.sign(
      { sub: userFound.dni, role: userFound.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    const user = {
      dni: userFound.dni,
      role: userFound.role,
      nombre: userFound.nombre,
      apellido: userFound.apellido,
      correo: userFound.correo,
      foto_url: userFound.foto_url,
      es_admin: userFound.role === "admin",
    }

    return { token, user }
  }

  /**
   * Verifica el challenge y el codigo de 6 digitos, y recien ahi emite la
   * sesion (PLAN §10.3). Los eventos de socket reflejan el estado del desafio
   * en la pantalla de login; la validacion SIEMPRE pasa por aca (HTTP).
   */
  static async verificarMfa({ challenge, codigo }) {
    const payload = AuthService.#verificarChallenge(challenge)
    const idSala = payload.code_id

    const ancla = await MfaModel.findById(idSala)

    if (!ancla || String(ancla.dni_persona) !== String(payload.sub)) {
      throw new AppError("El desafío expiró o ya no es válido. Volvé a iniciar sesión.", 401, "MFA_CHALLENGE_INVALID")
    }

    // El reenvío deja como vigente la última fila no consumida de la cadena;
    // sin fila vigente el desafío ya se usó, quedó bloqueado o fue descartado.
    const fila = await MfaModel.findActivoDeCadena({ dni: ancla.dni_persona, idAncla: ancla.id_codigo })

    if (!fila) {
      throw new AppError("El código ya fue usado o el acceso quedó bloqueado. Volvé a iniciar sesión.", 401, "MFA_CHALLENGE_INVALID")
    }

    if (fila.expira_en.getTime() <= Date.now()) {
      throw new AppError("El código expiró. Volvé a iniciar sesión para pedir uno nuevo.", 401, "MFA_EXPIRED")
    }

    if (fila.intentos >= MFA_MAX_INTENTOS) {
      await MfaModel.consumir(fila.id_codigo)
      emitMfaBloqueado(idSala)
      throw new AppError("Demasiados intentos fallidos. Volvé a iniciar sesión.", 429, "MFA_TOO_MANY_ATTEMPTS")
    }

    if (hashCodigo(codigo) !== fila.codigo_hash) {
      await MfaModel.incrementarIntentos(fila.id_codigo)
      const restantes = MFA_MAX_INTENTOS - (fila.intentos + 1)

      if (restantes > 0) {
        emitMfaIntentoFallido(idSala, restantes)
        throw new AppError("Código incorrecto.", 401, "MFA_INVALID_CODE")
      }

      // Se agoto el margen: el codigo queda invalidado (bloqueado).
      await MfaModel.consumir(fila.id_codigo)
      emitMfaIntentoFallido(idSala, 0)
      emitMfaBloqueado(idSala)
      throw new AppError("Demasiados intentos fallidos. Volvé a iniciar sesión.", 429, "MFA_TOO_MANY_ATTEMPTS")
    }

    await MfaModel.consumir(fila.id_codigo)

    // La cuenta pudo suspenderse o darse de baja entre el login y la
    // verificacion: se revalida antes de emitir la sesion.
    const userFound = await AuthModel.findCredentialsByDniAndRole(payload.sub, "admin")

    if (!userFound || userFound.eliminada) {
      throw new AppError("Credenciales inválidas", 401, "INVALID_CREDENTIALS")
    }

    if (userFound.suspendida) {
      throw new AppError("Tu cuenta está suspendida. Contactá a la administración del centro.", 403, "ACCOUNT_SUSPENDED")
    }

    emitMfaVerificado(idSala)

    return AuthService.emitirSesion(userFound)
  }

  /**
   * Reenvio del codigo (PLAN §10.4): cooldown de 60 s sobre el ultimo codigo
   * emitido, maximo MFA_MAX_RESENDS por challenge; el codigo anterior queda
   * invalidado al emitir el nuevo.
   */
  static async reenviarMfa({ challenge }) {
    const payload = AuthService.#verificarChallenge(challenge)
    const idSala = payload.code_id

    const ancla = await MfaModel.findById(idSala)

    if (!ancla || String(ancla.dni_persona) !== String(payload.sub)) {
      throw new AppError("El desafío expiró o ya no es válido. Volvé a iniciar sesión.", 401, "MFA_CHALLENGE_INVALID")
    }

    const vigente = await MfaModel.findActivoDeCadena({ dni: ancla.dni_persona, idAncla: ancla.id_codigo })

    if (!vigente) {
      throw new AppError("El desafío expiró o ya no es válido. Volvé a iniciar sesión.", 401, "MFA_CHALLENGE_INVALID")
    }

    const userFound = await AuthModel.findCredentialsByDniAndRole(payload.sub, "admin")

    if (!userFound || userFound.eliminada) {
      throw new AppError("Credenciales inválidas", 401, "INVALID_CREDENTIALS")
    }

    if (userFound.suspendida) {
      throw new AppError("Tu cuenta está suspendida. Contactá a la administración del centro.", 403, "ACCOUNT_SUSPENDED")
    }

    const ultimo = await MfaModel.ultimoDeDni(ancla.dni_persona)
    const segundosDesdeUltimo = (Date.now() - ultimo.creado_en.getTime()) / 1000

    if (segundosDesdeUltimo < MFA_RESEND_COOLDOWN_SEG) {
      throw new AppError("Esperá un minuto antes de pedir otro código.", 429, "MFA_RESEND_TOO_SOON")
    }

    const reenvios = await MfaModel.contarPosterioresA({ dni: ancla.dni_persona, idCodigo: ancla.id_codigo })

    if (reenvios >= MFA_MAX_RESENDS) {
      throw new AppError("Alcanzaste el máximo de reenvíos para este acceso. Volvé a iniciar sesión.", 429, "MFA_RESEND_TOO_SOON")
    }

    const codigo = generarCodigo()
    const expiraEn = new Date(Date.now() + MFA_TTL_MIN * 60_000)

    await withTransaction(async (db) => {
      await MfaModel.invalidarVigentes(ancla.dni_persona, db)
      await MfaModel.insertar({ dni: ancla.dni_persona, codigoHash: hashCodigo(codigo), expiraEn }, db)
    })

    await AuthService.#enviarCodigoMfa({ correo: userFound.correo, codigo, dni: ancla.dni_persona })

    emitMfaCodigoEnviado(idSala)

    return { msg: "Te enviamos un código nuevo a tu correo." }
  }

  static async getSession(dni, role) {
    if (!isKnownRole(role)) return null

    const userFound = await AuthModel.findCredentialsByDniAndRole(dni, role)
    if (!userFound) return null

    // Cuenta dada de baja o suspendida: no hay sesion valida.
    if (userFound.eliminada || userFound.suspendida) return null

    return {
      dni: userFound.dni,
      role: userFound.role,
      nombre: userFound.nombre,
      apellido: userFound.apellido,
      correo: userFound.correo,
      foto_url: userFound.foto_url,
      es_admin: userFound.role === "admin",
    }
  }

  static async forgotPassword({ correo, role }) {
    const userFound = await AuthModel.getDniByCorreo({ correo, role })

    if (!userFound) throw new AppError("Correo no encontrado", 404, "INVALID_CORREO")

    const token = jwt.sign({ dni: userFound.dni_persona, role: role }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    })

    return token
  }

  static async resetPassWord({ password, token }) {
    try {
      const verifiedToken = jwt.verify(token, process.env.JWT_SECRET)

      const { dni, role } = verifiedToken

      const password_hashed = await bcrypt.hash(password, SALT_ROUNDS)

      const updated = await AuthModel.resetPassWord({ dni, role, password_hashed })

      if (!updated) throw new AppError("We could not update your password", 400)

      return true
    } catch (err) {
      if (err instanceof AppError) throw err

      throw new AppError("The link is no longer active or is not valid", 401, "INVALID_TOKEN")
    }
  }

  static async verifyResetToken(token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET)
      return true
    } catch {
      throw new AppError("The link is no longer active or is not valid", 401, "INVALID_TOKEN")
    }
  }

  // --- MFA helpers -------------------------------------------------------------------------

  static async #crearChallengeMfa(userFound) {
    const codigo = generarCodigo()
    const expiraEn = new Date(Date.now() + MFA_TTL_MIN * 60_000)

    // Un login nuevo invalida los códigos previos del admin y arranca una
    // cadena limpia (si el INSERT falla, los previos siguen vigentes).
    const idCodigo = await withTransaction(async (db) => {
      await MfaModel.borrarDeDni(userFound.dni, db)
      return MfaModel.insertar({ dni: userFound.dni, codigoHash: hashCodigo(codigo), expiraEn }, db)
    })

    const challenge = jwt.sign(
      { sub: String(userFound.dni), role: "admin", purpose: MFA_PURPOSE, code_id: idCodigo },
      process.env.JWT_SECRET,
      { expiresIn: `${MFA_TTL_MIN}m` }
    )

    await AuthService.#enviarCodigoMfa({ correo: userFound.correo, codigo, dni: userFound.dni })

    return { mfa_required: true, challenge, expira_en: expiraEn.toISOString() }
  }

  static async #enviarCodigoMfa({ correo, codigo, dni }) {
    const esProduccion = process.env.NODE_ENV === "production"

    // Desvio consciente de dev (PLAN §10 adaptado): los correos del seed son
    // ficticios y Resend puede fallar sin API key, asi que el codigo se loguea
    // en el server para poder testear el flujo E2E sin email. El codigo jamás
    // viaja en una respuesta HTTP.
    if (!esProduccion) console.log(`[MFA dev] codigo para ${dni}: ${codigo}`)

    try {
      await EmailMethods.mfaCodigo({ correo, codigo, minutos: MFA_TTL_MIN })
    } catch (error) {
      if (esProduccion) throw error
      console.error(`[MFA dev] no se pudo enviar el código por email (${error.message}); usá el código del log.`)
    }
  }

  static #verificarChallenge(challenge) {
    try {
      const payload = jwt.verify(String(challenge ?? ""), process.env.JWT_SECRET, { algorithms: ["HS256"] })

      if (payload.purpose !== MFA_PURPOSE || payload.role !== "admin" || payload.code_id == null) {
        throw new Error("not an mfa challenge")
      }

      return payload
    } catch {
      throw new AppError("El desafío expiró o no es válido. Volvé a iniciar sesión.", 401, "MFA_CHALLENGE_INVALID")
    }
  }
}
