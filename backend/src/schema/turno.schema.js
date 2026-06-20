import { z } from 'zod';

export const crearTurnoSchema = z.object({
  dni_profesional: z.coerce.number().int().positive(),
  dni_cliente: z.coerce.number().int().positive(),
  fecha_turno: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe ser YYYY-MM-DD'),
  hora_turno: z.string().regex(/^\d{2}:\d{2}$/, 'hora debe ser HH:MM'),
})
  .refine(
    (d) => new Date(`${d.fecha_turno}T${d.hora_turno}:00`) >= new Date(),
    { message: 'no se puede reservar un turno en el pasado', path: ['fecha_turno'] }
  );