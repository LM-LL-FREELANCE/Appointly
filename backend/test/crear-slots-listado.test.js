import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, proximoDiaSemana, PROF, OTRO_PROF, PROF_C, CLIENTE, OTRO_CLIENTE, ADMIN } from "./helpers/test-app.js"
import { assertError, assertEvento } from "./helpers/asserts.js"
import { fechaEnDias } from "../src/utils/time.js"

let t

before(async () => {
  t = await startTestApp()
  await sembrar()
})
after(async () => {
  await t?.close()
})

const ACTORES = {
  cliente: { dni: CLIENTE, role: "cliente" },
  profesional: { dni: PROF, role: "profesional" },
  otroProfesional: { dni: OTRO_PROF, role: "profesional" },
  admin: { dni: ADMIN, role: "admin" },
}

const ESTADOS = ["pendiente_confirmacion", "confirmado", "en_espera", "en_curso", "completado", "ausente", "reprogramado", "cancelado"]
const OCUPAN = ["pendiente_confirmacion", "confirmado", "en_espera", "en_curso", "completado", "ausente"]
const LIBERAN = ["cancelado", "reprogramado"]

// Aguirre works Mondays 08:00-13:00 and 16:00-20:00 (slots every 30 min).
const LUNES_CREAR = proximoDiaSemana(1, 14)
const LUNES_SLOTS = proximoDiaSemana(1, 21)
const LUNES_LIBRE = fechaEnDias(7, LUNES_CREAR) // never gets a turno from the occupancy tests
const LUNES_SLOTS_LIBRE = fechaEnDias(7, LUNES_SLOTS)
const HORAS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]

const crear = (actor, body) => t.api("POST", "/api/turnos", { as: ACTORES[actor], body })
const contarTurnos = async (profesional, fecha, hora) => {
  const [[{ n }]] = await t.pool.query(
    "SELECT COUNT(*) AS n FROM turno WHERE dni_profesional = ? AND fecha_turno = ? AND hora_turno = ?",
    [profesional, fecha, hora],
  )
  return n
}

// --- POST /api/turnos --------------------------------------------------------------------

test("crear (previous behavior): the cliente books a free slot, the turno is confirmado and the initial event is written", async () => {
  const fecha = LUNES_CREAR
  const res = await crear("cliente", { dni_profesional: PROF, fecha_turno: fecha, hora_turno: "12:00" })

  assert.equal(res.status, 201)
  assert.equal(res.body.status, "success")
  assert.equal(res.body.data.estado, "confirmado")
  assert.equal(res.body.data.dni_cliente, CLIENTE)
  assert.equal(res.body.data.dni_profesional, PROF)
  const id = res.body.data.id_turno

  const fila = await t.getTurno(id)
  assert.equal(fila.estado, "confirmado")
  assert.equal(fila.fecha_turno, fecha)
  assert.equal(fila.hora_turno, "12:00")

  const eventos = await t.getEventos(id)
  assert.equal(eventos.length, 1)
  assertEvento(eventos[0], { estado_anterior: null, estado_nuevo: "confirmado", dni_actor: CLIENTE, rol_actor: "cliente" })
})

test("crear (previous behavior): the profesional books for a cliente (dni_cliente) and is the event actor", async () => {
  const res = await crear("profesional", { dni_profesional: PROF, dni_cliente: OTRO_CLIENTE, fecha_turno: LUNES_CREAR, hora_turno: "12:30" })

  assert.equal(res.status, 201)
  assert.equal(res.body.data.dni_cliente, OTRO_CLIENTE)
  const [evento] = await t.getEventos(res.body.data.id_turno)
  assertEvento(evento, { estado_anterior: null, estado_nuevo: "confirmado", dni_actor: PROF, rol_actor: "profesional" })
})

test("crear: an admin books for a cliente (dni_cliente) and is the event actor", async () => {
  const res = await crear("admin", { dni_profesional: PROF, dni_cliente: CLIENTE, fecha_turno: LUNES_LIBRE, hora_turno: "11:30" })

  assert.equal(res.status, 201)
  assert.equal(res.body.data.estado, "confirmado")
  assert.equal(res.body.data.dni_cliente, CLIENTE)
  const eventos = await t.getEventos(res.body.data.id_turno)
  assert.equal(eventos.length, 1)
  assertEvento(eventos[0], { estado_anterior: null, estado_nuevo: "confirmado", dni_actor: ADMIN, rol_actor: "admin" })
})

for (const actor of ["admin", "profesional"]) {
  test(`crear: ${actor} without dni_cliente is 400 VALIDATION_FAILED and creates nothing`, async () => {
    const res = await crear(actor, { dni_profesional: PROF, fecha_turno: LUNES_LIBRE, hora_turno: "08:00" })

    assertError(res, 400, "VALIDATION_FAILED")
    assert.equal(await contarTurnos(PROF, LUNES_LIBRE, "08:00:00"), 0)
  })
}

test("crear (previous behavior): a slot outside the professional schedule is 409 OUT_OF_SCHEDULE", async () => {
  const res = await crear("cliente", { dni_profesional: PROF, fecha_turno: LUNES_CREAR, hora_turno: "14:00" })

  assertError(res, 409, "OUT_OF_SCHEDULE")
  assert.equal(await contarTurnos(PROF, LUNES_CREAR, "14:00:00"), 0)
})

test("crear (previous behavior): a past date is 400 VALIDATION_FAILED", async () => {
  const res = await crear("cliente", { dni_profesional: PROF, fecha_turno: fechaEnDias(-7), hora_turno: "09:00" })

  assertError(res, 400, "VALIDATION_FAILED")
})

test("crear (previous behavior): an unknown cliente is 422 REFERENCE_NOT_FOUND", async () => {
  const res = await crear("profesional", { dni_profesional: PROF, dni_cliente: 99999991, fecha_turno: LUNES_LIBRE, hora_turno: "08:00" })

  assertError(res, 422, "REFERENCE_NOT_FOUND")
})

// --- slot occupancy: crear (SLOT_TAKEN) and GET slots -----------------------------------

for (const [i, estado] of OCUPAN.entries()) {
  test(`crear: a ${estado} turno occupies the slot (409 SLOT_TAKEN, nothing created)`, async () => {
    const hora = HORAS[i]
    await t.insertTurno({ fecha: LUNES_CREAR, hora, estado, cliente: OTRO_CLIENTE })

    const res = await crear("cliente", { dni_profesional: PROF, fecha_turno: LUNES_CREAR, hora_turno: hora })

    assertError(res, 409, "SLOT_TAKEN")
    assert.equal(await contarTurnos(PROF, LUNES_CREAR, `${hora}:00`), 1)
  })
}

for (const [i, estado] of LIBERAN.entries()) {
  test(`crear: a ${estado} turno frees the slot (201, new confirmado turno)`, async () => {
    const hora = HORAS[OCUPAN.length + i]
    await t.insertTurno({ fecha: LUNES_CREAR, hora, estado, cliente: OTRO_CLIENTE })

    const res = await crear("cliente", { dni_profesional: PROF, fecha_turno: LUNES_CREAR, hora_turno: hora })

    assert.equal(res.status, 201)
    assert.equal(res.body.data.estado, "confirmado")
    assert.equal(await contarTurnos(PROF, LUNES_CREAR, `${hora}:00`), 2)
  })
}

// --- concurrency: crear takes the professional lock and re-checks the slot inside the transaction ---

const LUNES_CARRERA = proximoDiaSemana(1, 70)
let ronda = 0
/** A free Monday 19:30 slot nobody else uses: a fresh week per call. */
const slotDeCarrera = () => ({ fecha_turno: fechaEnDias(7 * ronda++, LUNES_CARRERA), hora_turno: "19:30" })
const contarEventosDeSlot = async (fecha, hora) => {
  const [[{ n }]] = await t.pool.query(
    `SELECT COUNT(*) AS n FROM turno_evento e JOIN turno tu ON tu.id_turno = e.id_turno
     WHERE tu.dni_profesional = ? AND tu.fecha_turno = ? AND tu.hora_turno = ? AND tu.estado = 'confirmado'`,
    [PROF, fecha, hora],
  )
  return n
}

test("crear: two simultaneous creates for the same free slot -> exactly one 201, the other 409 SLOT_TAKEN", async () => {
  for (let i = 0; i < 10; i++) {
    const destino = slotDeCarrera()
    const body = { dni_profesional: PROF, ...destino }

    const [a, b] = await Promise.all([
      t.api("POST", "/api/turnos", { as: { dni: CLIENTE, role: "cliente" }, body }),
      t.api("POST", "/api/turnos", { as: { dni: OTRO_CLIENTE, role: "cliente" }, body }),
    ])

    const ganador = [a, b].find((r) => r.status === 201)
    const perdedor = [a, b].find((r) => r.status !== 201)
    assert.ok(ganador && perdedor, `round ${i}: statuses ${a.status}/${b.status}`)
    assertError(perdedor, 409, "SLOT_TAKEN")
    assert.equal(perdedor.body.message, "that turno has just been taken")
    assert.equal(await contarTurnos(PROF, destino.fecha_turno, "19:30:00"), 1, `round ${i}: one turno row`)
    assert.equal(await contarEventosDeSlot(destino.fecha_turno, "19:30:00"), 1, `round ${i}: one initial event`)
  }
})

test("crear racing a reprogramacion to the same free slot -> exactly one wins, the other is 409 SLOT_TAKEN", async () => {
  for (let i = 0; i < 10; i++) {
    const destino = slotDeCarrera()
    const original = await t.insertTurno({ fecha: fechaEnDias(3), hora: "10:00", estado: "confirmado", cliente: OTRO_CLIENTE })

    const [creacion, reprogramacion] = await Promise.all([
      t.api("POST", "/api/turnos", { as: { dni: CLIENTE, role: "cliente" }, body: { dni_profesional: PROF, ...destino } }),
      t.api("POST", `/api/turnos/${original}/reprogramacion`, { as: ACTORES.profesional, body: destino }),
    ])

    const resultados = [creacion, reprogramacion]
    assert.equal(resultados.filter((r) => r.status === 201).length, 1, `round ${i}: statuses ${creacion.status}/${reprogramacion.status}`)
    assertError(resultados.find((r) => r.status !== 201), 409, "SLOT_TAKEN")
    assert.equal(await contarTurnos(PROF, destino.fecha_turno, "19:30:00"), 1, `round ${i}: one turno row`)
    // If the create lost, the original must be untouched; if the reprogramacion lost, too.
    const fila = await t.getTurno(original)
    assert.equal(fila.estado, reprogramacion.status === 201 ? "reprogramado" : "confirmado")
  }
})

const slotsDelLunes = async (fecha = LUNES_SLOTS) => {
  const res = await t.api("GET", `/api/profesionales/${PROF}/slots?desde=${fecha}&hasta=${fecha}`, { as: ACTORES.cliente })
  assert.equal(res.status, 200)
  return res.body.dias[0].slots
}

test("slots (previous behavior): a day without turnos lists every slot of the schedule", async () => {
  const slots = await slotsDelLunes(LUNES_SLOTS_LIBRE)

  assert.deepEqual(slots, [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  ])
})

for (const [i, estado] of OCUPAN.entries()) {
  test(`slots: a ${estado} turno removes the slot from the availability`, async () => {
    const hora = HORAS[i]
    await t.insertTurno({ fecha: LUNES_SLOTS, hora, estado, cliente: OTRO_CLIENTE })

    assert.equal((await slotsDelLunes()).includes(hora), false)
  })
}

for (const [i, estado] of LIBERAN.entries()) {
  test(`slots: a ${estado} turno leaves the slot available`, async () => {
    const hora = "12:" + (i === 0 ? "00" : "30")
    await t.insertTurno({ fecha: LUNES_SLOTS, hora, estado, cliente: OTRO_CLIENTE })

    assert.equal((await slotsDelLunes()).includes(hora), true)
  })
}

// --- GET /api/turnos?profesional= --------------------------------------------------------

// A window nobody else uses, with one turno per state for Fernandez (PROF_C).
const VENTANA = { desde: fechaEnDias(60), hasta: fechaEnDias(68) }
let idsPorEstado

async function sembrar() {
  idsPorEstado = {}
  for (const [i, estado] of ESTADOS.entries()) {
    idsPorEstado[estado] = await t.insertTurno({ fecha: fechaEnDias(60 + i), hora: "10:00", estado, profesional: PROF_C, cliente: CLIENTE })
  }
}

const listar = (actor, query) => t.api("GET", `/api/turnos?${new URLSearchParams(query)}`, { as: ACTORES[actor] })

test("list by profesional (previous behavior): without estado returns every turno of the range ordered by date", async () => {
  const res = await t.api("GET", `/api/turnos?profesional=${PROF_C}&desde=${VENTANA.desde}&hasta=${VENTANA.hasta}`, {
    as: { dni: PROF_C, role: "profesional" },
  })

  assert.equal(res.status, 200)
  assert.deepEqual(res.body.map((x) => x.id_turno), ESTADOS.map((e) => idsPorEstado[e]))
  assert.deepEqual(res.body.map((x) => x.estado), ESTADOS)
  for (const campo of ["fecha_turno", "hora_turno", "dni", "nombre", "apellido"]) assert.ok(campo in res.body[0])
  assert.equal(res.body[0].dni, CLIENTE)
})

for (const estado of ESTADOS) {
  test(`list by profesional: ?estado=${estado} is accepted and filters exactly`, async () => {
    const res = await t.api("GET", `/api/turnos?profesional=${PROF_C}&desde=${VENTANA.desde}&hasta=${VENTANA.hasta}&estado=${estado}`, {
      as: { dni: PROF_C, role: "profesional" },
    })

    assert.equal(res.status, 200)
    assert.deepEqual(res.body.map((x) => x.id_turno), [idsPorEstado[estado]])
  })
}

test("list by profesional: the old state activo is no longer a valid estado (400 VALIDATION_FAILED)", async () => {
  const res = await t.api("GET", `/api/turnos?profesional=${PROF_C}&estado=activo`, { as: { dni: PROF_C, role: "profesional" } })

  assertError(res, 400, "VALIDATION_FAILED")
})

test("list by profesional (previous behavior): another profesional is 403 FORBIDDEN", async () => {
  assertError(await listar("otroProfesional", { profesional: PROF_C }), 403, "FORBIDDEN")
})

test("list by profesional: an admin lists any professional", async () => {
  const res = await listar("admin", { profesional: PROF_C, ...VENTANA })

  assert.equal(res.status, 200)
  assert.equal(res.body.length, ESTADOS.length)
})

test("list by profesional (previous behavior): a cliente is 403 FORBIDDEN", async () => {
  assertError(await listar("cliente", { profesional: PROF_C }), 403, "FORBIDDEN")
})
