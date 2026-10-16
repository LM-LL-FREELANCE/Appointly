import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, PROF, OTRO_PROF, CLIENTE, OTRO_CLIENTE, ADMIN } from "./helpers/test-app.js"
import { assertError, assertEvento } from "./helpers/asserts.js"
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
  otroCliente: { dni: OTRO_CLIENTE, role: "cliente" },
  profesional: { dni: PROF, role: "profesional" },
  otroProfesional: { dni: OTRO_PROF, role: "profesional" },
  admin: { dni: ADMIN, role: "admin" },
}

const futuro = () => ({ fecha: fechaEnDias(3), hora: "12:00" })
const cancelar = (id, actor, body) => t.api("POST", `/api/turnos/${id}/cancelacion`, { as: ACTORES[actor], body })

// --- cancel: allowed origins and roles ---------------------------------------------------

test("cancel (previous behavior): the cliente cancels their own confirmado turno with a motivo", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })

  const res = await cancelar(id, "cliente", { motivo: "Me surgio un viaje" })

  assert.equal(res.status, 200)
  assert.equal(res.body.id_turno, id)
  assert.equal(res.body.estado, "cancelado")
  assert.equal(res.body.motivo_cancelacion, "Me surgio un viaje")
  assert.notEqual(res.body.cancelado_en, null)
  assert.equal(res.body.dni_cliente, CLIENTE)
  assert.equal(res.body.dni_profesional, PROF)
  assert.equal(res.body.cancelado_por_rol, "cliente")
  assert.equal(res.body.cancelado_por_dni, CLIENTE)
  // the response keeps the fields of the turno detail
  for (const campo of ["p_apellido", "p_nombre", "p_correo", "tipo", "c_apellido", "c_nombre", "c_correo", "fecha_turno", "hora_turno"]) {
    assert.ok(campo in res.body, `missing field ${campo}`)
  }

  const fila = await t.getTurno(id)
  assert.equal(fila.estado, "cancelado")
  assert.equal(fila.motivo_cancelacion, "Me surgio un viaje")
  assert.notEqual(fila.cancelado_en, null)

  const eventos = await t.getEventos(id)
  assert.equal(eventos.length, 1)
  assertEvento(eventos[0], {
    estado_anterior: "confirmado",
    estado_nuevo: "cancelado",
    dni_actor: CLIENTE,
    rol_actor: "cliente",
    motivo: "Me surgio un viaje",
  })
})

test("cancel: the cliente cancels a pendiente_confirmacion turno without motivo", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "pendiente_confirmacion" })

  const res = await cancelar(id, "cliente")

  assert.equal(res.status, 200)
  assert.equal(res.body.estado, "cancelado")
  assert.equal(res.body.motivo_cancelacion, null)
  assert.equal((await t.getTurno(id)).estado, "cancelado")
  const [evento] = await t.getEventos(id)
  assertEvento(evento, {
    estado_anterior: "pendiente_confirmacion",
    estado_nuevo: "cancelado",
    dni_actor: CLIENTE,
    rol_actor: "cliente",
  })
})

test("cancel: the profesional cancels and is recorded as actor", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })

  const res = await cancelar(id, "profesional", { motivo: "Imprevisto del profesional" })

  assert.equal(res.status, 200)
  assert.equal(res.body.estado, "cancelado")
  assert.equal(res.body.cancelado_por_rol, "profesional")
  assert.equal(res.body.cancelado_por_dni, PROF)
  const [evento] = await t.getEventos(id)
  assertEvento(evento, {
    estado_anterior: "confirmado",
    estado_nuevo: "cancelado",
    dni_actor: PROF,
    rol_actor: "profesional",
    motivo: "Imprevisto del profesional",
  })
})

test("cancel: an admin can cancel any turno and is recorded as actor", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })

  const res = await cancelar(id, "admin", { motivo: "Consultorio cerrado" })

  assert.equal(res.status, 200)
  assert.equal(res.body.estado, "cancelado")
  assert.equal(res.body.cancelado_por_rol, "admin")
  assert.equal(res.body.cancelado_por_dni, ADMIN)
  assert.equal((await t.getTurno(id)).estado, "cancelado")
  const [evento] = await t.getEventos(id)
  assertEvento(evento, {
    estado_anterior: "confirmado",
    estado_nuevo: "cancelado",
    dni_actor: ADMIN,
    rol_actor: "admin",
    motivo: "Consultorio cerrado",
  })
})

// --- cancel: rejections ------------------------------------------------------------------

test("cancel (previous behavior): cancelling twice is 409 ALREADY_CANCELLED and changes nothing", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "cancelado" })

  const res = await cancelar(id, "cliente", { motivo: "otra vez" })

  assertError(res, 409, "ALREADY_CANCELLED")
  const fila = await t.getTurno(id)
  assert.equal(fila.estado, "cancelado")
  assert.equal(fila.motivo_cancelacion, null)
  assert.deepEqual(await t.getEventos(id), [])
})

for (const estado of ["en_espera", "en_curso", "completado", "ausente", "reprogramado"]) {
  test(`cancel: a ${estado} turno is 409 NOT_CANCELLABLE and changes nothing`, async () => {
    const id = await t.insertTurno({ ...futuro(), estado })

    const res = await cancelar(id, "profesional")

    assertError(res, 409, "NOT_CANCELLABLE")
    assert.equal((await t.getTurno(id)).estado, estado)
    assert.deepEqual(await t.getEventos(id), [])
  })
}

for (const actor of ["otroCliente", "otroProfesional"]) {
  test(`cancel (previous behavior): ${actor} is 403 FORBIDDEN and changes nothing`, async () => {
    const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })

    const res = await cancelar(id, actor)

    assertError(res, 403, "FORBIDDEN")
    assert.equal((await t.getTurno(id)).estado, "confirmado")
    assert.deepEqual(await t.getEventos(id), [])
  })
}

test("cancel (previous behavior): an unknown turno is 404 NOT_FOUND", async () => {
  assertError(await cancelar(999999999, "cliente"), 404, "NOT_FOUND")
})

test("cancel: a concurrent change after the read is 409 STATE_CHANGED and writes no event", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })
  const original = t.TurnosModel.getTurnoById
  let interferido = false
  t.TurnosModel.getTurnoById = async function (...args) {
    const turno = await original.apply(this, args)
    if (!interferido) {
      interferido = true
      await t.pool.query("UPDATE turno SET estado = 'completado' WHERE id_turno = ?", [id])
    }
    return turno
  }

  try {
    const res = await cancelar(id, "cliente")

    assertError(res, 409, "STATE_CHANGED")
    assert.equal((await t.getTurno(id)).estado, "completado")
    assert.deepEqual(await t.getEventos(id), [])
  } finally {
    t.TurnosModel.getTurnoById = original
  }
})

// --- cancel motivo validation ---------------------------------------------------------

test("cancel: a motivo longer than 255 characters is 400 VALIDATION_FAILED on motivo and changes nothing", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })
  const turnosAntes = (await t.pool.query("SELECT COUNT(*) AS n FROM turno_evento"))[0][0].n

  const res = await cancelar(id, "cliente", { motivo: "x".repeat(256) })

  assertError(res, 400, "VALIDATION_FAILED")
  assert.ok(res.body.fieldErrors.motivo, "fieldErrors names motivo")
  const fila = await t.getTurno(id)
  assert.equal(fila.estado, "confirmado")
  assert.equal(fila.motivo_cancelacion, null)
  assert.equal(fila.cancelado_en, null)
  assert.deepEqual(await t.getEventos(id), [])
  assert.equal((await t.pool.query("SELECT COUNT(*) AS n FROM turno_evento"))[0][0].n, turnosAntes)
})

test("cancel: a motivo of exactly 255 characters is accepted and stored in full", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })
  const motivo = "m".repeat(255)

  const res = await cancelar(id, "profesional", { motivo })

  assert.equal(res.status, 200)
  assert.equal(res.body.motivo_cancelacion, motivo)
  assert.equal((await t.getTurno(id)).motivo_cancelacion, motivo)
  assert.equal((await t.getEventos(id))[0].motivo, motivo)
})

test("cancel: motivo is trimmed, and an empty or blank one is stored as NULL", async () => {
  const recortado = await t.insertTurno({ ...futuro(), estado: "confirmado" })
  const vacio = await t.insertTurno({ ...futuro(), estado: "confirmado" })
  const nulo = await t.insertTurno({ ...futuro(), estado: "confirmado" })

  assert.equal((await cancelar(recortado, "cliente", { motivo: "  Me mudo  " })).status, 200)
  assert.equal((await cancelar(vacio, "cliente", { motivo: "   " })).status, 200)
  assert.equal((await cancelar(nulo, "cliente", { motivo: null })).status, 200)

  assert.equal((await t.getTurno(recortado)).motivo_cancelacion, "Me mudo")
  assert.equal((await t.getEventos(recortado))[0].motivo, "Me mudo")
  for (const id of [vacio, nulo]) {
    assert.equal((await t.getTurno(id)).motivo_cancelacion, null)
    assert.equal((await t.getEventos(id))[0].motivo, null)
  }
})

test("cancel: a non-string motivo is 400 VALIDATION_FAILED and changes nothing", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })

  const res = await cancelar(id, "cliente", { motivo: { texto: "hola" } })

  assertError(res, 400, "VALIDATION_FAILED")
  assert.ok(res.body.fieldErrors.motivo)
  assert.equal((await t.getTurno(id)).estado, "confirmado")
  assert.deepEqual(await t.getEventos(id), [])
})

// --- GET /api/turnos/:id -----------------------------------------------------------------

test("GET /:id (previous behavior): the cliente and the profesional of the turno read it", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })

  for (const actor of ["cliente", "profesional"]) {
    const res = await t.api("GET", `/api/turnos/${id}`, { as: ACTORES[actor] })
    assert.equal(res.status, 200)
    assert.equal(res.body.id_turno, id)
    assert.equal(res.body.estado, "confirmado")
    assert.equal(res.body.dni_cliente, CLIENTE)
    assert.equal(res.body.dni_profesional, PROF)
    assert.equal(res.body.hora_turno, "12:00:00")
    assert.equal(res.body.id_turno_origen, null)
    assert.equal(res.body.id_turno_nuevo, null)
    assert.equal(res.body.cancelado_por_rol, null)
    assert.equal(res.body.cancelado_por_dni, null)
  }
})

test("GET /:id: an admin reads any turno", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })

  const res = await t.api("GET", `/api/turnos/${id}`, { as: ACTORES.admin })

  assert.equal(res.status, 200)
  assert.equal(res.body.id_turno, id)
})

for (const actor of ["otroCliente", "otroProfesional"]) {
  test(`GET /:id (previous behavior): ${actor} is 403 FORBIDDEN`, async () => {
    const id = await t.insertTurno({ ...futuro(), estado: "confirmado" })

    assertError(await t.api("GET", `/api/turnos/${id}`, { as: ACTORES[actor] }), 403, "FORBIDDEN")
  })
}

test("GET /:id: an unknown turno is 404 NOT_FOUND", async () => {
  assertError(await t.api("GET", "/api/turnos/999999999", { as: ACTORES.admin }), 404, "NOT_FOUND")
})

test("GET /:id: cancelado_por_* come from the last event towards cancelado", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "cancelado" })
  await t.insertEvento({ id_turno: id, estado_anterior: "confirmado", estado_nuevo: "cancelado", dni_actor: CLIENTE, rol_actor: "cliente", creado_en: "2026-01-01 10:00:00" })
  await t.insertEvento({ id_turno: id, estado_anterior: "cancelado", estado_nuevo: "cancelado", dni_actor: ADMIN, rol_actor: "admin", creado_en: "2026-01-02 10:00:00" })

  const res = await t.api("GET", `/api/turnos/${id}`, { as: ACTORES.admin })

  assert.equal(res.body.cancelado_por_rol, "admin")
  assert.equal(res.body.cancelado_por_dni, ADMIN)
})

test("GET /:id: cancelado_por_* are null when no event towards cancelado exists", async () => {
  const id = await t.insertTurno({ ...futuro(), estado: "cancelado" }) // legacy turno, no events

  const res = await t.api("GET", `/api/turnos/${id}`, { as: ACTORES.admin })

  assert.equal(res.body.estado, "cancelado")
  assert.equal(res.body.cancelado_por_rol, null)
  assert.equal(res.body.cancelado_por_dni, null)
})

test("GET /:id: id_turno_origen and id_turno_nuevo link a turno with the one that came from it", async () => {
  const original = await t.insertTurno({ ...futuro(), estado: "ausente" })
  const nuevo = await t.insertTurno({ fecha: fechaEnDias(10), estado: "confirmado", origen: original })

  const resOriginal = await t.api("GET", `/api/turnos/${original}`, { as: ACTORES.profesional })
  const resNuevo = await t.api("GET", `/api/turnos/${nuevo}`, { as: ACTORES.profesional })

  assert.equal(resOriginal.body.id_turno_origen, null)
  assert.equal(resOriginal.body.id_turno_nuevo, nuevo)
  assert.equal(resNuevo.body.id_turno_origen, original)
  assert.equal(resNuevo.body.id_turno_nuevo, null)
})
