import { z } from 'zod';

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
