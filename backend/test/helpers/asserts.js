import assert from "node:assert/strict"

/** Asserts the JSON error envelope of AppError: status, exact `code`. */
export const assertError = (res, status, code) => {
  assert.equal(res.status, status, `expected HTTP ${status}, got ${res.status}: ${JSON.stringify(res.body)}`)
  assert.equal(res.body.code, code)
  assert.equal(res.body.status, status)
  assert.equal(typeof res.body.message, "string")
}

/** Asserts a turno_evento row (rows come from getEventos). */
export const assertEvento = (evento, esperado) => {
  assert.deepEqual(evento, { motivo: null, ...esperado })
}
