import { test } from "node:test"
import assert from "node:assert/strict"
import { TIMEZONE } from "../src/config/constants.js"
import { ahoraEnTimezone, enMinutos, fechaEnDias, aFechaISO, esHoy, yaComenzo } from "../src/utils/time.js"

test("TIMEZONE is Buenos Aires", () => {
  assert.equal(TIMEZONE, "America/Argentina/Buenos_Aires")
})

test("ahoraEnTimezone converts a UTC instant to the Buenos Aires date and time (UTC-3)", () => {
  // 01:30Z is still the previous day in Buenos Aires.
  assert.deepEqual(ahoraEnTimezone(new Date("2026-06-15T01:30:00Z")), { fecha: "2026-06-14", hora: "22:30" })
  assert.deepEqual(ahoraEnTimezone(new Date("2026-06-15T03:00:00Z")), { fecha: "2026-06-15", hora: "00:00" })
  assert.deepEqual(ahoraEnTimezone(new Date("2026-06-15T15:05:00Z")), { fecha: "2026-06-15", hora: "12:05" })
})

test("enMinutos shifts the instant before formatting, crossing day boundaries", () => {
  const base = new Date("2026-06-15T02:50:00Z") // 23:50 local
  assert.deepEqual(enMinutos(20, base), { fecha: "2026-06-15", hora: "00:10" })
  assert.deepEqual(enMinutos(-60, base), { fecha: "2026-06-14", hora: "22:50" })
})

test("fechaEnDias does calendar arithmetic on a YYYY-MM-DD date", () => {
  assert.equal(fechaEnDias(1, "2026-06-30"), "2026-07-01")
  assert.equal(fechaEnDias(-1, "2026-03-01"), "2026-02-28")
  assert.equal(fechaEnDias(0, "2026-06-15"), "2026-06-15")
})

test("esHoy and yaComenzo compare against the given 'now'", () => {
  const ahora = { fecha: "2026-06-15", hora: "10:00" }
  assert.equal(esHoy("2026-06-15", ahora), true)
  assert.equal(esHoy("2026-06-16", ahora), false)
  assert.equal(yaComenzo("2026-06-15", "10:00", ahora), true)
  assert.equal(yaComenzo("2026-06-15", "10:01", ahora), false)
  assert.equal(yaComenzo("2026-06-14", "23:59", ahora), true)
  assert.equal(yaComenzo("2026-06-16", "00:00", ahora), false)
})

test("aFechaISO normalizes a local-midnight Date (as mysql2 returns DATE columns) and strings", () => {
  assert.equal(aFechaISO(new Date(2026, 5, 15)), "2026-06-15")
  assert.equal(aFechaISO("2026-06-15"), "2026-06-15")
  assert.equal(aFechaISO("2026-06-15T03:00:00.000Z"), "2026-06-15")
  assert.equal(esHoy(new Date(2026, 5, 15), { fecha: "2026-06-15", hora: "10:00" }), true)
  assert.equal(yaComenzo(new Date(2026, 5, 15), "09:30:00", { fecha: "2026-06-15", hora: "09:30" }), true)
})
