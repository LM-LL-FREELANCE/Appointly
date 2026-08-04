import { z } from 'zod'

const dniSchema = z.string().trim().regex(/^\d{7,8}$/, 'DNI inválido')

export const loginSchema = z.strictObject({
  dni: dniSchema,
  password: z.string().min(1, "Password is required"),
  role: z.enum(['cliente', 'profesional'])
})

export const registerSchema = z.strictObject({
  dni: dniSchema,
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  correo: z.email().max(255),
  genero: z.enum(["M", "F", "X"]),
  fecha_nacimiento: z.iso.date(),
  password: z.string().min(6),
  confirm: z.string(),
  id_obra_social: z.number().optional(),
}).refine((data) => data.password === data.confirm, {
  error: "Las contraseñas no coinciden",
  path: ["confirm"],
})

export const registerProfesionalSchema = z.object({
  dni: dniSchema,
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  correo: z.email().max(255),
  genero: z.enum(["M", "F", "X"]),
  fecha_nacimiento: z.iso.date(),
  password: z.string().min(6),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, {
  error: "Las contraseñas no coinciden",
  path: ["confirm"],
})
