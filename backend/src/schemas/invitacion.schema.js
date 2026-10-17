import { z } from "zod"
import { baseAccountShape, passwordsMatch, passwordsMatchError } from "./auth.schema.js"

const dni = baseAccountShape.dni

export const crearInvitacionSchema = z.strictObject({
  dni,
  correo: baseAccountShape.correo,
  role: z.enum(["profesional", "admin"]).default("admin"),
})

export const idInvitacionSchema = z.coerce.number().int().positive()

// Personal data is only required when the invited DNI is a brand new person;
// AccountService ignores it for an existing one (its stored data is kept).
export const datosPersonaSchema = z.object({
  nombre: baseAccountShape.nombre,
  apellido: baseAccountShape.apellido,
  genero: baseAccountShape.genero,
  fecha_nacimiento: baseAccountShape.fecha_nacimiento,
  telefono: baseAccountShape.telefono,
})

export const aceptarInvitacionSchema = z.strictObject({
  password: baseAccountShape.password,
  confirm: baseAccountShape.confirm,
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  genero: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  telefono: z.string().nullish(),
  numero_matricula: z.string().optional(),
}).refine(passwordsMatch, passwordsMatchError)
