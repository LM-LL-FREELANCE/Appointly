import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import jwt from "jsonwebtoken"
import { startMfaTestApp, ADMIN, CLIENTE, PROFESIONAL, PASSWORD } from "./helpers/mfa-test-app.js"
import { MFA_TTL_MIN, MFA_MAX_INTENTOS, MFA_MAX_RESENDS } from "../src/config/constants.js"

let t

// El envío real de emails se reemplaza por un stub: el código queda acá para
// poder verificar el flujo E2E sin Resend (mismo desvío que documenta el service).
const emails = []

const sha256 = (valor) => createHash("sha256").update(String(valor)).digest("hex")

before(async () => {
  t = await startMfaTestApp()
  t.EmailMethods.mfaCodigo = async ({ correo, codigo }) => {
    emails.push({ correo, codigo })
  }
})

after(async () => {
  await t?.close()
})

const login = ({ dni = ADMIN, role = "admin", password = PASSWORD } = {}) =>
  t.api("POST", "/api/auth/login", { body: { dni: String(dni), password, role } })

const verificar = (challenge, codigo) =>
  t.api("POST", "/api/auth/mfa/verificar", { body: { challenge, codigo } })

const reenviar = (challenge) =>
  t.api("POST", "/api/auth/mfa/reenviar", { body: { challenge } })

const ultimoCodigo = () => emails.at(-1).codigo
const codigoIncorrecto = (codigo) => (codigo === "000000" ? "000001" : "000000")

// --- login admin: challenge ------------------------------------------------------------------

test("login admin: responde challenge MFA y NO setea cookie (§8.1 A1)", async () => {
  const res = await login()

  assert.equal(res.status, 200)
  assert.equal(res.body.mfa_required, true)
  assert.equal(typeof res.body.challenge, "string")
  assert.equal(t.cookieDe(res), null)

  const deltaMin = (new Date(res.body.expira_en).getTime() - Date.now()) / 60000
  assert.ok(deltaMin > MFA_TTL_MIN - 1 && deltaMin <= MFA_TTL_MIN, `expira_en a ${deltaMin} min`)

  const payload = jwt.decode(res.body.challenge)
  assert.equal(payload.purpose, "mfa")
  assert.equal(payload.role, "admin")
  assert.equal(String(payload.sub), String(ADMIN))
  assert.ok(payload.code_id > 0)
  assert.equal(payload.exp - payload.iat, MFA_TTL_MIN * 60)

  // El email salió al correo de la cuenta ADMIN (no al de la profesional: mismo
  // DNI, cuentas separadas) y la fila guarda solo el sha256 del código.
  const email = emails.at(-1)
  assert.equal(email.correo, "martin.aguirre.admin@appointly.dev")
  assert.match(email.codigo, /^\d{6}$/)

  const fila = await t.getCodigoRow(payload.code_id)
  assert.equal(fila.codigo_hash, sha256(email.codigo))
  assert.equal(fila.intentos, 0)
  assert.equal(fila.consumido_en, null)
})

test("login admin invalida los códigos previos no consumidos (§10.1)", async () => {
  const primerLogin = await login()
  const primerPayload = jwt.decode(primerLogin.body.challenge)
  const primerCodigo = ultimoCodigo()

  const segundoLogin = await login()
  assert.equal(segundoLogin.status, 200)
  assert.equal(segundoLogin.body.mfa_required, true)

  // El login nuevo descarta la cadena previa: la fila vieja ya no existe.
  assert.equal(await t.getCodigoRow(primerPayload.code_id), null)

  // El challenge viejo queda muerto aunque el código hubiera sido correcto.
  const res = await verificar(primerLogin.body.challenge, primerCodigo)
  assert.equal(res.status, 401)
  assert.equal(res.body.code, "MFA_CHALLENGE_INVALID")
})

// --- verificación ----------------------------------------------------------------------------

test("verificar con código correcto: emite cookie + user y consume el código (§10.3)", async () => {
  const loginRes = await login()
  const codigo = ultimoCodigo()
  const payload = jwt.decode(loginRes.body.challenge)

  const res = await verificar(loginRes.body.challenge, codigo)

  assert.equal(res.status, 200)
  assert.equal(res.body.dni, ADMIN)
  assert.equal(res.body.role, "admin")
  assert.equal(res.body.es_admin, true)
  assert.equal(res.body.correo, "martin.aguirre.admin@appointly.dev")

  const cookie = t.cookieDe(res)
  assert.ok(cookie, "debe setear access_token")

  assert.notEqual((await t.getCodigoRow(payload.code_id)).consumido_en, null)

  // La cookie de MFA es una sesión normal: /api/auth/me devuelve el user.
  const me = await t.api("GET", "/api/auth/me", { cookie })
  assert.equal(me.status, 200)
  assert.equal(me.body.dni, ADMIN)
  assert.equal(me.body.role, "admin")

  // Un código ya consumido no se puede reusar.
  const reuso = await verificar(loginRes.body.challenge, codigo)
  assert.equal(reuso.status, 401)
  assert.equal(reuso.body.code, "MFA_CHALLENGE_INVALID")
})

test("verificar con código incorrecto descuenta intentos → 401 MFA_INVALID_CODE", async () => {
  const loginRes = await login()
  const payload = jwt.decode(loginRes.body.challenge)
  const incorrecto = codigoIncorrecto(ultimoCodigo())

  for (let intento = 1; intento < MFA_MAX_INTENTOS; intento++) {
    const res = await verificar(loginRes.body.challenge, incorrecto)
    assert.equal(res.status, 401)
    assert.equal(res.body.code, "MFA_INVALID_CODE")
    assert.equal((await t.getCodigoRow(payload.code_id)).intentos, intento)
  }

  // Con intentos usados pero margen restante, el código correcto todavía entra.
  const ok = await verificar(loginRes.body.challenge, ultimoCodigo())
  assert.equal(ok.status, 200)
})

test("verificar: al 5º fallo bloquea el challenge → 429 MFA_TOO_MANY_ATTEMPTS", async () => {
  const loginRes = await login()
  const codigo = ultimoCodigo()
  const payload = jwt.decode(loginRes.body.challenge)
  const incorrecto = codigoIncorrecto(codigo)

  for (let intento = 1; intento < MFA_MAX_INTENTOS; intento++) {
    const res = await verificar(loginRes.body.challenge, incorrecto)
    assert.equal(res.status, 401)
  }

  const bloqueado = await verificar(loginRes.body.challenge, incorrecto)
  assert.equal(bloqueado.status, 429)
  assert.equal(bloqueado.body.code, "MFA_TOO_MANY_ATTEMPTS")

  assert.notEqual((await t.getCodigoRow(payload.code_id)).consumido_en, null)

  // Ni siquiera el código correcto revive el challenge bloqueado.
  const tarde = await verificar(loginRes.body.challenge, codigo)
  assert.equal(tarde.status, 401)
  assert.equal(tarde.body.code, "MFA_CHALLENGE_INVALID")
})

test("verificar: código vencido → 401 MFA_EXPIRED (§12 WS7)", async () => {
  const loginRes = await login()
  const payload = jwt.decode(loginRes.body.challenge)
  const codigo = ultimoCodigo()

  await t.pool.query(
    `UPDATE mfa_codigo SET expira_en = NOW() - INTERVAL 1 MINUTE WHERE id_codigo = ?`,
    [payload.code_id])

  const res = await verificar(loginRes.body.challenge, codigo)
  assert.equal(res.status, 401)
  assert.equal(res.body.code, "MFA_EXPIRED")
})

test("verificar: challenge inválido o token de sesión → 401 MFA_CHALLENGE_INVALID", async () => {
  for (const challenge of ["no-es-un-jwt", "aaa.bbb.ccc"]) {
    const res = await verificar(challenge, "123456")
    assert.equal(res.status, 401)
    assert.equal(res.body.code, "MFA_CHALLENGE_INVALID")
  }

  // Un access_token normal (sin purpose 'mfa') tampoco sirve como challenge.
  const sesion = jwt.sign({ sub: String(ADMIN), role: "admin" }, t.JWT_SECRET, { expiresIn: "1h" })
  const res = await verificar(sesion, "123456")
  assert.equal(res.status, 401)
  assert.equal(res.body.code, "MFA_CHALLENGE_INVALID")

  // Código mal formado: rechazado por zod antes de tocar el service.
  const malFormado = await verificar(jwt.sign(
    { sub: String(ADMIN), role: "admin", purpose: "mfa", code_id: 1 }, t.JWT_SECRET, { expiresIn: "10m" }), "12")
  assert.equal(malFormado.status, 400)
})

test("seguridad: el challenge NO vale como access_token (/me → null, §13.3)", async () => {
  const loginRes = await login()

  const me = await t.api("GET", "/api/auth/me", { cookie: `access_token=${loginRes.body.challenge}` })

  assert.equal(me.status, 200)
  assert.equal(me.body, null)
})

// --- reenvío ---------------------------------------------------------------------------------

test("reenviar: cooldown de 60 s y el código anterior queda invalidado (§10.4)", async () => {
  const loginRes = await login()
  const codigoViejo = ultimoCodigo()
  const payload = jwt.decode(loginRes.body.challenge)

  const inmediato = await reenviar(loginRes.body.challenge)
  assert.equal(inmediato.status, 429)
  assert.equal(inmediato.body.code, "MFA_RESEND_TOO_SOON")

  // Pasado el cooldown, el reenvío emite un código nuevo.
  await t.backdatearCodigo(payload.code_id)
  const reenvio = await reenviar(loginRes.body.challenge)
  assert.equal(reenvio.status, 200)
  assert.match(reenvio.body.msg, /c[oó]digo/i)

  const nuevo = ultimoCodigo()
  const filaNueva = await t.getUltimoCodigo(ADMIN)
  assert.equal(filaNueva.codigo_hash, sha256(nuevo))
  assert.equal(filaNueva.intentos, 0)
  assert.equal(filaNueva.consumido_en, null)

  // El código anterior quedó invalidado: ya no coincide con el vigente.
  const viejo = await verificar(loginRes.body.challenge, codigoViejo)
  assert.equal(viejo.status, 401)
  assert.equal(viejo.body.code, "MFA_INVALID_CODE")

  // ...y el nuevo sí.
  const ok = await verificar(loginRes.body.challenge, nuevo)
  assert.equal(ok.status, 200)
})

test("reenviar: máximo de 3 por challenge", async () => {
  const loginRes = await login()

  for (let i = 1; i <= MFA_MAX_RESENDS; i++) {
    await t.backdatearCodigo((await t.getUltimoCodigo(ADMIN)).id_codigo)
    const res = await reenviar(loginRes.body.challenge)
    assert.equal(res.status, 200, `reenvío ${i} debe pasar`)
  }

  await t.backdatearCodigo((await t.getUltimoCodigo(ADMIN)).id_codigo)
  const extra = await reenviar(loginRes.body.challenge)
  assert.equal(extra.status, 429)
  assert.equal(extra.body.code, "MFA_RESEND_TOO_SOON")

  // El último código válido sigue siendo el del tercer reenvío.
  const ok = await verificar(loginRes.body.challenge, ultimoCodigo())
  assert.equal(ok.status, 200)
})

// --- casos cruzados y regresión ----------------------------------------------------------------

test("seguridad: el código de otro admin no valida (§13.3)", async () => {
  // Segundo admin directo en la DB scratch (mismo hash del seed: password123).
  await t.pool.query(
    `INSERT INTO persona (dni_persona, nombre, apellido, fecha_nacimiento, genero) VALUES (99999999, 'Otro', 'Admin', '1985-05-05', 'M')`)
  await t.pool.query(
    `INSERT INTO persona_rol (dni_persona, id_rol, correo, password_hash)
     VALUES (99999999, 3, 'otro.admin@test.dev', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG')`)

  const loginOtro = await login({ dni: 99999999 })
  assert.equal(loginOtro.status, 200)
  const codigoOtro = ultimoCodigo()

  const loginAdmin = await login()
  const codigoPropio = ultimoCodigo()

  const cruzado = await verificar(loginAdmin.body.challenge, codigoOtro)
  assert.equal(cruzado.status, 401)
  assert.equal(cruzado.body.code, "MFA_INVALID_CODE")

  const propio = await verificar(loginAdmin.body.challenge, codigoPropio)
  assert.equal(propio.status, 200)
})

test("login admin con credenciales inválidas no genera desafío ni código", async () => {
  const antes = await t.contarCodigos(ADMIN)

  const res = await login({ password: "password-incorrecta" })
  assert.equal(res.status, 401)
  assert.equal(res.body.code, "INVALID_CREDENTIALS")

  assert.equal(await t.contarCodigos(ADMIN), antes)
})

test("cuenta suspendida entre el login y la verificación → 403 ACCOUNT_SUSPENDED", async () => {
  const loginRes = await login()
  const codigo = ultimoCodigo()

  await t.pool.query(`UPDATE persona_rol SET suspendido_en = NOW() WHERE dni_persona = ? AND id_rol = 3`, [ADMIN])

  try {
    const res = await verificar(loginRes.body.challenge, codigo)
    assert.equal(res.status, 403)
    assert.equal(res.body.code, "ACCOUNT_SUSPENDED")
  } finally {
    await t.pool.query(`UPDATE persona_rol SET suspendido_en = NULL WHERE dni_persona = ? AND id_rol = 3`, [ADMIN])
  }
})

test("regresión: cliente y profesional loguean como siempre, sin MFA (§13.2)", async () => {
  const cliente = await login({ dni: CLIENTE, role: "cliente" })
  assert.equal(cliente.status, 200)
  assert.equal(cliente.body.role, "cliente")
  assert.equal(cliente.body.mfa_required, undefined)

  const cookieCliente = t.cookieDe(cliente)
  assert.ok(cookieCliente)

  const me = await t.api("GET", "/api/auth/me", { cookie: cookieCliente })
  assert.equal(me.status, 200)
  assert.equal(me.body.dni, CLIENTE)

  const profesional = await login({ dni: PROFESIONAL, role: "profesional" })
  assert.equal(profesional.status, 200)
  assert.equal(profesional.body.role, "profesional")
  assert.equal(profesional.body.mfa_required, undefined)
  assert.ok(t.cookieDe(profesional))
})
