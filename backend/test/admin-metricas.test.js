import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, CLIENTE, ADMIN } from "./helpers/test-app.js"
import { assertError } from "./helpers/asserts.js"
import { buildCSV, escapeCSVCell } from "../src/utils/csv.js"
import { fechaEnDias } from "../src/utils/time.js"

let t

before(async () => {
  t = await startTestApp()
})

after(async () => {
  await t?.close()
})

const ACTORES = {
  cliente: { dni: CLIENTE, role: "cliente" },
  admin: { dni: ADMIN, role: "admin" },
}

test("D1: GET /api/admin/metricas returns full bundle matching SQL aggregations over seed", async () => {
  const desde = fechaEnDias(-10)
  const hasta = fechaEnDias(10)

  const res = await t.api("GET", `/api/admin/metricas?desde=${desde}&hasta=${hasta}`, {
    as: ACTORES.admin,
  })
  assert.equal(res.status, 200)

  const b = res.body
  assert.deepEqual(b.rango, { desde, hasta })
  assert.ok(b.turnos_hoy > 0, "seed has turnos today")
  assert.equal(b.turnos_rango, 27, "seed has 27 turnos in +/-10 days")

  const sumaEstados = Object.values(b.por_estado).reduce((acc, v) => acc + v, 0)
  assert.equal(sumaEstados, b.turnos_rango)
  assert.equal(b.por_estado.ausente, 3)
  assert.equal(b.por_estado.completado, 4)
  assert.equal(b.por_estado.cancelado, 4)

  assert.equal(b.tasas.completitud, Math.round((4 / 27) * 100))
  assert.equal(b.tasas.cancelacion, Math.round((4 / 27) * 100))
  assert.equal(b.tasas.ausentismo, Math.round((3 / 27) * 100))

  assert.ok(Array.isArray(b.especialidades_top) && b.especialidades_top.length <= 5)
  assert.ok(b.especialidades_top.length > 0)
  assert.ok(Array.isArray(b.profesionales_top) && b.profesionales_top.length === 5)
  assert.ok(Array.isArray(b.horas_pico) && b.horas_pico.length > 0)
  assert.ok(Array.isArray(b.nuevos_clientes) && b.nuevos_clientes.length === 6)

  // Non-admin is rejected
  const noAdmin = await t.api("GET", "/api/admin/metricas", { as: ACTORES.cliente })
  assertError(noAdmin, 403, "FORBIDDEN")
})

test("D2 & D3 & §13.3: CSV exports include UTF-8 BOM, attachment headers, and formula injection protection", async () => {
  const desde = fechaEnDias(-10)
  const hasta = fechaEnDias(10)

  const resTurnos = await t.api(
    "GET",
    `/api/admin/reportes/turnos.csv?desde=${desde}&hasta=${hasta}`,
    { as: ACTORES.admin },
  )
  assert.equal(resTurnos.status, 200)
  assert.ok(resTurnos.headers.get("content-type")?.includes("text/csv"))
  assert.ok(
    resTurnos.headers.get("content-disposition")?.includes(`turnos_${desde}_${hasta}.csv`),
  )
  assert.ok(resTurnos.body.includes("ID Turno,Fecha,Hora,Estado"))

  const resUsuarios = await t.api("GET", "/api/admin/reportes/usuarios.csv?rol=cliente", {
    as: ACTORES.admin,
  })
  assert.equal(resUsuarios.status, 200)
  assert.ok(resUsuarios.headers.get("content-disposition")?.includes("usuarios.csv"))
  assert.ok(resUsuarios.body.includes("DNI,Rol,Nombre,Apellido,Correo"))

  // Verify buildCSV prepends UTF-8 BOM (0xFEFF -> EF BB BF in UTF-8 bytes)
  const rawCsv = buildCSV([{ key: "nombre", label: "Nombre" }], [{ nombre: "Martín" }])
  assert.equal(rawCsv.charCodeAt(0), 0xfeff, "must start with UTF-8 BOM")
  assert.deepEqual([...Buffer.from(rawCsv, "utf8").subarray(0, 3)], [0xef, 0xbb, 0xbf])

  // Unit check for CSV injection protection (§13.3)
  assert.equal(escapeCSVCell("=cmd|' /C calc'!A0"), "'=cmd|' /C calc'!A0")
  assert.equal(escapeCSVCell("+SUM(A1:A2)"), "'+SUM(A1:A2)")
  assert.equal(escapeCSVCell("-2+3"), "'-2+3")
  assert.equal(escapeCSVCell("@SUM(1,2)"), '"\'@SUM(1,2)"')
})
