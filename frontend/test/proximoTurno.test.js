import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularProximoTurno } from '../src/utils/estadosTurno.js'

test('calcularProximoTurno: never returns a turno from tomorrow or next week', () => {
  const ahora = { fecha: '2026-06-15', hora: '20:00' }
  const turnos = [
    { id_turno: 1, fecha_turno: '2026-06-16T03:00:00.000Z', hora_turno: '09:00:00', estado: 'confirmado' },
    { id_turno: 2, fecha_turno: '2026-06-22T03:00:00.000Z', hora_turno: '08:00:00', estado: 'confirmado' },
  ]

  const res = calcularProximoTurno({ turnos, ahora })
  assert.equal(res.turno, null)
  assert.equal(res.estadoJornada, 'sin_turnos')
})

test('calcularProximoTurno: prioritizes any turno currently en_curso today', () => {
  const ahora = { fecha: '2026-06-15', hora: '10:45' }
  const turnos = [
    { id_turno: 1, fecha_turno: '2026-06-15T03:00:00.000Z', hora_turno: '10:00:00', estado: 'en_curso' },
    { id_turno: 2, fecha_turno: '2026-06-15T03:00:00.000Z', hora_turno: '11:00:00', estado: 'confirmado' },
  ]

  const res = calcularProximoTurno({ turnos, ahora })
  assert.equal(res.turno?.id_turno, 1)
  assert.equal(res.estadoJornada, 'activo')
})

test('calcularProximoTurno: shows upcoming turno from early morning of today (e.g. 06:00 for a 10:00 turno)', () => {
  const ahora = { fecha: '2026-06-15', hora: '06:00' }
  const turnos = [
    { id_turno: 1, fecha_turno: '2026-06-15T03:00:00.000Z', hora_turno: '10:00:00', estado: 'confirmado' },
  ]

  const res = calcularProximoTurno({ turnos, ahora })
  assert.equal(res.turno?.id_turno, 1)
  assert.equal(res.estadoJornada, 'activo')
  assert.equal(res.primerTurnoHora, '10:00')
})

test('calcularProximoTurno: reports jornada finalizada when all turnos of today are past or completed', () => {
  const ahora = { fecha: '2026-06-15', hora: '19:00' }
  const turnos = [
    { id_turno: 1, fecha_turno: '2026-06-15T03:00:00.000Z', hora_turno: '17:00:00', estado: 'completado' },
    { id_turno: 2, fecha_turno: '2026-06-15T03:00:00.000Z', hora_turno: '18:00:00', estado: 'confirmado' },
    // Tomorrow has turnos, but today is done:
    { id_turno: 3, fecha_turno: '2026-06-16T03:00:00.000Z', hora_turno: '09:00:00', estado: 'confirmado' },
  ]

  const res = calcularProximoTurno({ turnos, ahora })
  assert.equal(res.turno, null)
  assert.equal(res.estadoJornada, 'finalizada')
})

test('calcularProximoTurno: picks earliest upcoming turno when multiple are within window', () => {
  const ahora = { fecha: '2026-06-15', hora: '09:10' }
  const turnos = [
    { id_turno: 2, fecha_turno: '2026-06-15T03:00:00.000Z', hora_turno: '11:00:00', estado: 'confirmado' },
    { id_turno: 1, fecha_turno: '2026-06-15T03:00:00.000Z', hora_turno: '09:30:00', estado: 'confirmado' },
  ]

  const res = calcularProximoTurno({ turnos, ahora })
  assert.equal(res.turno?.id_turno, 1)
})
