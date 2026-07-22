import z from "zod"

export const clienteDataSchema = z.object({
  nombre: z.string(),
  apellido: z.string(),
  correo: z.email().max(255),
  fecha_nacimiento: z.iso.date(),
  genero: z.enum(["M", "F", "X"]),
  obra_social: z.string(),
  foto_url: z.string()
})