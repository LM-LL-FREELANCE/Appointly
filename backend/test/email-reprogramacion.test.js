import { test, before, after } from "node:test"
import assert from "node:assert/strict"

let EmailMethods
let enviados
const fetchOriginal = globalThis.fetch

before(async () => {
  process.env.RESEND_API_KEY = "re_test_key_not_real"
  process.env.EMAIL_FROM = "Appointly <test@example.com>"
  ;({ EmailMethods } = await import("../src/emails/email.methods.js"))
  enviados = []
  // Resend uses the global fetch: capture the request instead of sending it.
  globalThis.fetch = async (url, init) => {
    enviados.push({ url: String(url), body: JSON.parse(init.body) })
    return new Response(JSON.stringify({ id: "email_test" }), { status: 200, headers: { "Content-Type": "application/json" } })
  }
})
after(() => {
  globalThis.fetch = fetchOriginal
  delete process.env.RESEND_API_KEY
})

const turno = (extra) => ({
  fecha_turno: new Date(2026, 5, 15), // mysql2 returns DATE as a local-midnight Date
  hora_turno: "10:00:00",
  c_nombre: "Ricardo",
  c_correo: "ricardo@mail.com",
  p_nombre: "Martin",
  p_apellido: "Aguirre",
  ...extra,
})

test("turnoReprogramado: mails the patient the old and new date/time, the professional and the motivo", async () => {
  enviados.length = 0

  await EmailMethods.turnoReprogramado({
    original: turno(),
    nuevo: turno({ fecha_turno: new Date(2026, 5, 22), hora_turno: "16:30:00" }),
    motivo: "Urgencia del profesional",
  })

  assert.equal(enviados.length, 1)
  const { body } = enviados[0]
  assert.equal(body.to, "ricardo@mail.com")
  assert.match(body.subject, /reprogramad/i)
  for (const fragmento of ["Ricardo", "15 de junio de 2026", "10:00 hs", "22 de junio de 2026", "16:30 hs", "Martin Aguirre", "Urgencia del profesional"]) {
    assert.ok(body.html.includes(fragmento), `html should include "${fragmento}"`)
  }
  assert.match(body.html, /cancel/i, "tells the patient they can cancel from the app")
})

test("turnoReprogramado: without motivo the mail has no motivo line", async () => {
  enviados.length = 0

  await EmailMethods.turnoReprogramado({ original: turno(), nuevo: turno({ hora_turno: "11:00:00" }), motivo: null })

  assert.equal(enviados[0].body.html.includes("Motivo"), false)
})

test("turnoReprogramado: every interpolated value is HTML-escaped", async () => {
  enviados.length = 0

  await EmailMethods.turnoReprogramado({
    original: turno({ c_nombre: "<b>Ric</b>", p_apellido: "O'<script>x</script>" }),
    nuevo: turno({ c_nombre: "<b>Ric</b>", p_apellido: "O'<script>x</script>" }),
    motivo: '<img src=x onerror="alert(1)">',
  })

  const { html } = enviados[0].body
  assert.equal(html.includes("<script>"), false)
  assert.equal(html.includes("<img"), false)
  assert.equal(html.includes("<b>Ric"), false)
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"))
})

test("turnoReprogramado: a Resend error is thrown to the caller (the service swallows it as best effort)", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ name: "validation_error", message: "boom", statusCode: 422 }), { status: 422, headers: { "Content-Type": "application/json" } })
  const consoleError = console.error
  console.error = () => {}

  try {
    await assert.rejects(EmailMethods.turnoReprogramado({ original: turno(), nuevo: turno(), motivo: null }), /No se pudo enviar/)
  } finally {
    console.error = consoleError
  }
})
