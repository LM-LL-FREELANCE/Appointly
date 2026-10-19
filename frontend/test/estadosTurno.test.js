import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ESTADO_LABEL,
  ESTADO_COLOR,
  ESTADOS_ABIERTOS,
  esAbierto,
  esCancelable,
  estadoLabel,
} from "../src/utils/estadosTurno.js"

const ESTADOS = [
  // estado, label, color, abierto, cancelable
  ["pendiente_confirmacion", "Pendiente de confirmación", "violet", true, true],
  ["confirmado", "Confirmado", "teal", true, true],
  ["en_espera", "En espera", "cyan", true, false],
  ["en_curso", "En curso", "blue", true, false],
  ["completado", "Completado", "gray", false, false],
  ["ausente", "Ausente", "orange", false, false],
  ["reprogramado", "Reprogramado", "yellow", false, false],
  ["cancelado", "Cancelado", "red", false, false],
]

for (const [estado, label, color, abierto, cancelable] of ESTADOS) {
  test(`${estado}: label, color, esAbierto and esCancelable`, () => {
    assert.equal(ESTADO_LABEL[estado], label)
    assert.equal(estadoLabel(estado), label)
    assert.equal(ESTADO_COLOR[estado], color)
    assert.equal(esAbierto(estado), abierto)
    assert.equal(esCancelable(estado), cancelable)
  })
}

test("the maps cover exactly the 8 states of the backend", () => {
  const esperados = ESTADOS.map(([estado]) => estado)
  assert.deepEqual(Object.keys(ESTADO_LABEL), esperados)
  assert.deepEqual(Object.keys(ESTADO_COLOR), esperados)
})

test("ESTADOS_ABIERTOS lists the four open states", () => {
  assert.deepEqual(ESTADOS_ABIERTOS, ["pendiente_confirmacion", "confirmado", "en_espera", "en_curso"])
})

test("the old state activo is gone: not open, not cancelable, no color or label", () => {
  assert.equal(esAbierto("activo"), false)
  assert.equal(esCancelable("activo"), false)
  assert.equal(ESTADO_LABEL.activo, undefined)
  assert.equal(ESTADO_COLOR.activo, undefined)
})

test("estadoLabel falls back to the raw value for unknown states", () => {
  assert.equal(estadoLabel("inventado"), "inventado")
  assert.equal(esAbierto("inventado"), false)
  assert.equal(esCancelable("inventado"), false)
})

test("estadoLabel of a missing state is an empty string (never 'undefined')", () => {
  assert.equal(estadoLabel(undefined), "")
  assert.equal(estadoLabel(null), "")
})
