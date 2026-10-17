import test, { after } from "node:test"
import assert from "node:assert/strict"
import { esMayorDeEdad } from "../src/utils/time.js"
import { AccountService } from "../src/services/account.service.js"
import { pool } from "../src/config/db.js"

after(async () => {
  await pool.end()
})

test("esMayorDeEdad: adult born in 2000 is true", () => {
  const ahora = { fecha: "2026-06-15", hora: "10:00" }
  assert.equal(esMayorDeEdad("2000-01-01", ahora), true)
})

test("esMayorDeEdad: child born in 2015 is false", () => {
  const ahora = { fecha: "2026-06-15", hora: "10:00" }
  assert.equal(esMayorDeEdad("2015-06-15", ahora), false)
})

test("esMayorDeEdad: boundary at exactly 18 years old", () => {
  const ahora = { fecha: "2026-06-15", hora: "10:00" }
  // Turned 18 today:
  assert.equal(esMayorDeEdad("2008-06-15", ahora), true)
  // Turns 18 tomorrow:
  assert.equal(esMayorDeEdad("2008-06-16", ahora), false)
  // Turned 18 yesterday:
  assert.equal(esMayorDeEdad("2008-06-14", ahora), true)
})

test("AccountService: registering profesional under 18 throws VALIDATION_FAILED", async () => {
  await assert.rejects(
    async () => {
      await AccountService.register({
        role: "profesional",
        data: {
          dni: "99999991",
          nombre: "Joven",
          apellido: "Doctor",
          correo: "joven@example.com",
          genero: "M",
          fecha_nacimiento: "2015-01-01",
          numero_matricula: "MAT-99999",
          password: "password123",
          confirm: "password123",
        },
      })
    },
    (err) => {
      assert.equal(err.statusCode, 400)
      assert.equal(err.code, "VALIDATION_FAILED")
      return true
    }
  )
})

test("AccountService: registering admin under 18 throws VALIDATION_FAILED", async () => {
  await assert.rejects(
    async () => {
      await AccountService.register({
        role: "admin",
        data: {
          dni: "99999992",
          nombre: "Joven",
          apellido: "Admin",
          correo: "adminjoven@example.com",
          genero: "F",
          fecha_nacimiento: "2015-01-01",
          password: "password123",
          confirm: "password123",
        },
      })
    },
    (err) => {
      assert.equal(err.statusCode, 400)
      assert.equal(err.code, "VALIDATION_FAILED")
      return true
    }
  )
})
