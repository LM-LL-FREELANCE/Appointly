import z from "zod"

export const profesionalesDataSchema = z.object({
  nombre: z.string(),
  apellido: z.string(),
  correo: z.email(),
  fecha_nacimiento: z.iso.date(),
  genero: z.enum(["M", "F", "X"]),
  especialidades: z.array(z.string()),
  obras_sociales: z.array(z.string())
})