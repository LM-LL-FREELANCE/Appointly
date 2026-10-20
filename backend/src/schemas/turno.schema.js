import { z } from 'zod';
import { fechaEnDias, yaComenzo } from '../utils/time.js';

export const crearTurnoSchema = z.object({
  dni_profesional: z.coerce.number().int().positive(),
  dni_cliente: z.coerce.number().int().positive().optional(),
  fecha_turno: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe ser YYYY-MM-DD'),
  hora_turno: z.string().regex(/^\d{2}:\d{2}$/, 'hora debe ser HH:MM'),
})
  .refine(
    (d) => new Date(`${d.fecha_turno}T${d.hora_turno}:00`) >= new Date(),
    { message: 'no se puede reservar un turno en el pasado', path: ['fecha_turno'] }
  );

// States a user may set through PATCH /turnos/:id/estado. cancelado and
// reprogramado have their own endpoints; pendiente_confirmacion is never a target.
export const ESTADOS_SETEABLES = ['confirmado', 'en_espera', 'en_curso', 'completado', 'ausente']

export const cambiarEstadoSchema = z.object({
  estado: z.enum(ESTADOS_SETEABLES),
  motivo: z.string().trim().max(255).optional(),
})


// Cancel body: motivo is optional, trimmed, at most 255 chars (turno.motivo_cancelacion is
// VARCHAR(255)); an empty or blank one is stored as NULL.
export const cancelarTurnoSchema = z.object({
  motivo: z.string().trim().max(255).nullish().transform((m) => m || null),
})

const esFechaReal = (s) => fechaEnDias(0, s) === s // rejects 2030-02-30 (Date would roll it over)

export const reprogramarTurnoSchema = z.object({
  fecha_turno: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe ser YYYY-MM-DD')
    .refine(esFechaReal, 'la fecha no existe'),
  hora_turno: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'hora debe ser HH:MM'),
  motivo: z.string().trim().max(255).nullish().transform((m) => m || null),
})
  .refine(
    (d) => !yaComenzo(d.fecha_turno, d.hora_turno),
    { message: 'la nueva fecha y hora deben ser futuras', path: ['fecha_turno'] }
  );

export const reasignarTurnoSchema = z.object({
  dni_profesional: z.coerce.number().int().positive('Debés elegir un profesional válido'),
  motivo: z.string().trim().max(255).nullish().transform((m) => m || null),
});

